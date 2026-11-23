export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteSummary {
  id: string;
  title: string;
  updatedAt: number;
  /** Account mode: this note has edits that are not saved to the database yet. */
  unsaved?: boolean;
}

export type SaveState = "idle" | "unsaved" | "saving" | "saved" | "offline" | "error";

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "signed-out" | "empty" | "offline" | "error"; message?: string };

export interface UiPrefs {
  previewOpen: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  font: "hand" | "sans" | "serif" | "mono";
  size: "small" | "medium" | "large" | "xlarge";
}

export interface NoteStore {
  mode: "guest" | "account";
  notes: NoteSummary[];
  activeNote: Note | null;
  /** Whether the active account note has been saved to the database at least once. */
  activeNotePersisted?: boolean;
  saveState: SaveState;
  ready: boolean;
  /** Active note has edits that are not in the database. Guest mode: true when the note has any content. */
  dirty: boolean;
  select(id: string): void;
  create(): void;
  update(content: string): void;
  remove(id: string): void;
  restore(id: string): void;
  /** Pushes the ACTIVE note to the database. Never throws. Guest: resolves { ok:false, reason:"signed-out" } without any network call. */
  save(): Promise<SaveResult>;
}

export function deriveTitle(content: string): string {
  return content.split(/\r?\n/, 1)[0]?.trim() || "Untitled note";
}
