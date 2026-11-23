import { z } from "zod";

import {
  EMPTY_GUEST_STATE,
  purgeExpiredNotes,
  type GuestNoteRecord,
  type GuestState,
} from "@/lib/store/guestState";
import { createClientId, isBlankContent } from "@/lib/store/logic";

export const GUEST_STORAGE_KEY = "notes:guest:v2";
export const GUEST_LEGACY_STORAGE_KEY = "notes:guest:v1";
export const GUEST_STORAGE_VERSION = 2;

const uuidSchema = z.uuid();

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validUuid(value: unknown): string | undefined {
  return typeof value === "string" && uuidSchema.safeParse(value).success ? value : undefined;
}

interface ParsedNote {
  record: GuestNoteRecord;
  /** True when the stored id was not a UUID and had to be replaced. */
  repaired: boolean;
}

// The account API only accepts UUID ids, so an invalid id is replaced once and the
// repair is written back by readGuestState (otherwise every read would mint a new id).
function parseNote(value: unknown): ParsedNote | null {
  if (!isObject(value)) return null;
  const { id, content, createdAt, updatedAt, deletedAt } = value;
  if (typeof content !== "string" || !isTimestamp(updatedAt)) return null;

  const validId = validUuid(id);
  const record: GuestNoteRecord = {
    id: validId ?? createClientId(),
    content,
    createdAt: isTimestamp(createdAt) ? createdAt : updatedAt,
    updatedAt,
  };
  if (isTimestamp(deletedAt)) record.deletedAt = deletedAt;
  return { record, repaired: validId === undefined };
}

function parseStoredState(raw: string | null): { state: GuestState; repaired: boolean } | null {
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || value.version !== GUEST_STORAGE_VERSION || !Array.isArray(value.notes)) {
    return null;
  }

  let repaired = false;
  const notes: GuestNoteRecord[] = [];
  for (const item of value.notes) {
    const parsed = parseNote(item);
    if (!parsed) {
      repaired = true;
      continue;
    }
    if (parsed.repaired) repaired = true;
    notes.push(parsed.record);
  }

  const activeId = typeof value.activeId === "string" ? value.activeId : undefined;
  return { state: { notes, activeId }, repaired };
}

/** The single-note v1 format: `{ content, updatedAt, id?, migrationId? }`. */
function parseLegacyNote(raw: string): GuestNoteRecord | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || typeof value.content !== "string" || !isTimestamp(value.updatedAt)) {
    return null;
  }

  // migrationId was the id the old migration sent to the account, so it is preferred.
  const id = validUuid(value.migrationId) ?? validUuid(value.id) ?? createClientId();
  return {
    id,
    content: value.content,
    createdAt: value.updatedAt,
    updatedAt: value.updatedAt,
  };
}

function removeKey(key: string): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Reads guest notes. Folds in a v1 note, purges expired deletions, and writes back changes. */
export function readGuestState(now = Date.now()): GuestState {
  const storage = getLocalStorage();
  if (!storage) return EMPTY_GUEST_STATE;

  try {
    const stored = parseStoredState(storage.getItem(GUEST_STORAGE_KEY));
    const legacyRaw = storage.getItem(GUEST_LEGACY_STORAGE_KEY);
    const legacy = legacyRaw === null ? null : parseLegacyNote(legacyRaw);

    let state: GuestState = stored?.state ?? EMPTY_GUEST_STATE;
    const legacyIsNew =
      legacy !== null &&
      !isBlankContent(legacy.content) &&
      !state.notes.some((note) => note.id === legacy.id);
    if (legacy && legacyIsNew) state = { ...state, notes: [...state.notes, legacy] };
    const purged = purgeExpiredNotes(state, now);

    if (legacyRaw !== null) {
      // Remove the v1 key only after v2 has been written, so a failed write loses nothing.
      if (persistOrClear(purged)) removeKey(GUEST_LEGACY_STORAGE_KEY);
    } else {
      const storedCount = stored?.state.notes.length ?? 0;
      const changed = stored?.repaired === true || purged.notes.length !== storedCount;
      if (changed) persistOrClear(purged);
    }
    return purged;
  } catch {
    return EMPTY_GUEST_STATE;
  }
}

/** Writes guest notes as v2. Returns false if storage is unavailable or full. */
export function writeGuestState(state: GuestState): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    const value = { version: GUEST_STORAGE_VERSION, notes: state.notes, activeId: state.activeId };
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function persistOrClear(state: GuestState): boolean {
  return state.notes.length === 0 ? removeKey(GUEST_STORAGE_KEY) : writeGuestState(state);
}

/** Removes both guest keys. Other keys (prefs, last opened note) are left alone. */
export function clearGuestState(): boolean {
  const removedV2 = removeKey(GUEST_STORAGE_KEY);
  const removedV1 = removeKey(GUEST_LEGACY_STORAGE_KEY);
  return removedV2 && removedV1;
}

/**
 * After a migration, drops the notes that were sent to the account. A note is only dropped
 * if it is unchanged since it was sent (same updatedAt), so an edit made meanwhile survives.
 * Once no unsynced note is left, the guest keys are cleared entirely.
 */
export function dropSyncedGuestNotes(synced: ReadonlyMap<string, number>): boolean {
  const current = readGuestState();
  const remaining = current.notes.filter((note) => synced.get(note.id) !== note.updatedAt);
  const hasUnsynced = remaining.some(
    (note) => note.deletedAt === undefined && !isBlankContent(note.content),
  );
  if (!hasUnsynced) return clearGuestState();
  return writeGuestState({ notes: remaining, activeId: current.activeId });
}
