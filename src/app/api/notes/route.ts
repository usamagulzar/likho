import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { deriveTitle } from "@/lib/types";

import { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "./_shared";

export async function GET(): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const rows = await database
      .select({ id: notes.id, content: notes.content, updatedAt: notes.updatedAt })
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .orderBy(desc(notes.updatedAt));

    return jsonResponse(
      rows.map((note) => ({
        id: note.id,
        title: deriveTitle(note.content),
        updatedAt: note.updatedAt.getTime(),
      })),
    );
  } catch {
    return serviceUnavailable();
  }
}
