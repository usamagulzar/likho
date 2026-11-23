// Pure helpers for signed-in notes. No React, no storage, no network: every rule that decides
// what a note's content is, what counts as unsaved, and how the cache and the server are merged
// lives here so it can be tested directly.

import { z } from "zod";

import { deriveTitle, type Note, type NoteSummary } from "@/lib/types";
import { isBlankContent } from "@/lib/store/logic";

export const CLOUD_CACHE_VERSION = 1;

/** A note as kept in the per-user localStorage cache. */
export interface CloudNote {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  /** Server updatedAt this edit was based on. null = never saved to the database. */
  baseUpdatedAt: number | null;
  /** Local edits that are not in the database yet. */
  dirty: boolean;
  /** Set when the note was deleted locally and the delete has not reached the database yet. */
  deletedAt?: number;
}

export interface CloudCache {
  version: 1;
  notes: CloudNote[];
  activeId?: string;
  syncedAt?: number;
}

/** The server's view of a note, as far as merging needs it. */
export type ServerVersions = ReadonlyMap<string, { updatedAt: number }>;

const timestamp = z.number().int().nonnegative();

const cloudNoteSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
  baseUpdatedAt: timestamp.nullable(),
  dirty: z.boolean(),
  deletedAt: timestamp.optional(),
});

const cloudCacheSchema = z.object({
  version: z.literal(CLOUD_CACHE_VERSION),
  notes: z.array(z.unknown()),
  activeId: z.uuid().optional(),
  syncedAt: timestamp.optional(),
});

/**
 * Parses a stored cache. Anything malformed is dropped rather than trusted: an invalid note is
 * skipped, a duplicate id keeps its first copy, and a note with no base is always dirty.
 */
export function parseCloudCache(raw: string | null): CloudCache | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const header = cloudCacheSchema.safeParse(value);
  if (!header.success) return null;

  const seen = new Set<string>();
  const notes: CloudNote[] = [];
  for (const item of header.data.notes) {
    const parsed = cloudNoteSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    const note = parsed.data;
    notes.push({
      ...note,
      dirty: note.baseUpdatedAt === null ? true : note.dirty,
    });
  }

  const cache: CloudCache = { version: CLOUD_CACHE_VERSION, notes };
  if (header.data.activeId !== undefined) cache.activeId = header.data.activeId;
  if (header.data.syncedAt !== undefined) cache.syncedAt = header.data.syncedAt;
  return cache;
}

/** A note that has never reached the database and has no text: nothing to save or keep. */
export function isGhostNote(note: CloudNote, activeId: string | undefined): boolean {
  return (
    note.baseUpdatedAt === null &&
    isBlankContent(note.content) &&
    note.deletedAt === undefined &&
    note.id !== activeId
  );
}

/** True when the note has text the database does not have. Blank new notes have nothing to save. */
export function hasUnsavedEdits(note: CloudNote): boolean {
  if (note.deletedAt !== undefined) return false;
  if (note.baseUpdatedAt === null) return !isBlankContent(note.content);
  return note.dirty;
}

/** Ids that should still be in the cache after a write. Ghosts are dropped, tombstones kept. */
export function pruneGhostNotes(notes: readonly CloudNote[], activeId: string | undefined): CloudNote[] {
  return notes.filter((note) => !isGhostNote(note, activeId));
}

/** Text for the copy kept when an edit conflicts with a newer server version. */
export function conflictCopyContent(content: string): string {
  const newline = content.search(/\r?\n/);
  const firstLine = newline === -1 ? content : content.slice(0, newline);
  const rest = newline === -1 ? "" : content.slice(newline);
  const title = firstLine.trim() || "Untitled note";
  return `${title} (unsaved copy)${rest}`;
}

/**
 * Merges the local cache with the server's list of notes. Server content is not part of the list,
 * so a clean note whose server version moved on is dropped here and fetched when it is opened.
 *
 * - Clean note, same server version: kept.
 * - Clean note, server changed or gone: dropped (refetched on demand, or simply gone).
 * - Dirty note, server unchanged since its base: kept, so its edits can be saved.
 * - Dirty note, server deleted it: kept as a never-saved note, so no text is lost.
 * - Dirty note, server changed since its base (edited on two devices): the local text becomes a
 *   separate "(unsaved copy)" note and the server version wins for the original id.
 * - Pending delete: kept until the delete reaches the server.
 * - Save in flight: kept as it is, because the save's response decides the note's state.
 */
export function mergeWithServer(
  local: readonly CloudNote[],
  server: ServerVersions,
  activeId: string | undefined,
  saving: Iterable<string>,
  newId: () => string,
): CloudNote[] {
  const inFlight = new Set(saving);
  const out: CloudNote[] = [];
  for (const note of local) {
    if (inFlight.has(note.id)) {
      out.push(note);
      continue;
    }
    if (note.deletedAt !== undefined) {
      if (note.baseUpdatedAt !== null) out.push(note);
      continue;
    }

    const remote = server.get(note.id);
    if (note.baseUpdatedAt === null) {
      if (!remote) {
        if (!isGhostNote(note, activeId)) out.push(note);
        continue;
      }
      // Same id exists on the server but this copy was never saved: keep its text as a copy.
      if (!isBlankContent(note.content)) out.push(unsavedCopy(note, newId));
      continue;
    }

    if (!note.dirty) {
      if (remote && remote.updatedAt === note.baseUpdatedAt) out.push(note);
      continue;
    }

    if (!remote) {
      out.push({ ...note, baseUpdatedAt: null });
      continue;
    }
    if (remote.updatedAt === note.baseUpdatedAt) {
      out.push(note);
      continue;
    }
    out.push(unsavedCopy(note, newId));
  }
  return out;
}

function unsavedCopy(note: CloudNote, newId: () => string): CloudNote {
  return {
    id: newId(),
    content: conflictCopyContent(note.content),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    baseUpdatedAt: null,
    dirty: true,
  };
}

export interface SaveAttempt {
  id: string;
  content: string;
  updatedAt: number;
}

export interface SaveReconciliation {
  /** The note as it should be stored after the response. */
  note: CloudNote;
  /** A copy holding local text the server did not accept, when there was a conflict. */
  copy: CloudNote | null;
}

/**
 * Applies a successful PUT to the local note. The note is clean only if what the user has now
 * equals what the server holds. Edits made while the request was in flight stay dirty.
 */
export function reconcileSave(
  local: CloudNote,
  sent: SaveAttempt,
  response: Note,
  copyId: string,
): SaveReconciliation {
  if (local.content === response.content) {
    return {
      note: { ...local, baseUpdatedAt: response.updatedAt, dirty: false },
      copy: null,
    };
  }

  const accepted = response.updatedAt === sent.updatedAt && response.content === sent.content;
  if (accepted) {
    // The server took our version; the user has typed more since.
    return { note: { ...local, baseUpdatedAt: response.updatedAt, dirty: true }, copy: null };
  }

  // The server kept a newer version. Take it for the original id; keep our text as a copy.
  return {
    note: {
      id: local.id,
      content: response.content,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      baseUpdatedAt: response.updatedAt,
      dirty: false,
    },
    copy: {
      id: copyId,
      content: conflictCopyContent(local.content),
      createdAt: local.createdAt,
      updatedAt: local.updatedAt,
      baseUpdatedAt: null,
      dirty: true,
    },
  };
}

/**
 * Combines the notes stored by another tab with this tab's notes. Ids this tab changed since its
 * last write are taken from memory; every other id takes the stored copy, so another tab's edits
 * are not overwritten by writing a stale view back.
 */
export function reconcileWithStorage(
  stored: readonly CloudNote[],
  memory: readonly CloudNote[],
  touched: ReadonlySet<string>,
): CloudNote[] {
  const storedById = new Map(stored.map((note) => [note.id, note]));
  const memoryById = new Map(memory.map((note) => [note.id, note]));
  const ids = new Set([...memoryById.keys(), ...storedById.keys()]);

  const out: CloudNote[] = [];
  for (const id of ids) {
    const picked = touched.has(id)
      ? memoryById.get(id)
      : (storedById.get(id) ?? memoryById.get(id));
    if (picked) out.push(picked);
  }
  return out;
}

export interface CloudListInput {
  notes: readonly CloudNote[];
  server: ReadonlyMap<string, NoteSummary>;
  /** Ids removed in this tab whose content is still being fetched. Hidden from the list. */
  hidden: ReadonlySet<string>;
  activeId: string | undefined;
}

/** The list the sidebar shows: local notes first, then server notes this device has not loaded. */
export function listCloudNotes(input: CloudListInput): NoteSummary[] {
  const byId = new Map<string, NoteSummary>();
  const localIds = new Set(input.notes.map((note) => note.id));

  for (const summary of input.server.values()) {
    if (input.hidden.has(summary.id) || localIds.has(summary.id)) continue;
    byId.set(summary.id, { id: summary.id, title: summary.title, updatedAt: summary.updatedAt });
  }

  for (const note of input.notes) {
    if (note.deletedAt !== undefined || input.hidden.has(note.id)) continue;
    if (isGhostNote(note, input.activeId)) continue;
    const summary: NoteSummary = {
      id: note.id,
      title: deriveTitle(note.content),
      updatedAt: note.updatedAt,
    };
    if (hasUnsavedEdits(note)) summary.unsaved = true;
    byId.set(note.id, summary);
  }

  return Array.from(byId.values()).sort((left, right) => right.updatedAt - left.updatedAt);
}

/** Number of notes with edits that are not in the database, across the given caches. */
export function countUnsavedInNotes(notes: readonly CloudNote[]): number {
  return notes.filter((note) => note.deletedAt === undefined && hasUnsavedEdits(note)).length;
}
