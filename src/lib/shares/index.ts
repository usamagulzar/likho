import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { noteShares, notes } from "@/db/schema";

import { generateShareSlug, SLUG_RE } from "./slug";

export { SLUG_RE };

export interface ShareInfo {
  slug: string;
  createdAt: Date;
}

export interface SharedNote {
  title: string;
  body: string;
  content: string;
  updatedAt: Date;
}

type CreateShareWithStatusResult =
  | { ok: true; share: ShareInfo; created: boolean }
  | { ok: false; reason: "not_found" | "database" };

function requireDatabase() {
  const database = getDb();
  if (!database) throw new Error("Database unavailable");
  return database;
}

export async function getActiveShare(userId: string, noteId: string): Promise<ShareInfo | null> {
  const database = requireDatabase();
  const [share] = await database
    .select({ slug: noteShares.slug, createdAt: noteShares.createdAt })
    .from(noteShares)
    .innerJoin(
      notes,
      and(eq(noteShares.noteId, notes.id), eq(noteShares.userId, notes.userId)),
    )
    .where(
      and(
        eq(noteShares.userId, userId),
        eq(noteShares.noteId, noteId),
        isNull(noteShares.revokedAt),
        isNull(notes.deletedAt),
      ),
    )
    .limit(1);

  return share ?? null;
}

export async function createShareWithStatus(
  userId: string,
  noteId: string,
): Promise<CreateShareWithStatusResult> {
  const database = getDb();
  if (!database) return { ok: false, reason: "database" };

  try {
    const [note] = await database
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    if (!note) return { ok: false, reason: "not_found" };

    // Neon HTTP does not support interactive transactions. Let the partial unique
    // index arbitrate concurrent creates, then re-select the winner by owner/note.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const [inserted] = await database
        .insert(noteShares)
        .values({ userId, noteId, slug: generateShareSlug() })
        .onConflictDoNothing({
          target: noteShares.noteId,
          where: isNull(noteShares.revokedAt),
        })
        .returning({ slug: noteShares.slug, createdAt: noteShares.createdAt });

      if (inserted) return { ok: true, share: inserted, created: true };

      const [active] = await database
        .select({ slug: noteShares.slug, createdAt: noteShares.createdAt })
        .from(noteShares)
        .where(
          and(
            eq(noteShares.userId, userId),
            eq(noteShares.noteId, noteId),
            isNull(noteShares.revokedAt),
          ),
        )
        .limit(1);

      if (active) return { ok: true, share: active, created: false };

      const [stillOwned] = await database
        .select({ id: notes.id })
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId), isNull(notes.deletedAt)))
        .limit(1);

      if (!stillOwned) return { ok: false, reason: "not_found" };
    }

    return { ok: false, reason: "database" };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function createShare(
  userId: string,
  noteId: string,
): Promise<{ ok: true; share: ShareInfo } | { ok: false; reason: "not_found" | "database" }> {
  const result = await createShareWithStatus(userId, noteId);
  if (!result.ok) return result;
  return { ok: true, share: result.share };
}

export async function revokeShare(
  userId: string,
  noteId: string,
): Promise<"revoked" | "not_shared" | "not_found"> {
  const database = requireDatabase();
  const [note] = await database
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);

  if (!note) return "not_found";

  const [revoked] = await database
    .update(noteShares)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(noteShares.userId, userId),
        eq(noteShares.noteId, noteId),
        isNull(noteShares.revokedAt),
      ),
    )
    .returning({ id: noteShares.id });

  return revoked ? "revoked" : "not_shared";
}

export async function getSharedNote(slug: string): Promise<SharedNote | null> {
  if (!SLUG_RE.test(slug)) return null;

  const database = requireDatabase();
  const [row] = await database
    .select({ content: notes.content, updatedAt: notes.updatedAt })
    .from(noteShares)
    .innerJoin(
      notes,
      and(eq(noteShares.noteId, notes.id), eq(noteShares.userId, notes.userId)),
    )
    .where(
      and(
        eq(noteShares.slug, slug),
        isNull(noteShares.revokedAt),
        isNull(notes.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  const newlineIndex = row.content.indexOf("\n");
  const title = newlineIndex === -1 ? row.content : row.content.slice(0, newlineIndex);
  const body = newlineIndex === -1 ? "" : row.content.slice(newlineIndex + 1);

  return {
    title: title || "Untitled note",
    body,
    content: row.content,
    updatedAt: row.updatedAt,
  };
}
