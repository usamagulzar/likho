import {
  createClientId,
  isBlankContent,
  nextUpdatedAt,
  sortNoteSummaries,
  summarizeNote,
} from "@/lib/store/logic";
import type { Note, NoteSummary } from "@/lib/types";

/** Soft-deleted guest notes are kept this long, then dropped on the next storage read. */
export const GUEST_PURGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** A guest note as stored. `deletedAt` marks a soft delete. */
export interface GuestNoteRecord {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface GuestState {
  notes: GuestNoteRecord[];
  activeId?: string;
}

export const EMPTY_GUEST_STATE: GuestState = { notes: [] };

function isLive(note: GuestNoteRecord): boolean {
  return note.deletedAt === undefined;
}

function findLive(state: GuestState, id: string | undefined): GuestNoteRecord | undefined {
  if (id === undefined) return undefined;
  return state.notes.find((note) => note.id === id && isLive(note));
}

function replaceNote(notes: GuestNoteRecord[], next: GuestNoteRecord): GuestNoteRecord[] {
  return notes.map((note) => (note.id === next.id ? next : note));
}

function blankNote(now: number): GuestNoteRecord {
  return { id: createClientId(), content: "", createdAt: now, updatedAt: now };
}

function tombstone(note: GuestNoteRecord, now: number): GuestNoteRecord {
  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: nextUpdatedAt(note.updatedAt, now),
    deletedAt: now,
  };
}

function byUpdatedDesc(left: GuestNoteRecord, right: GuestNoteRecord): number {
  return right.updatedAt - left.updatedAt;
}

/** Drops soft-deleted notes whose deletion is older than the purge window. */
export function purgeExpiredNotes(state: GuestState, now: number): GuestState {
  const cutoff = now - GUEST_PURGE_AFTER_MS;
  const notes = state.notes.filter(
    (note) => note.deletedAt === undefined || note.deletedAt > cutoff,
  );
  return notes.length === state.notes.length ? state : { ...state, notes };
}

/**
 * Keeps the state usable: purges expired notes, points the active id at a live note,
 * and makes sure at least one live note exists (a blank one if needed).
 */
export function normalizeGuestState(state: GuestState, now: number): GuestState {
  const purged = purgeExpiredNotes(state, now);
  if (findLive(purged, purged.activeId)) return purged;

  const live = purged.notes.filter(isLive).sort(byUpdatedDesc);
  const fallback = live.find((note) => !isBlankContent(note.content)) ?? live[0];
  if (fallback) return { ...purged, activeId: fallback.id };

  const blank = blankNote(now);
  return { notes: [...purged.notes, blank], activeId: blank.id };
}

/** A blank note being left never had content, so it is dropped rather than kept around. */
function notesWithoutBlankActive(state: GuestState, now: number): GuestNoteRecord[] {
  const previous = findLive(state, state.activeId);
  if (!previous || !isBlankContent(previous.content)) return state.notes;
  return replaceNote(state.notes, tombstone(previous, now));
}

export function selectNote(state: GuestState, id: string, now: number): GuestState {
  if (state.activeId === id || !findLive(state, id)) return state;
  return { notes: notesWithoutBlankActive(state, now), activeId: id };
}

export function createBlankNote(state: GuestState, now: number): GuestState {
  const blank = blankNote(now);
  return { notes: [...notesWithoutBlankActive(state, now), blank], activeId: blank.id };
}

export function updateActiveContent(state: GuestState, content: string, now: number): GuestState {
  const active = findLive(state, state.activeId);
  if (!active || active.content === content) return state;
  const next = { ...active, content, updatedAt: nextUpdatedAt(active.updatedAt, now) };
  return { ...state, notes: replaceNote(state.notes, next) };
}

export function removeNote(state: GuestState, id: string, now: number): GuestState {
  const target = findLive(state, id);
  if (!target) return state;
  const notes = replaceNote(state.notes, tombstone(target, now));
  const activeId = state.activeId === id ? undefined : state.activeId;
  return normalizeGuestState({ notes, activeId }, now);
}

export function restoreNote(state: GuestState, id: string, now: number): GuestState {
  const target = state.notes.find((note) => note.id === id);
  if (!target || isLive(target)) return state;
  const restored: GuestNoteRecord = {
    id: target.id,
    content: target.content,
    createdAt: target.createdAt,
    updatedAt: nextUpdatedAt(target.updatedAt, now),
  };
  return { notes: replaceNote(notesWithoutBlankActive(state, now), restored), activeId: id };
}

/** The list the UI shows: live notes, with blank notes only while they are active. */
export function visibleGuestNotes(state: GuestState): NoteSummary[] {
  return sortNoteSummaries(
    state.notes
      .filter(
        (note) => isLive(note) && (!isBlankContent(note.content) || note.id === state.activeId),
      )
      .map((note) => summarizeNote(note)),
  );
}

export function activeGuestNote(state: GuestState): Note | null {
  const active = findLive(state, state.activeId);
  if (!active) return null;
  return {
    id: active.id,
    content: active.content,
    createdAt: active.createdAt,
    updatedAt: active.updatedAt,
  };
}

/** Ids whose record changed between two states. Records are replaced, never mutated. */
export function changedNoteIds(previous: GuestState, next: GuestState): string[] {
  const before = new Map(previous.notes.map((note) => [note.id, note]));
  return next.notes.filter((note) => before.get(note.id) !== note).map((note) => note.id);
}

function newerOf(
  local: GuestNoteRecord | undefined,
  stored: GuestNoteRecord | undefined,
): GuestNoteRecord | undefined {
  if (!local) return stored;
  if (!stored) return local;
  return local.updatedAt >= stored.updatedAt ? local : stored;
}

/**
 * Combines storage with this tab's in-memory state. Storage is the source of truth, except
 * for notes this tab changed and has not written yet (`dirty`). For those, the newer copy
 * wins. This keeps edits from other tabs, and a sign-in migration, from being overwritten.
 */
export function mergeGuestState(
  storage: GuestState,
  memory: GuestState,
  dirty: ReadonlySet<string>,
): GuestState {
  const stored = new Map(storage.notes.map((note) => [note.id, note]));
  const local = new Map(memory.notes.map((note) => [note.id, note]));
  const ids = new Set([...Array.from(stored.keys()), ...Array.from(dirty)]);

  const notes: GuestNoteRecord[] = [];
  ids.forEach((id) => {
    const picked = newerOf(dirty.has(id) ? local.get(id) : undefined, stored.get(id));
    if (picked) notes.push(picked);
  });

  const activeId = findLive({ notes }, memory.activeId) ? memory.activeId : undefined;
  return { notes, activeId };
}
