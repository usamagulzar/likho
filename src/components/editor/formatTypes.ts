/**
 * The formatting toolbar's vocabulary. Kept free of CodeMirror imports on purpose: the toolbar lives in the main
 * bundle, while the editor (and everything in formatting.ts) is loaded lazily, so the toolbar must not pull it in.
 */

export type FormatId =
  | "undo"
  | "redo"
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "bullet"
  | "number"
  | "task"
  | "quote"
  | "indent"
  | "outdent"
  | "codeblock"
  | "table"
  | "hr"
  | "clear";

export interface FormatState {
  /** Formats the caret (or selection) is inside right now. The toolbar lights these buttons. */
  readonly active: readonly FormatId[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export const EMPTY_FORMATS: FormatState = { active: [], canUndo: false, canRedo: false };

/** Shortcut text for tooltips. "Mod" stands for Ctrl, or ⌘ on a Mac. Keep in step with formattingKeymap. */
export const FORMAT_SHORTCUTS: Partial<Record<FormatId, string>> = {
  italic: "Mod+I",
  strike: "Mod+Shift+X",
  code: "Mod+E",
  link: "Mod+K",
  h1: "Mod+Alt+1",
  h2: "Mod+Alt+2",
  h3: "Mod+Alt+3",
  number: "Mod+Shift+7",
  bullet: "Mod+Shift+8",
  task: "Mod+Shift+9",
  undo: "Mod+Z",
  redo: "Mod+Shift+Z",
};
