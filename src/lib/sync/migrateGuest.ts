import { dropSyncedGuestNotes, readGuestState } from "@/lib/store/guest";
import type { GuestNoteRecord } from "@/lib/store/guestState";
import { isBlankContent } from "@/lib/store/logic";

import { NotesApiError, saveNote } from "./client";

export interface GuestMigrationResult {
  /** Notes that no longer need guest storage: saved to the account, or deleted there. */
  synced: number;
  /** Notes kept in guest storage for the next attempt. */
  failed: number;
}

/**
 * Sends one guest note to the account. Returns true when the note can leave guest storage.
 * A 404 means this id was deleted on the account with a newer timestamp, so retrying cannot
 * succeed and the note is treated as settled. Other failures (offline, 401, 5xx) are retried.
 */
async function sendGuestNote(note: GuestNoteRecord): Promise<boolean> {
  try {
    await saveNote({ id: note.id, content: note.content, updatedAt: note.updatedAt });
    return true;
  } catch (error) {
    return error instanceof NotesApiError && error.kind === "not-found";
  }
}

/**
 * Moves every non-empty, non-deleted guest note to the account. Each note keeps its own id,
 * so a retry is idempotent. Storage is only changed for notes that were sent unchanged.
 */
export async function migrateGuestNotes(): Promise<GuestMigrationResult> {
  if (typeof window === "undefined") return { synced: 0, failed: 0 };

  const candidates = readGuestState().notes.filter(
    (note) => note.deletedAt === undefined && !isBlankContent(note.content),
  );

  const outcomes = await Promise.all(
    candidates.map(async (note) => ({ note, done: await sendGuestNote(note) })),
  );

  const synced = new Map<string, number>();
  for (const { note, done } of outcomes) {
    if (done) synced.set(note.id, note.updatedAt);
  }
  dropSyncedGuestNotes(synced);

  return { synced: synced.size, failed: candidates.length - synced.size };
}

/** Name kept from the original module so existing imports keep working. */
export const migrateGuestNote = migrateGuestNotes;

interface MigrationRun {
  userId: string;
  result: Promise<GuestMigrationResult>;
}

let currentRun: MigrationRun | null = null;

function forgetRun(run: MigrationRun): void {
  if (currentRun === run) currentRun = null;
}

/**
 * Runs the guest-to-account migration once per signed-in user for this page session.
 * Concurrent calls share one in-flight run (React strict mode runs effects twice). A run
 * that left failures, or threw, is forgotten so the next call retries it.
 */
export function migrateGuestOnce(userId: string): Promise<GuestMigrationResult> {
  if (currentRun && currentRun.userId === userId) return currentRun.result;

  const run: MigrationRun = { userId, result: migrateGuestNotes() };
  currentRun = run;
  void run.result.then(
    (outcome) => {
      if (outcome.failed > 0) forgetRun(run);
    },
    () => forgetRun(run),
  );
  return run.result;
}

/** Forgets the completed run, e.g. on sign-out, so the next sign-in migrates again. */
export function resetGuestMigration(): void {
  currentRun = null;
}
