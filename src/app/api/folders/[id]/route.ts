import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, notes } from "@/db/schema";

import {
  apiError,
  folderBodySchema,
  folderIdSchema,
  getSessionUserId,
  jsonResponse,
  ownsFolder,
  readSmallJson,
  serviceUnavailable,
  toApiFolder,
  wouldCreateLoop,
} from "../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/** Creates the folder when the id is new, otherwise renames and/or moves it. Safe to retry. */
export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!folderIdSchema.safeParse(id).success) return apiError(400, "Invalid folder id.");

    const parsed = await readSmallJson(request, folderBodySchema);
    if (!parsed.ok) return parsed.response;
    const { name, parentId } = parsed.data;

    const database = getDb();
    if (!database) return serviceUnavailable();

    if (parentId) {
      if (!(await ownsFolder(database, userId, parentId))) return apiError(404, "Folder not found.");
    }

    const [existing] = await database.select().from(folders).where(eq(folders.id, id)).limit(1);
    // Another user's folder id looks the same as a missing one.
    if (existing && existing.userId !== userId) return apiError(404, "Folder not found.");

    if (!existing) {
      if (name === undefined) return apiError(400, "A folder name is required.");
      const [created] = await database
        .insert(folders)
        .values({ id, userId, name, parentId: parentId ?? null })
        .onConflictDoNothing({ target: folders.id })
        .returning();
      if (created) return jsonResponse(toApiFolder(created), 201);

      const [concurrent] = await database
        .select()
        .from(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, userId)))
        .limit(1);
      return concurrent ? jsonResponse(toApiFolder(concurrent)) : apiError(404, "Folder not found.");
    }

    if (parentId !== undefined && (await wouldCreateLoop(database, userId, id, parentId))) {
      return apiError(400, "A folder cannot be moved into itself.");
    }

    const [updated] = await database
      .update(folders)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();

    return updated ? jsonResponse(toApiFolder(updated)) : apiError(404, "Folder not found.");
  } catch {
    return serviceUnavailable();
  }
}

/** Deletes the folder only. Its notes and sub-folders move up one level. */
export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!folderIdSchema.safeParse(id).success) return apiError(400, "Invalid folder id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [existing] = await database
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .limit(1);
    if (!existing) return noContent();

    const newParent = existing.parentId;
    await database
      .update(folders)
      .set({ parentId: newParent, updatedAt: new Date() })
      .where(and(eq(folders.parentId, id), eq(folders.userId, userId)));
    await database
      .update(notes)
      .set({ folderId: newParent })
      .where(and(eq(notes.folderId, id), eq(notes.userId, userId)));
    await database.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));

    return noContent();
  } catch {
    return serviceUnavailable();
  }
}
