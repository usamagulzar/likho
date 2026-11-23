// Account-mode notes for one signed-in user. Edits only touch the per-user localStorage cache.
// The database is written only by save() (one PUT for the active note), delete and undo, and
// read by the list fetch on load and by per-note fetches when a note is opened.
//
// Plain class, no React: the hook subscribes to it, and tests drive it with fake storage and API.

import { NotesApiError, deleteNote, fetchNote, fetchNotes, saveNote } from "@/lib/sync/client";
import {
  readCloudCache,
  registerLiveSession,
  setCurrentCloudUser,
  writeCloudCache,
} from "@/lib/store/cloudCache";
import {
  hasUnsavedEdits,
  listCloudNotes,
  mergeWithServer,
  pruneGhostNotes,
  reconcileSave,
  reconcileWithStorage,
  type CloudCache,
  type CloudNote,
  type SaveAttempt,
} from "@/lib/store/cloudState";
import { createClientId, isBlankContent, nextUpdatedAt } from "@/lib/store/logic";
import { deriveTitle, type Note, type NoteSummary, type SaveResult, type SaveState } from "@/lib/types";

const PERSIST_DELAY_MS = 300;
const RECENT_DELETE_LIMIT = 20;
const SESSION_ENDED_MESSAGE = "Your session has ended. Sign in again to save.";
const SAVE_FAILED_MESSAGE = "Couldn't save this note. Try again.";

export interface CloudApi {
  fetchNotes(): Promise<NoteSummary[]>;
  fetchNote(id: string): Promise<Note>;
  saveNote(note: SaveAttempt): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export interface CloudStorage {
  read(): CloudCache | null;
  write(cache: CloudCache): boolean;
}

export interface CloudEnvironment {
  storage: CloudStorage;
  api: CloudApi;
  isOffline(): boolean;
  now(): number;
  newId(): string;
}

export interface CloudSnapshot {
  notes: NoteSummary[];
  activeNote: Note | null;
  activeNotePersisted?: boolean;
  saveState: SaveState;
  dirty: boolean;
  ready: boolean;
}

export const EMPTY_CLOUD_SNAPSHOT: CloudSnapshot = {
  notes: [],
  activeNote: null,
  activeNotePersisted: false,
  saveState: "idle",
  dirty: false,
  ready: false,
};

type FailureKind = "offline" | "signed-out" | "not-found" | "error";

interface Failure {
  /** The note the failure belongs to, or null for list and delete failures. */
  noteId: string | null;
  state: "offline" | "error";
  message?: string;
}

function failureKindOf(error: unknown): FailureKind {
  if (error instanceof NotesApiError) {
    if (error.kind === "offline") return "offline";
    if (error.kind === "unauthorized") return "signed-out";
    if (error.kind === "not-found") return "not-found";
    return "error";
  }
  return error instanceof TypeError ? "offline" : "error";
}

export class CloudSession {
  readonly userId: string;

  private readonly env: CloudEnvironment;
  private notes: CloudNote[];
  private activeId: string | undefined;
  private syncedAt: number | undefined;
  private readonly server = new Map<string, NoteSummary>();
  private serverSettled = false;
  /** Server notes removed in this tab whose content is still being fetched for the undo record. */
  private readonly hidden = new Set<string>();
  /** Ids this tab changed since its last write. Other ids follow whatever another tab stored. */
  private readonly touched = new Set<string>();
  /** Last content known to be in the database, per note. Used to detect revert-to-saved. */
  private readonly saved = new Map<string, string>();
  /** Notes deleted in this session, kept so an undo can restore their text. */
  private readonly recentlyDeleted = new Map<string, CloudNote>();
  private readonly saving = new Map<string, Promise<SaveResult>>();
  private readonly deleting = new Map<string, Promise<void>>();
  private readonly loading = new Map<string, Promise<void>>();
  private listing: Promise<void> | null = null;
  private failure: Failure | null = null;
  private persistFailed = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: CloudSnapshot = EMPTY_CLOUD_SNAPSHOT;
  /** Set by discard() on sign-out. A discarded session never writes or loads again. */
  private discarded = false;
  private readonly listeners = new Set<() => void>();

  constructor(userId: string, env: CloudEnvironment) {
    this.userId = userId;
    this.env = env;
    const cache = env.storage.read();
    this.notes = cache?.notes ?? [];
    this.activeId = cache?.activeId;
    this.syncedAt = cache?.syncedAt;
    for (const note of this.notes) {
      if (note.deletedAt === undefined && note.baseUpdatedAt !== null && !note.dirty) {
        this.saved.set(note.id, note.content);
      }
    }
    this.snapshot = this.computeSnapshot();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): CloudSnapshot => this.snapshot;

  /** Starts the first server sync: list the notes, then finish any deletes that did not reach the server. */
  start(): void {
    void this.refresh();
    this.retryDeletes();
  }

  /** Fetches the note list and merges it into the cache. Concurrent calls share one request. */
  refresh(): Promise<void> {
    if (this.discarded) return Promise.resolve();
    if (this.listing) return this.listing;
    if (this.env.isOffline()) {
      this.serverSettled = true;
      this.failure = { noteId: null, state: "offline" };
      this.emit();
      return Promise.resolve();
    }

    const operation = (async () => {
      try {
        const list = await this.env.api.fetchNotes();
        if (this.discarded) return;
        this.applyServerList(list);
        this.serverSettled = true;
        if (this.failure?.noteId === null) this.failure = null;
        this.syncedAt = this.env.now();
        this.ensureActive();
        this.persistSoon();
      } catch (error) {
        if (this.discarded) return;
        this.serverSettled = true;
        const kind = failureKindOf(error);
        this.failure = {
          noteId: null,
          state: kind === "offline" || this.env.isOffline() ? "offline" : "error",
          message: SAVE_FAILED_MESSAGE,
        };
      } finally {
        this.listing = null;
        this.emit();
      }
    })();
    this.listing = operation;
    return operation;
  }

  /** Writes the cache now, merged with what other tabs stored. Call on pagehide and when hidden. */
  flush(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null || this.touched.size > 0) {
      this.persistNow();
      this.emit();
    }
  }

  /** Forgets everything this session holds and stops it writing. Used by the explicit Sign out. */
  discard(): void {
    this.discarded = true;
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.notes = [];
    this.server.clear();
    this.hidden.clear();
    this.activeId = undefined;
    this.syncedAt = undefined;
    this.serverSettled = false;
    this.listing = null;
    this.failure = null;
    this.persistFailed = false;
    this.touched.clear();
    this.saved.clear();
    this.recentlyDeleted.clear();
    this.saving.clear();
    this.deleting.clear();
    this.loading.clear();
    this.snapshot = EMPTY_CLOUD_SNAPSHOT;
    for (const listener of Array.from(this.listeners)) listener();
  }

  /** Writes pending edits and cancels the debounce timer. Safe to call more than once. */
  dispose(): void {
    this.flush();
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = null;
  }

  /** Another tab wrote this user's cache. Adopt its changes for ids this tab has not touched. */
  handleExternalChange(): void {
    if (this.discarded) return;
    const stored = this.env.storage.read();
    if (!stored) return;
    this.notes = reconcileWithStorage(stored.notes, this.notes, this.touched);
    this.ensureActive();
    this.emit();
  }

  /** Retries deletes that have not reached the server, e.g. after going back online. */
  retryDeletes(): void {
    if (this.discarded) return;
    for (const note of this.notes) {
      if (note.deletedAt !== undefined && note.baseUpdatedAt !== null) void this.syncDelete(note.id);
    }
  }

  select(id: string): void {
    if (this.discarded) return;
    const visible = listCloudNotes(this.listInput());
    if (!visible.some((summary) => summary.id === id)) return;

    this.activeId = id;
    this.pruneGhosts(id);
    this.persistSoon();
    if (!this.isLoaded(id)) this.loadContent(id);
    this.emit();
  }

  create(): void {
    if (this.discarded) return;
    const now = this.env.now();
    const id = this.env.newId();
    this.pruneGhosts(id);
    this.notes = [
      ...this.notes,
      { id, content: "", createdAt: now, updatedAt: now, baseUpdatedAt: null, dirty: true },
    ];
    this.touched.add(id);
    this.activeId = id;
    this.persistNow();
    this.emit();
  }

  update(content: string): void {
    if (this.discarded) return;
    const note = this.activeCloud();
    if (!note || note.content === content) return;

    // Clean again when the text is back to what the database holds.
    const saved = this.saved.get(note.id);
    const dirty = note.baseUpdatedAt === null || saved === undefined || content !== saved;
    const next: CloudNote = {
      ...note,
      content,
      updatedAt: nextUpdatedAt(note.updatedAt, this.env.now()),
      dirty,
    };
    this.notes = this.notes.map((candidate) => (candidate.id === note.id ? next : candidate));
    this.touched.add(note.id);
    this.persistSoon();
    this.emit();
  }

  remove(id: string): void {
    if (this.discarded) return;
    const local = this.notes.find((note) => note.id === id && note.deletedAt === undefined);
    if (!local) {
      if (this.server.has(id) && !this.hidden.has(id)) void this.removeUnloaded(id);
      return;
    }

    const wasActive = this.activeId === id;
    const savingNow = this.saving.has(id);
    this.touched.add(id);
    this.server.delete(id);

    if (local.baseUpdatedAt === null && !savingNow) {
      // Never reached the database: nothing to delete there.
      this.rememberDeleted(local);
      this.notes = this.notes.filter((note) => note.id !== id);
    } else {
      const deletedAt = this.env.now();
      this.notes = this.notes.map((note) => (note.id === id ? { ...note, deletedAt } : note));
    }

    if (wasActive) {
      this.activeId = undefined;
      const next = listCloudNotes(this.listInput())[0];
      if (next) this.select(next.id);
    }
    this.persistNow();
    // A save in flight finishes first; syncDelete waits for it, so the delete is not undone by it.
    if (local.baseUpdatedAt !== null) void this.syncDelete(id);
    this.emit();
  }

  restore(id: string): void {
    if (this.discarded) return;
    void this.restoreNote(id);
  }

  /** Saves the active note to the database. Never throws. */
  save(): Promise<SaveResult> {
    if (this.discarded) return Promise.resolve({ ok: false, reason: "signed-out" });
    if (this.activeId === undefined) return Promise.resolve({ ok: false, reason: "empty" });
    return this.saveById(this.activeId);
  }

  // ---- internals -------------------------------------------------------------------------

  private emit(): void {
    this.snapshot = this.computeSnapshot();
    for (const listener of Array.from(this.listeners)) listener();
  }

  private computeSnapshot(): CloudSnapshot {
    const notes = listCloudNotes(this.listInput());
    const active = this.activeCloud();
    const activeNote: Note | null = active
      ? { id: active.id, content: active.content, createdAt: active.createdAt, updatedAt: active.updatedAt }
      : null;
    return {
      notes,
      activeNote,
      activeNotePersisted: active !== undefined && active.baseUpdatedAt !== null,
      saveState: this.deriveSaveState(active),
      dirty: active ? hasUnsavedEdits(active) : false,
      ready: this.serverSettled || notes.length > 0,
    };
  }

  private deriveSaveState(note: CloudNote | undefined): SaveState {
    if (this.persistFailed) return "error";
    if (!note) return "idle";
    if (this.saving.has(note.id)) return "saving";
    if (!hasUnsavedEdits(note)) return note.baseUpdatedAt === null ? "idle" : "saved";
    if (this.failure && (this.failure.noteId === null || this.failure.noteId === note.id)) {
      return this.failure.state;
    }
    return "unsaved";
  }

  private listInput() {
    return { notes: this.notes, server: this.server, hidden: this.hidden, activeId: this.activeId };
  }

  private activeCloud(): CloudNote | undefined {
    return this.notes.find((note) => note.id === this.activeId && note.deletedAt === undefined);
  }

  private isLoaded(id: string): boolean {
    return this.notes.some((note) => note.id === id && note.deletedAt === undefined);
  }

  private pruneGhosts(keepId: string | undefined): void {
    const next = pruneGhostNotes(this.notes, keepId);
    if (next.length === this.notes.length) return;
    const kept = new Set(next.map((note) => note.id));
    for (const note of this.notes) if (!kept.has(note.id)) this.touched.add(note.id);
    this.notes = next;
  }

  private rememberDeleted(note: CloudNote): void {
    this.recentlyDeleted.delete(note.id);
    this.recentlyDeleted.set(note.id, note);
    if (this.recentlyDeleted.size > RECENT_DELETE_LIMIT) {
      const oldest = this.recentlyDeleted.keys().next().value;
      if (oldest !== undefined) this.recentlyDeleted.delete(oldest);
    }
  }

  private persistSoon(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistNow();
      this.emit();
    }, PERSIST_DELAY_MS);
  }

  private persistNow(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    const stored = this.env.storage.read();
    const merged = pruneGhostNotes(
      reconcileWithStorage(stored?.notes ?? [], this.notes, this.touched),
      this.activeId,
    );
    const written = this.env.storage.write({
      version: 1,
      notes: merged,
      activeId: this.activeId,
      syncedAt: this.syncedAt,
    });
    this.persistFailed = !written;
    if (written) {
      this.touched.clear();
      this.notes = merged;
    }
  }

  private applyServerList(list: NoteSummary[]): void {
    if (this.discarded) return;
    const before = this.notes.map((note) => note.id);
    this.server.clear();
    for (const summary of list) {
      if (!this.hidden.has(summary.id)) this.server.set(summary.id, summary);
    }
    // A note whose save is in flight is left alone: the save's own response decides its state.
    this.notes = mergeWithServer(this.notes, this.server, this.activeId, this.saving.keys(), this.env.newId);
    for (const id of before) this.touched.add(id);
    for (const note of this.notes) this.touched.add(note.id);
  }

  /** Makes sure the active note is set and its content is loaded. */
  private ensureActive(): void {
    const visible = listCloudNotes(this.listInput());
    if (this.activeId !== undefined && visible.some((summary) => summary.id === this.activeId)) {
      if (!this.isLoaded(this.activeId)) this.loadContent(this.activeId);
      return;
    }
    const first = visible[0];
    if (first) {
      this.select(first.id);
    } else {
      this.activeId = undefined;
    }
  }

  private loadContent(id: string): void {
    if (this.discarded) return;
    if (this.loading.has(id)) return;
    if (this.env.isOffline()) {
      this.failure = { noteId: id, state: "offline" };
      this.emit();
      return;
    }

    const operation = (async () => {
      try {
        const note = await this.env.api.fetchNote(id);
        if (this.discarded) return;
        // Skip if the note appeared meanwhile, or was removed in this tab.
        if (!this.notes.some((candidate) => candidate.id === id) && !this.hidden.has(id)) {
          this.notes = [
            ...this.notes,
            {
              id,
              content: note.content,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              baseUpdatedAt: note.updatedAt,
              dirty: false,
            },
          ];
          this.saved.set(id, note.content);
          this.touched.add(id);
          this.persistSoon();
        }
        if (this.failure?.noteId === id) this.failure = null;
      } catch (error) {
        if (this.discarded) return;
        const kind = failureKindOf(error);
        if (kind === "not-found") {
          // Deleted on another device: the list no longer has it.
          this.server.delete(id);
          if (this.activeId === id) this.activeId = undefined;
          this.ensureActive();
        } else {
          this.failure = {
            noteId: id,
            state: kind === "offline" || this.env.isOffline() ? "offline" : "error",
            message: SAVE_FAILED_MESSAGE,
          };
        }
      } finally {
        this.loading.delete(id);
        this.emit();
      }
    })();
    this.loading.set(id, operation);
  }

  private async removeUnloaded(id: string): Promise<void> {
    if (this.discarded) return;
    // Undo needs the text, so a note this device never loaded is fetched before it is deleted.
    this.hidden.add(id);
    this.emit();

    let note: Note;
    try {
      note = await this.env.api.fetchNote(id);
    } catch (error) {
      if (this.discarded) return;
      this.hidden.delete(id);
      const kind = failureKindOf(error);
      if (kind === "not-found") {
        this.server.delete(id);
      } else {
        this.failure = { noteId: null, state: kind === "offline" ? "offline" : "error", message: SAVE_FAILED_MESSAGE };
      }
      this.emit();
      return;
    }
    if (this.discarded) return;
    this.hidden.delete(id);
    if (this.isLoaded(id)) {
      this.remove(id);
      return;
    }

    const tombstone: CloudNote = {
      id,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      baseUpdatedAt: note.updatedAt,
      dirty: false,
      deletedAt: this.env.now(),
    };
    this.notes = [...this.notes.filter((candidate) => candidate.id !== id), tombstone];
    this.server.delete(id);
    this.touched.add(id);
    if (this.activeId === id) {
      this.activeId = undefined;
      this.ensureActive();
    }
    this.persistSoon();
    void this.syncDelete(id);
    this.emit();
  }

  private syncDelete(id: string): Promise<void> {
    if (this.discarded) return Promise.resolve();
    const existing = this.deleting.get(id);
    if (existing) return existing;
    // Offline: nothing is registered, so the tombstone is retried by the next retryDeletes().
    if (this.env.isOffline()) {
      this.failure = { noteId: null, state: "offline" };
      this.emit();
      return Promise.resolve();
    }

    const operation = (async () => {
      const pendingSave = this.saving.get(id);
      if (pendingSave) await pendingSave;
      if (this.discarded) return;
      try {
        await this.env.api.deleteNote(id);
      } catch (error) {
        if (this.discarded) return;
        const kind = failureKindOf(error);
        if (kind !== "not-found") {
          this.failure = {
            noteId: null,
            state: kind === "offline" ? "offline" : "error",
            message: SAVE_FAILED_MESSAGE,
          };
          return;
        }
      }
      if (this.discarded) return;

      // Only drop the tombstone if the note was not restored while the delete was in flight.
      const tombstone = this.notes.find((note) => note.id === id && note.deletedAt !== undefined);
      if (tombstone) {
        this.notes = this.notes.filter((note) => note !== tombstone);
        this.rememberDeleted(tombstone);
        this.touched.add(id);
        this.persistSoon();
      }
      if (this.failure?.noteId === null) this.failure = null;
    })().finally(() => {
      this.deleting.delete(id);
      this.emit();
    });

    this.deleting.set(id, operation);
    return operation;
  }

  private async restoreNote(id: string): Promise<void> {
    if (this.discarded) return;
    const pending = this.deleting.get(id);
    if (pending) await pending;
    if (this.discarded) return;

    const current = this.notes.find((note) => note.id === id);
    if (current && current.deletedAt === undefined) return;
    const base = current ?? this.recentlyDeleted.get(id);
    if (!base) return;

    const restored: CloudNote = {
      id,
      content: base.content,
      createdAt: base.createdAt,
      updatedAt: nextUpdatedAt(base.updatedAt, this.env.now()),
      baseUpdatedAt: null,
      dirty: true,
    };
    this.notes = [...this.notes.filter((note) => note.id !== id), restored];
    this.recentlyDeleted.delete(id);
    this.touched.add(id);
    this.activeId = id;
    this.persistNow();
    this.emit();
    await this.saveById(id);
  }

  private saveById(id: string): Promise<SaveResult> {
    if (this.discarded) return Promise.resolve({ ok: false, reason: "signed-out" });
    const existing = this.saving.get(id);
    if (existing) return existing;

    const note = this.notes.find((candidate) => candidate.id === id && candidate.deletedAt === undefined);
    if (!note || isBlankContent(note.content)) return Promise.resolve({ ok: false, reason: "empty" });
    if (!hasUnsavedEdits(note)) return Promise.resolve({ ok: true });

    if (this.env.isOffline()) {
      this.failure = { noteId: id, state: "offline" };
      this.emit();
      return Promise.resolve({ ok: false, reason: "offline" });
    }

    if (this.failure?.noteId === id) this.failure = null;
    const attempt: SaveAttempt = { id, content: note.content, updatedAt: note.updatedAt };
    const operation = this.send(attempt).finally(() => {
      this.saving.delete(id);
      // A delete asked for while this save was in flight runs now, after the PUT.
      if (this.notes.some((candidate) => candidate.id === id && candidate.deletedAt !== undefined)) {
        void this.syncDelete(id);
      }
      this.emit();
    });
    this.saving.set(id, operation);
    this.emit();
    return operation;
  }

  private async send(attempt: SaveAttempt): Promise<SaveResult> {
    try {
      const response = await this.env.api.saveNote(attempt);
      if (this.discarded) return { ok: false, reason: "signed-out" };
      this.applySaved(attempt, response);
      if (this.failure?.noteId === attempt.id) this.failure = null;
      this.persistSoon();
      return { ok: true };
    } catch (error) {
      if (this.discarded) return { ok: false, reason: "signed-out" };
      const kind = this.env.isOffline() ? "offline" : failureKindOf(error);
      if (kind === "offline") {
        this.failure = { noteId: attempt.id, state: "offline" };
        return { ok: false, reason: "offline" };
      }
      if (kind === "signed-out") {
        this.failure = { noteId: attempt.id, state: "error", message: SESSION_ENDED_MESSAGE };
        return { ok: false, reason: "signed-out", message: SESSION_ENDED_MESSAGE };
      }
      this.failure = { noteId: attempt.id, state: "error", message: SAVE_FAILED_MESSAGE };
      return { ok: false, reason: "error", message: SAVE_FAILED_MESSAGE };
    }
  }

  private applySaved(attempt: SaveAttempt, response: Note): void {
    if (this.discarded) return;
    this.server.set(attempt.id, {
      id: attempt.id,
      title: deriveTitle(response.content),
      updatedAt: response.updatedAt,
    });
    this.saved.set(attempt.id, response.content);

    const local = this.notes.find((note) => note.id === attempt.id);
    if (!local) return;
    this.touched.add(attempt.id);

    if (local.deletedAt !== undefined) {
      // Deleted while the save was in flight: keep the tombstone, the delete runs after this.
      this.notes = this.notes.map((note) =>
        note.id === attempt.id ? { ...note, baseUpdatedAt: response.updatedAt } : note,
      );
      return;
    }

    const { note, copy } = reconcileSave(local, attempt, response, this.env.newId());
    this.notes = this.notes.map((candidate) => (candidate.id === attempt.id ? note : candidate));
    if (copy) {
      this.notes = [...this.notes, copy];
      this.touched.add(copy.id);
    }
  }
}

/** Real environment: the browser's localStorage and the notes API. */
export function createCloudSession(userId: string): CloudSession {
  setCurrentCloudUser(userId);
  const session = new CloudSession(userId, {
    storage: {
      read: () => readCloudCache(userId),
      write: (cache) => writeCloudCache(userId, cache),
    },
    api: { fetchNotes, fetchNote, saveNote, deleteNote },
    isOffline: () => typeof navigator !== "undefined" && navigator.onLine === false,
    now: () => Date.now(),
    newId: createClientId,
  });
  registerLiveSession(session);
  return session;
}
