"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NoteStore, SaveResult } from "@/lib/types";
import { useSession } from "@/lib/auth-client";
import { migrateGuestOnce, resetGuestMigration } from "@/lib/sync/migrateGuest";
import { cloudCacheKey } from "@/lib/store/cloudCache";
import { EMPTY_CLOUD_SNAPSHOT, createCloudSession, type CloudSession } from "@/lib/store/cloudSession";
import {
  GUEST_LEGACY_STORAGE_KEY,
  GUEST_STORAGE_KEY,
  readGuestState,
  writeGuestState,
} from "@/lib/store/guest";
import {
  EMPTY_GUEST_STATE,
  activeGuestNote,
  changedNoteIds,
  createBlankNote,
  mergeGuestState,
  normalizeGuestState,
  removeNote,
  restoreNote,
  selectNote,
  updateActiveContent,
  visibleGuestNotes,
  type GuestState,
} from "@/lib/store/guestState";
import { isBlankContent } from "@/lib/store/logic";

const GUEST_SAVE_DELAY = 300;

interface GuestModel {
  state: GuestState;
  /** Guest notes never leave the device, so the only failure is a storage write. */
  saveState: "idle" | "error";
  /** False until guest notes have been read from storage. */
  loaded: boolean;
}

const initialGuestModel: GuestModel = { state: EMPTY_GUEST_STATE, saveState: "idle", loaded: false };

export function useNoteStore(): NoteStore {
  const { data: session, isPending } = useSession();
  const accountUserId = session?.user?.id ?? null;
  const accountMode = Boolean(accountUserId);
  // better-auth sets isPending again on every refetch while signed out, so latch the first
  // settled session. Otherwise `ready` would drop mid-typing for guests.
  const [sessionSettled, setSessionSettled] = useState(false);
  if (!isPending && !sessionSettled) setSessionSettled(true);

  // ---- guest mode (localStorage v2, saved on every edit) ----

  const [guest, setGuest] = useState<GuestModel>(initialGuestModel);
  const guestRef = useRef<GuestModel>(initialGuestModel);
  const guestDirtyRef = useRef(new Set<string>());
  const guestPendingRef = useRef(false);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitGuest = useCallback((next: GuestModel) => {
    guestRef.current = next;
    setGuest(next);
  }, []);

  const cancelGuestTimer = useCallback(() => {
    if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    guestTimerRef.current = null;
  }, []);

  // Writes this tab's pending changes, merged with whatever other tabs have stored.
  const flushGuest = useCallback(() => {
    cancelGuestTimer();
    if (!guestPendingRef.current) return;

    const now = Date.now();
    const merged = normalizeGuestState(
      mergeGuestState(readGuestState(now), guestRef.current.state, guestDirtyRef.current),
      now,
    );
    const written = writeGuestState(merged);
    if (written) {
      guestDirtyRef.current.clear();
      guestPendingRef.current = false;
    }
    commitGuest({ ...guestRef.current, state: merged, saveState: written ? "idle" : "error" });
  }, [cancelGuestTimer, commitGuest]);

  // Structural changes (select, create, remove, restore) save at once. Typing is debounced.
  const applyGuest = useCallback(
    (next: GuestState, immediate: boolean) => {
      const previous = guestRef.current.state;
      if (next === previous) return;

      for (const id of changedNoteIds(previous, next)) guestDirtyRef.current.add(id);
      guestPendingRef.current = true;
      commitGuest({ ...guestRef.current, state: next, saveState: "idle" });

      cancelGuestTimer();
      if (immediate) flushGuest();
      else guestTimerRef.current = setTimeout(flushGuest, GUEST_SAVE_DELAY);
    },
    [cancelGuestTimer, commitGuest, flushGuest],
  );

  // Reloads guest notes from storage. Runs on mount and after sign-out, so notes that were
  // migrated to the account are not shown again from memory.
  const hydrateGuest = useCallback(() => {
    flushGuest();
    guestDirtyRef.current.clear();
    guestPendingRef.current = false;
    const now = Date.now();
    commitGuest({
      state: normalizeGuestState(readGuestState(now), now),
      saveState: "idle",
      loaded: true,
    });
  }, [commitGuest, flushGuest]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (
        event.key !== GUEST_STORAGE_KEY &&
        event.key !== GUEST_LEGACY_STORAGE_KEY &&
        event.key !== null
      ) {
        return;
      }
      const now = Date.now();
      const merged = normalizeGuestState(
        mergeGuestState(readGuestState(now), guestRef.current.state, guestDirtyRef.current),
        now,
      );
      commitGuest({ ...guestRef.current, state: merged });
    };
    const onPageHide = () => flushGuest();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushGuest();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      flushGuest();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [commitGuest, flushGuest]);

  // ---- account mode (per-user cache in localStorage, saved to the database on Save) ----

  // The session belongs to one user. Signing out or switching users makes it stop matching, so the
  // previous user's notes are never shown, even in the render before the effect swaps it.
  const [cloud, setCloud] = useState<CloudSession | null>(null);
  // Derived during render, so the session matches the signed-in user before anything commits.
  if (accountUserId === null ? cloud !== null : cloud?.userId !== accountUserId) {
    setCloud(accountUserId === null ? null : createCloudSession(accountUserId));
  }
  const activeCloud = cloud !== null && cloud.userId === accountUserId ? cloud : null;

  const subscribeCloud = useCallback(
    (listener: () => void) => (activeCloud ? activeCloud.subscribe(listener) : () => undefined),
    [activeCloud],
  );
  const cloudSnapshot = useSyncExternalStore(
    subscribeCloud,
    () => (activeCloud ? activeCloud.getSnapshot() : EMPTY_CLOUD_SNAPSHOT),
    () => EMPTY_CLOUD_SNAPSHOT,
  );

  // Sign-out and sign-in: guest memory is reset, pending guest edits are written first.
  useEffect(() => {
    if (!accountUserId) {
      resetGuestMigration();
      // Syncing guest state from localStorage on sign-out is an external-system sync, not derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      hydrateGuest();
      return;
    }
    // Guest memory is not used while signed in; the guest keys stay for the migration to read.
    flushGuest();
    commitGuest({ ...initialGuestModel, loaded: false });
  }, [accountUserId, commitGuest, flushGuest, hydrateGuest]);

  // Each session starts once the guest migration has run, so migrated notes are in the list.
  useEffect(() => {
    if (!cloud || cloud.userId !== accountUserId) return;
    const session = cloud;
    let active = true;
    void migrateGuestOnce(session.userId)
      .catch(() => undefined)
      .then(() => {
        if (active) session.start();
      });

    const onPageHide = () => session.flush();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") session.flush();
    };
    const onOnline = () => {
      void session.refresh();
      session.retryDeletes();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === cloudCacheKey(session.userId) || event.key === null) {
        session.handleExternalChange();
      }
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
      session.dispose();
    };
  }, [cloud, accountUserId]);

  // ---- store API ----

  const select = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.select(id);
        return;
      }
      applyGuest(selectNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const create = useCallback(() => {
    if (accountMode) {
      activeCloud?.create();
      return;
    }
    applyGuest(createBlankNote(guestRef.current.state, Date.now()), true);
  }, [accountMode, activeCloud, applyGuest]);

  const update = useCallback(
    (content: string) => {
      if (accountMode) {
        activeCloud?.update(content);
        return;
      }
      applyGuest(updateActiveContent(guestRef.current.state, content, Date.now()), false);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const remove = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.remove(id);
        return;
      }
      applyGuest(removeNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const restore = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.restore(id);
        return;
      }
      applyGuest(restoreNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const save = useCallback(async (): Promise<SaveResult> => {
    if (accountMode) {
      return activeCloud ? activeCloud.save() : { ok: false, reason: "error" };
    }
    // Guest notes are only on this device: saving needs an account, and makes no request.
    const active = activeGuestNote(guestRef.current.state);
    if (!active || isBlankContent(active.content)) return { ok: false, reason: "empty" };
    return { ok: false, reason: "signed-out" };
  }, [accountMode, activeCloud]);

  const guestActive = useMemo(() => activeGuestNote(guest.state), [guest.state]);
  const guestNotes = useMemo(() => visibleGuestNotes(guest.state), [guest.state]);
  const guestHasContent = guestActive !== null && !isBlankContent(guestActive.content);

  if (accountMode) {
    return {
      mode: "account",
      notes: cloudSnapshot.notes,
      activeNote: cloudSnapshot.activeNote,
      activeNotePersisted: cloudSnapshot.activeNotePersisted === true,
      saveState: cloudSnapshot.saveState,
      ready: sessionSettled && cloudSnapshot.ready,
      dirty: cloudSnapshot.dirty,
      select,
      create,
      update,
      remove,
      restore,
      save,
    };
  }

  return {
    mode: "guest",
    notes: guestNotes,
    activeNote: guestActive,
    activeNotePersisted: false,
    saveState: guest.saveState === "error" ? "error" : guestHasContent ? "unsaved" : "idle",
    ready: sessionSettled && guest.loaded,
    dirty: guestHasContent,
    select,
    create,
    update,
    remove,
    restore,
    save,
  };
}
