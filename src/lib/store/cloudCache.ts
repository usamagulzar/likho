// Storage I/O for the per-user cloud cache. One localStorage key per user id, so one account's
// notes are never read while another account is signed in. A separate key remembers which user
// this device last signed in as, so the sign-out warning and the sign-out clear know whose notes
// they are dealing with.

import { parseCloudCache, countUnsavedInNotes, type CloudCache } from "@/lib/store/cloudState";

export const CLOUD_CACHE_PREFIX = "notes:cloud:v1:";
export const CLOUD_CURRENT_USER_KEY = "notes:cloud:current:v1";

export function cloudCacheKey(userId: string): string {
  return CLOUD_CACHE_PREFIX + userId;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads a user's cache. Returns null when there is none, it is invalid, or storage is blocked. */
export function readCloudCache(userId: string): CloudCache | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return parseCloudCache(storage.getItem(cloudCacheKey(userId)));
  } catch {
    return null;
  }
}

/** Writes a user's cache. Returns false when storage is blocked or full; the caller keeps its copy. */
export function writeCloudCache(userId: string, cache: CloudCache): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(cloudCacheKey(userId), JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

/** Remembers the signed-in user whose notes this device is holding. */
export function setCurrentCloudUser(userId: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(CLOUD_CURRENT_USER_KEY, userId);
  } catch {
    // Without it the sign-out warning reads 0; the notes themselves are still cached.
  }
}

/** The user id recorded by setCurrentCloudUser, or null when none is known. */
export function getCurrentCloudUser(): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(CLOUD_CURRENT_USER_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Number of the current user's cached notes with edits that are not in the database. Other
 * accounts' leftovers on this device are not counted. 0 when no user is known or storage is blocked.
 */
export function countUnsavedCloudNotes(): number {
  const userId = getCurrentCloudUser();
  if (userId === null) return 0;
  const cache = readCloudCache(userId);
  return cache ? countUnsavedInNotes(cache.notes) : 0;
}

/** Sessions created in this page, so clearing can stop them from writing again. */
export interface DiscardableSession {
  readonly userId: string;
  discard(): void;
}

const liveSessions = new Set<DiscardableSession>();

export function registerLiveSession(session: DiscardableSession): void {
  liveSessions.add(session);
}

/**
 * Removes the current user's cached notes and forgets the current user. Only the explicit Sign out
 * action calls this: on session expiry or tab close the cache is kept, so unsaved work comes back
 * after signing in again. Safe to call when nothing is cached.
 */
export function clearCurrentUserCloudCache(): void {
  const userId = getCurrentCloudUser();
  const storage = getLocalStorage();
  if (storage) {
    try {
      if (userId !== null) storage.removeItem(cloudCacheKey(userId));
      storage.removeItem(CLOUD_CURRENT_USER_KEY);
    } catch {
      // Storage blocked: nothing was written, so nothing to remove.
    }
  }

  for (const session of Array.from(liveSessions)) {
    if (userId === null || session.userId !== userId) continue;
    liveSessions.delete(session);
    try {
      session.discard();
    } catch {
      // A stale subscriber must not prevent cache cleanup or retain other live sessions.
    }
  }
}
