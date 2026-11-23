import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { escapeLikeQuery, joinNoteContent, makeSnippet, splitNoteContent } from "./text";

type NoteRow = typeof notes.$inferSelect;

export interface ListedNote {
  id: string;
  title: string;
  updated_at: string;
  preview: string;
}

export interface SearchedNote {
  id: string;
  title: string;
  updated_at: string;
  snippet: string;
}

function requiredDb() {
  const db = getDb();
  if (!db) throw new Error("Notes database is unavailable");
  return db;
}

function toListedNote(row: Pick<NoteRow, "id" | "content" | "updatedAt">): ListedNote {
  const { title, body } = splitNoteContent(row.content);
  return {
    id: row.id,
    title,
    updated_at: row.updatedAt.toISOString(),
    preview: body.slice(0, 160),
  };
}

export async function listNotes(
  userId: string,
  limit: number,
  offset: number,
  includeDeleted: boolean,
): Promise<{ notes: ListedNote[]; total: number; next_offset: number | null }> {
  const db = requiredDb();
  const conditions = [eq(notes.userId, userId)];
  if (!includeDeleted) conditions.push(isNull(notes.deletedAt));
  const where = and(...conditions);

  const [totalRows, rows] = await Promise.all([
    db.select({ total: count() }).from(notes).where(where),
    db
      .select({ id: notes.id, content: notes.content, updatedAt: notes.updatedAt })
      .from(notes)
      .where(where)
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const nextOffset = offset + rows.length;
  return {
    notes: rows.map(toListedNote),
    total,
    next_offset: nextOffset < total ? nextOffset : null,
  };
}

export async function searchNotes(
  userId: string,
  query: string,
  limit: number,
): Promise<{ notes: SearchedNote[] }> {
  const db = requiredDb();
  const rows = await db
    .select({ id: notes.id, content: notes.content, updatedAt: notes.updatedAt })
    .from(notes)
    .where(and(eq(notes.userId, userId), isNull(notes.deletedAt), ilike(notes.content, `%${escapeLikeQuery(query)}%`)))
    .orderBy(desc(notes.updatedAt))
    .limit(limit);

  return {
    notes: rows.map((row) => {
      const { title } = splitNoteContent(row.content);
      return {
        id: row.id,
        title,
        updated_at: row.updatedAt.toISOString(),
        snippet: makeSnippet(row.content, query),
      };
    }),
  };
}

export async function getNote(userId: string, id: string): Promise<(NoteRow & { deleted: boolean }) | null> {
  const db = requiredDb();
  const [row] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);

  return row ? { ...row, deleted: row.deletedAt !== null } : null;
}

export async function createNote(userId: string, title: string, body: string): Promise<NoteRow> {
  const db = requiredDb();
  const [row] = await db
    .insert(notes)
    .values({ userId, content: joinNoteContent(title, body) })
    .returning();

  if (!row) throw new Error("Note insert returned no row");
  return row;
}

export async function updateNote(
  userId: string,
  id: string,
  updates: { title?: string; body?: string },
): Promise<NoteRow | null> {
  const db = requiredDb();
  const [current] = await db
    .select({ content: notes.content })
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);
  if (!current) return null;

  const currentParts = splitNoteContent(current.content);
  const content = joinNoteContent(
    updates.title ?? currentParts.title,
    updates.body ?? currentParts.body,
  );
  const [row] = await db
    .update(notes)
    .set({ content, updatedAt: sql<Date>`now()` })
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .returning();

  return row ?? null;
}

export async function appendToNote(
  userId: string,
  id: string,
  text: string,
  separator: "newline" | "blank_line" | "space",
): Promise<{ row: NoteRow; appendedChars: number } | null> {
  const db = requiredDb();
  const [current] = await db
    .select({ content: notes.content })
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);
  if (!current) return null;

  const { title, body } = splitNoteContent(current.content);
  const separatorText = separator === "blank_line" ? "\n\n" : separator === "space" ? " " : "\n";
  const appendedBody = body.length === 0 || text.length === 0 ? `${body}${text}` : `${body}${separatorText}${text}`;
  const [row] = await db
    .update(notes)
    .set({ content: joinNoteContent(title, appendedBody), updatedAt: sql<Date>`now()` })
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .returning();

  return row ? { row, appendedChars: text.length } : null;
}

export async function deleteNote(userId: string, id: string): Promise<string | null> {
  const db = requiredDb();
  const [row] = await db
    .update(notes)
    .set({ deletedAt: sql<Date>`now()`, updatedAt: sql<Date>`now()` })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });

  return row?.id ?? null;
}

export async function restoreNote(userId: string, id: string): Promise<string | null> {
  const db = requiredDb();
  const [row] = await db
    .update(notes)
    .set({ deletedAt: null, updatedAt: sql<Date>`now()` })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });

  return row?.id ?? null;
}
