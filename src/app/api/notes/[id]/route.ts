import { and, eq, isNull, lt, lte } from "drizzle-orm";
import { z } from "zod";

import { getDb, type Database } from "@/db";
import { notes } from "@/db/schema";
import type { Note } from "@/lib/types";

import {
  apiError,
  getSessionUserId,
  jsonResponse,
  readNotePayload,
  serviceUnavailable,
} from "../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noteIdSchema = z.string().uuid();

function toApiNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

async function updateIfNewer(
  database: Database,
  userId: string,
  id: string,
  content: string,
  updatedAt: Date,
): Promise<Response> {
  const [updated] = await database
    .update(notes)
    .set({ content, updatedAt })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        isNull(notes.deletedAt),
        lt(notes.updatedAt, updatedAt),
      ),
    )
    .returning();

  if (updated) return jsonResponse(toApiNote(updated));

  const [current] = await database
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);

  return current ? jsonResponse(toApiNote(current)) : apiError(404, "Note not found.");
}

async function restoreDeletedNote(
  database: Database,
  userId: string,
  id: string,
  content: string,
  updatedAt: Date,
  deletedAt: Date,
): Promise<Response> {
  const [restored] = await database
    .update(notes)
    .set({ content, updatedAt, deletedAt: null })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        eq(notes.deletedAt, deletedAt),
        lte(notes.updatedAt, updatedAt),
      ),
    )
    .returning();

  if (restored) return jsonResponse(toApiNote(restored));

  const [current] = await database
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);

  return current ? jsonResponse(toApiNote(current)) : apiError(404, "Note not found.");
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [note] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    return note ? jsonResponse(toApiNote(note)) : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const parsedBody = await readNotePayload(request);
    if (!parsedBody.ok) return parsedBody.response;

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [existing] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    if (existing) {
      if (existing.deletedAt) {
        return restoreDeletedNote(
          database,
          userId,
          id,
          parsedBody.payload.content,
          new Date(parsedBody.payload.updatedAt),
          existing.deletedAt,
        );
      }
      return updateIfNewer(
        database,
        userId,
        id,
        parsedBody.payload.content,
        new Date(parsedBody.payload.updatedAt),
      );
    }

    const updatedAt = new Date(parsedBody.payload.updatedAt);
    const [created] = await database
      .insert(notes)
      .values({
        id,
        userId,
        content: parsedBody.payload.content,
        updatedAt,
      })
      .onConflictDoNothing({ target: notes.id })
      .returning();

    if (created) return jsonResponse(toApiNote(created), 201);

    // A concurrent request may have created this user's id after the first read.
    // The scoped lookup keeps this path from revealing another user's note.
    const [concurrent] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    if (!concurrent) return apiError(404, "Note not found.");
    return updateIfNewer(
      database,
      userId,
      id,
      parsedBody.payload.content,
      updatedAt,
    );
  } catch {
    return serviceUnavailable();
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [deleted] = await database
      .update(notes)
      .set({ deletedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .returning({ id: notes.id });

    if (deleted) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

    const [existing] = await database
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    return existing
      ? new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } })
      : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}
