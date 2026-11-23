"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { createClientId } from "@/lib/store/logic";
import type { NoteSummary } from "@/lib/types";

import { deleteFolderRemote, fetchFolderData, placeNote, saveFolder } from "./api";
import {
  EMPTY_FOLDER_DATA,
  cleanFolderName,
  folderNameOrDefault,
  sanitizeFolderData,
  subtreeIds,
} from "./tree";
import type { Assignments, Folder, FolderData } from "./types";

const GUEST_KEY = "likho:folders:v1";
const pendingKey = (userId: string) => `likho:folders:pending:${userId}`;
const MAX_PENDING = 500;

/** noteId -> folder id, or null for "move to the top level". Waits for the note to be saved to the database. */
type Pending = Record<string, string | null>;

export interface FolderModel {
  folders: Folder[];
  assignments: Assignments;
  /** False until the folders have been read (storage for guests, the server for accounts). */
  loaded: boolean;
  folderOf: (noteId: string) => string | null;
  /** Returns the new folder's id. */
  createFolder: (name: string, parentId: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  /** Returns false when the move is not allowed (into itself or one of its own sub-folders). */
  moveFolder: (id: string, parentId: string | null) => boolean;
  /** Deletes the folder only. Its notes and sub-folders move up one level. */
  deleteFolder: (id: string) => void;
  assignNote: (noteId: string, folderId: string | null) => void;
}

interface State {
  scope: string;
  data: FolderData;
  loaded: boolean;
}

function readGuest(): FolderData {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? sanitizeFolderData(JSON.parse(raw)) : EMPTY_FOLDER_DATA;
  } catch {
    return EMPTY_FOLDER_DATA;
  }
}

function writeGuest(data: FolderData): void {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(data));
  } catch {
    toast.error("Couldn't save folders on this device.");
  }
}

function readPending(userId: string): Pending {
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Pending = {};
    for (const [noteId, folderId] of Object.entries(parsed)) {
      if (folderId === null || typeof folderId === "string") out[noteId] = folderId;
    }
    return out;
  } catch {
    return {};
  }
}

function writePending(userId: string, pending: Pending): void {
  try {
    const keys = Object.keys(pending);
    if (keys.length === 0) window.localStorage.removeItem(pendingKey(userId));
    else window.localStorage.setItem(pendingKey(userId), JSON.stringify(pending));
  } catch {
    // The pending list is a convenience. Losing it only means a note stays at the top level on the server.
  }
}

/** Layers not-yet-synced note moves over what the server returned. */
function withPending(data: FolderData, pending: Pending): FolderData {
  const keys = Object.keys(pending);
  if (keys.length === 0) return data;
  const ids = new Set(data.folders.map((folder) => folder.id));
  const assignments = { ...data.assignments };
  for (const noteId of keys) {
    const folderId = pending[noteId];
    if (folderId !== null && ids.has(folderId)) assignments[noteId] = folderId;
    else delete assignments[noteId];
  }
  return { folders: data.folders, assignments };
}

/**
 * Folder state, kept apart from the notes store.
 * Guest: localStorage. Account: the /api/folders routes, with optimistic updates and one request queue so a parent
 * folder always exists before its child. Note moves for notes that are not in the database yet wait in `pending`.
 */
export function useFolders(mode: "guest" | "account", notes: NoteSummary[]): FolderModel {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const accountUserId = mode === "account" ? userId : null;
  const scope = accountUserId ? `account:${accountUserId}` : "guest";

  const [state, setState] = useState<State>({ scope: "", data: EMPTY_FOLDER_DATA, loaded: false });

  const scopeRef = useRef(scope);
  const dataRef = useRef<FolderData>(EMPTY_FOLDER_DATA);
  const pendingRef = useRef<Pending>({});
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const flushingRef = useRef(new Set<string>());
  const notesRef = useRef(notes);
  const loadedRef = useRef(false);

  useEffect(() => {
    notesRef.current = notes;
  });

  const enqueue = useCallback((task: () => Promise<void>) => {
    const owner = scopeRef.current;
    queueRef.current = queueRef.current.then(async () => {
      if (scopeRef.current !== owner) return;
      try {
        await task();
      } catch {
        // Each task reports its own failure.
      }
    });
  }, []);

  const commit = useCallback((data: FolderData, loaded = true) => {
    dataRef.current = data;
    loadedRef.current = loaded;
    setState({ scope: scopeRef.current, data, loaded });
  }, []);

  // ---- load ----

  const loadRemote = useCallback(
    (owner: string, userKey: string) => {
      enqueue(async () => {
        try {
          const remote = await fetchFolderData();
          if (scopeRef.current !== owner) return;
          pendingRef.current = readPending(userKey);
          commit(withPending(remote, pendingRef.current));
        } catch {
          if (scopeRef.current !== owner) return;
          toast.error("Couldn't load your folders.");
          commit(dataRef.current, true);
        }
      });
    },
    [commit, enqueue],
  );

  useEffect(() => {
    scopeRef.current = scope;
    dataRef.current = EMPTY_FOLDER_DATA;
    loadedRef.current = false;
    pendingRef.current = {};
    flushingRef.current.clear();

    if (!accountUserId) {
      // Reading localStorage is an external-system sync, not derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      commit(readGuest());
      const onStorage = (event: StorageEvent) => {
        if (event.key === GUEST_KEY || event.key === null) commit(readGuest());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ scope, data: EMPTY_FOLDER_DATA, loaded: false });
    loadRemote(scope, accountUserId);
    const onOnline = () => loadRemote(scope, accountUserId);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [scope, accountUserId, commit, loadRemote]);

  const refetch = useCallback(() => {
    if (accountUserId) loadRemote(scopeRef.current, accountUserId);
  }, [accountUserId, loadRemote]);

  const fail = useCallback(
    (message: string) => {
      toast.error(message);
      refetch();
    },
    [refetch],
  );

  /** Applies a change locally, and to storage for guests. Account changes are sent by the caller. */
  const apply = useCallback(
    (next: FolderData) => {
      commit(next);
      if (scopeRef.current === "guest") writeGuest(next);
    },
    [commit],
  );

  // ---- pending note moves (account only) ----

  const flushPending = useCallback(() => {
    if (!accountUserId || !loadedRef.current) return;
    const owner = scopeRef.current;
    for (const noteId of Object.keys(pendingRef.current)) {
      const summary = notesRef.current.find((note) => note.id === noteId);
      if (!summary || summary.unsaved || flushingRef.current.has(noteId)) continue;
      const target = pendingRef.current[noteId];
      flushingRef.current.add(noteId);
      enqueue(async () => {
        try {
          await placeNote(noteId, target);
          if (scopeRef.current !== owner) return;
          if (pendingRef.current[noteId] === target) {
            delete pendingRef.current[noteId];
            writePending(accountUserId, pendingRef.current);
          }
        } catch {
          // Not saved yet (404) or offline: it stays pending and is tried again when the notes change.
        } finally {
          flushingRef.current.delete(noteId);
          if (scopeRef.current === owner && noteId in pendingRef.current && pendingRef.current[noteId] !== target) {
            flushPending();
          }
        }
      });
    }
  }, [accountUserId, enqueue]);

  useEffect(() => {
    flushPending();
  }, [notes, state.loaded, flushPending]);

  const setPending = useCallback(
    (noteId: string, folderId: string | null) => {
      if (!accountUserId) return;
      const next = { ...pendingRef.current, [noteId]: folderId };
      const keys = Object.keys(next);
      if (keys.length > MAX_PENDING) delete next[keys[0]];
      pendingRef.current = next;
      writePending(accountUserId, next);
    },
    [accountUserId],
  );

  // ---- actions ----

  const createFolder = useCallback(
    (name: string, parentId: string | null): string => {
      const id = createClientId();
      const now = Date.now();
      const current = dataRef.current;
      const parent = parentId !== null && current.folders.some((folder) => folder.id === parentId) ? parentId : null;
      const folder: Folder = { id, name: folderNameOrDefault(name), parentId: parent, createdAt: now, updatedAt: now };
      apply({ folders: [...current.folders, folder], assignments: current.assignments });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { name: folder.name, parentId: parent });
          } catch {
            fail("Couldn't create the folder.");
          }
        });
      }
      return id;
    },
    [accountUserId, apply, enqueue, fail],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const cleaned = cleanFolderName(name);
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder || !cleaned || cleaned === folder.name) return;
      apply({
        folders: current.folders.map((candidate) =>
          candidate.id === id ? { ...candidate, name: cleaned, updatedAt: Date.now() } : candidate,
        ),
        assignments: current.assignments,
      });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { name: cleaned });
          } catch {
            fail("Couldn't rename the folder.");
          }
        });
      }
    },
    [accountUserId, apply, enqueue, fail],
  );

  const moveFolder = useCallback(
    (id: string, parentId: string | null): boolean => {
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder) return false;
      if (parentId !== null) {
        if (!current.folders.some((candidate) => candidate.id === parentId)) return false;
        if (subtreeIds(current.folders, id).has(parentId)) return false;
      }
      if (folder.parentId === parentId) return true;
      apply({
        folders: current.folders.map((candidate) =>
          candidate.id === id ? { ...candidate, parentId, updatedAt: Date.now() } : candidate,
        ),
        assignments: current.assignments,
      });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { parentId });
          } catch {
            fail("Couldn't move the folder.");
          }
        });
      }
      return true;
    },
    [accountUserId, apply, enqueue, fail],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder) return;
      const up = folder.parentId;

      const assignments: Assignments = {};
      for (const [noteId, folderId] of Object.entries(current.assignments)) {
        if (folderId !== id) assignments[noteId] = folderId;
        else if (up !== null) assignments[noteId] = up;
      }
      apply({
        folders: current.folders
          .filter((candidate) => candidate.id !== id)
          .map((candidate) => (candidate.parentId === id ? { ...candidate, parentId: up } : candidate)),
        assignments,
      });

      if (accountUserId) {
        // Pending moves into the deleted folder follow its contents up one level.
        const pending = { ...pendingRef.current };
        let changed = false;
        for (const noteId of Object.keys(pending)) {
          if (pending[noteId] === id) {
            pending[noteId] = up;
            changed = true;
          }
        }
        if (changed) {
          pendingRef.current = pending;
          writePending(accountUserId, pending);
        }
        enqueue(async () => {
          try {
            await deleteFolderRemote(id);
          } catch {
            fail("Couldn't delete the folder.");
          }
        });
        flushPending();
      }
    },
    [accountUserId, apply, enqueue, fail, flushPending],
  );

  const assignNote = useCallback(
    (noteId: string, folderId: string | null) => {
      const current = dataRef.current;
      const target = folderId !== null && current.folders.some((folder) => folder.id === folderId) ? folderId : null;
      if ((current.assignments[noteId] ?? null) === target && !(noteId in pendingRef.current)) return;

      const assignments = { ...current.assignments };
      if (target === null) delete assignments[noteId];
      else assignments[noteId] = target;
      apply({ folders: current.folders, assignments });

      if (accountUserId) {
        setPending(noteId, target);
        flushPending();
      }
    },
    [accountUserId, apply, flushPending, setPending],
  );

  // ---- derived ----

  const current = state.scope === scope ? state : null;
  const data = current?.data ?? EMPTY_FOLDER_DATA;
  const loaded = current?.loaded ?? false;

  return useMemo<FolderModel>(() => {
    const ids = new Set(data.folders.map((folder) => folder.id));
    return {
      folders: data.folders,
      assignments: data.assignments,
      loaded,
      folderOf: (noteId) => {
        const folderId = data.assignments[noteId];
        return folderId !== undefined && ids.has(folderId) ? folderId : null;
      },
      createFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
      assignNote,
    };
  }, [data, loaded, createFolder, renameFolder, moveFolder, deleteFolder, assignNote]);
}
