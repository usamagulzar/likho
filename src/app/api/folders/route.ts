import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, notes } from "@/db/schema";

import { apiError, getSessionUserId, jsonResponse, serviceUnavailable, toApiFolder } from "./_shared";

export async function GET(): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [folderRows, noteRows] = await Promise.all([
      database.select().from(folders).where(eq(folders.userId, userId)).orderBy(asc(folders.createdAt)),
      database
        .select({ id: notes.id, folderId: notes.folderId })
        .from(notes)
        .where(and(eq(notes.userId, userId), isNull(notes.deletedAt), isNotNull(notes.folderId))),
    ]);

    const assignments: Record<string, string> = {};
    for (const row of noteRows) {
      if (row.folderId) assignments[row.id] = row.folderId;
    }

    return jsonResponse({ folders: folderRows.map(toApiFolder), assignments });
  } catch {
    return serviceUnavailable();
  }
}
