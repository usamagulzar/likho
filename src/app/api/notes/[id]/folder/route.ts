import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { notes } from "@/db/schema";

import { ownsFolder, readSmallJson, noteFolderBodySchema } from "../../../folders/_shared";
import { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "../../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noteIdSchema = z.string().uuid();

/** Moves a note into a folder (or back to the top level with null). Does not touch updated_at. */
export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const parsed = await readSmallJson(request, noteFolderBodySchema);
    if (!parsed.ok) return parsed.response;
    const { folderId } = parsed.data;

    const database = getDb();
    if (!database) return serviceUnavailable();

    if (folderId && !(await ownsFolder(database, userId, folderId))) {
      return apiError(404, "Folder not found.");
    }

    const [updated] = await database
      .update(notes)
      .set({ folderId })
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .returning({ id: notes.id });

    // 404 also covers a note that has not been saved to the database yet. The client keeps it pending.
    return updated ? jsonResponse({ id: updated.id, folderId }) : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}
