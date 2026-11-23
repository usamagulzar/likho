import { isolateHistory, redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  Prec,
  type ChangeSpec,
  type EditorState,
  type Extension,
  type Line,
  type SelectionRange,
  type TransactionSpec,
} from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import type { FormatId, FormatState } from "./formatTypes";

export { EMPTY_FORMATS, FORMAT_SHORTCUTS } from "./formatTypes";
export type { FormatId, FormatState } from "./formatTypes";

/**
 * Markdown formatting commands: the toolbar's buttons and the keyboard shortcuts both run these.
 *
 * Everything here edits real Markdown text and nothing else (no HTML, no custom syntax), so what the toolbar writes
 * is exactly what the live preview, the shared-note page and the export already understand. Toggles are decided
 * from the Markdown syntax tree, not from guessing at characters, so `*italic*` inside `**bold**` never confuses
 * the two.
 */

/** The smallest thing a command needs. An EditorView fits, so do the plain objects the tests use. */
export interface CommandTarget {
  readonly state: EditorState;
  dispatch(...specs: TransactionSpec[]): void;
}

// ---------------------------------------------------------------------------------------------------------------
// Syntax-tree helpers
// ---------------------------------------------------------------------------------------------------------------

interface Span {
  from: number;
  to: number;
}

const INLINE = {
  bold: { node: "StrongEmphasis", mark: "**" },
  italic: { node: "Emphasis", mark: "*" },
  strike: { node: "Strikethrough", mark: "~~" },
  code: { node: "InlineCode", mark: "`" },
} as const;

type InlineId = keyof typeof INLINE;

const INLINE_NODES: ReadonlySet<string> = new Set(Object.values(INLINE).map((entry) => entry.node));
const MARK_NODES: ReadonlySet<string> = new Set(["EmphasisMark", "StrikethroughMark", "CodeMark"]);

/** The nearest node called `name` that covers [from, to], looking from both ends so a caret at an edge still counts. */
function enclosing(state: EditorState, from: number, to: number, name: string): SyntaxNode | null {
  const tree = syntaxTree(state);
  for (const [pos, side] of [
    [from, 1],
    [to, -1],
  ] as const) {
    for (let node: SyntaxNode | null = tree.resolveInner(pos, side); node; node = node.parent) {
      if (node.name === name && node.from <= from && node.to >= to) return node;
    }
  }
  return null;
}

function inFencedCode(state: EditorState, pos: number): boolean {
  const tree = syntaxTree(state);
  for (const side of [1, -1] as const) {
    for (let node: SyntaxNode | null = tree.resolveInner(pos, side); node; node = node.parent) {
      if (node.name === "FencedCode" || node.name === "CodeBlock") return true;
    }
  }
  return false;
}

function markSpans(node: SyntaxNode): Span[] {
  const spans: Span[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (MARK_NODES.has(child.name)) spans.push({ from: child.from, to: child.to });
  }
  return spans;
}

/** `[` and `](url)` of a link, the two pieces that vanish when the link is removed and its text is kept. */
function linkSpans(node: SyntaxNode): Span[] {
  const marks: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.name === "LinkMark") marks.push(child);
  }
  const open = marks[0];
  const close = marks[1];
  if (!open || !close) return [];
  return [
    { from: open.from, to: open.to },
    { from: close.from, to: node.to },
  ];
}

// ---------------------------------------------------------------------------------------------------------------
// Applying changes
// ---------------------------------------------------------------------------------------------------------------

/** One undo step per button press, never glued to the typing around it. */
function commit(target: CommandTarget, spec: TransactionSpec): void {
  target.dispatch(spec, { scrollIntoView: true, annotations: isolateHistory.of("full"), userEvent: "input.format" });
}

/** Where `pos` lands once `spans` are deleted. */
function shiftPast(pos: number, spans: readonly Span[]): number {
  let next = pos;
  for (const span of spans) {
    if (pos >= span.to) next -= span.to - span.from;
    else if (pos > span.from) next -= pos - span.from;
  }
  return next;
}

function removeSpans(range: SelectionRange, spans: readonly Span[]) {
  return {
    changes: spans.map((span) => ({ from: span.from, to: span.to })),
    range: EditorSelection.range(shiftPast(range.anchor, spans), shiftPast(range.head, spans)),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Inline formats: bold, italic, strikethrough, inline code
// ---------------------------------------------------------------------------------------------------------------

/** The non-blank pieces of [from, to], one per line, with edge spaces trimmed (Markdown marks cannot touch spaces). */
function inlineSegments(state: EditorState, from: number, to: number): Span[] {
  const segments: Span[] = [];
  const last = state.doc.lineAt(to).number;
  for (let n = state.doc.lineAt(from).number; n <= last; n++) {
    const line = state.doc.line(n);
    const text = state.sliceDoc(Math.max(from, line.from), Math.min(to, line.to));
    const lead = text.length - text.trimStart().length;
    const trail = text.length - text.trimEnd().length;
    const start = Math.max(from, line.from) + lead;
    const end = Math.min(to, line.to) - trail;
    if (end > start) segments.push({ from: start, to: end });
  }
  return segments;
}

function wrapRange(state: EditorState, range: SelectionRange, mark: string) {
  const segments = range.empty ? [] : inlineSegments(state, range.from, range.to);
  if (!segments.length) {
    // Nothing selected (or only blanks): drop an empty pair and put the caret inside it.
    return {
      changes: { from: range.head, insert: mark + mark },
      range: EditorSelection.cursor(range.head + mark.length),
    };
  }
  const changes: ChangeSpec[] = [];
  for (const segment of segments) {
    changes.push({ from: segment.from, insert: mark }, { from: segment.to, insert: mark });
  }
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    changes,
    range: EditorSelection.range(first.from + mark.length, last.to + mark.length * (2 * segments.length - 1)),
  };
}

function toggleInline(target: CommandTarget, id: InlineId): boolean {
  const { node, mark } = INLINE[id];
  const { state } = target;
  commit(
    target,
    state.changeByRange((range) => {
      const found = enclosing(state, range.from, range.to, node);
      const spans = found ? markSpans(found) : [];
      return spans.length ? removeSpans(range, spans) : wrapRange(state, range, mark);
    }),
  );
  return true;
}

// ---------------------------------------------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------------------------------------------

function toggleLink(target: CommandTarget): boolean {
  const { state } = target;
  commit(
    target,
    state.changeByRange((range) => {
      const link = enclosing(state, range.from, range.to, "Link");
      const spans = link ? linkSpans(link) : [];
      if (spans.length) return removeSpans(range, spans);

      if (range.empty) {
        const label = "link text";
        return {
          changes: { from: range.from, insert: `[${label}](https://)` },
          range: EditorSelection.range(range.from + 1, range.from + 1 + label.length),
        };
      }
      const text = state.sliceDoc(range.from, range.to);
      if (/^https?:\/\/\S+$/.test(text)) {
        // A pasted address becomes the link's target; the caller types the words.
        const label = "link text";
        return {
          changes: { from: range.from, to: range.to, insert: `[${label}](${text})` },
          range: EditorSelection.range(range.from + 1, range.from + 1 + label.length),
        };
      }
      const urlFrom = range.from + 1 + text.length + 2;
      return {
        changes: { from: range.from, to: range.to, insert: `[${text}](https://)` },
        range: EditorSelection.range(urlFrom, urlFrom + "https://".length),
      };
    }),
  );
  return true;
}

// ---------------------------------------------------------------------------------------------------------------
// Line formats: headings, lists, tasks, quotes, indent
// ---------------------------------------------------------------------------------------------------------------

type LineKind = "plain" | "heading" | "bullet" | "number" | "task";

interface Row {
  line: Line;
  /** "> " (or "> > ") at the start of the line. */
  quote: string;
  indent: string;
  kind: LineKind;
  /** Heading level, 0 for anything else. */
  level: number;
  /** Characters of quote + indent + marker, i.e. everything before the text. */
  prefixLength: number;
  blank: boolean;
}

function parseRow(line: Line): Row {
  const text = line.text;
  const quote = /^(?:>[ \t]?)+/.exec(text)?.[0] ?? "";
  const rest = text.slice(quote.length);
  const indent = /^[ \t]*/.exec(rest)?.[0] ?? "";
  const body = rest.slice(indent.length);

  let kind: LineKind = "plain";
  let level = 0;
  let marker = "";
  let match: RegExpExecArray | null;
  if ((match = /^(#{1,6})[ \t]+/.exec(body))) {
    kind = "heading";
    level = match[1].length;
    marker = match[0];
  } else if ((match = /^[-*+][ \t]+\[[ xX]\][ \t]+/.exec(body))) {
    kind = "task";
    marker = match[0];
  } else if ((match = /^[-*+][ \t]+/.exec(body))) {
    kind = "bullet";
    marker = match[0];
  } else if ((match = /^\d{1,9}[.)][ \t]+/.exec(body))) {
    kind = "number";
    marker = match[0];
  }
  return {
    line,
    quote,
    indent,
    kind,
    level,
    prefixLength: quote.length + indent.length + marker.length,
    blank: text.trim() === "",
  };
}

/** Lines a range touches. A selection that ends at the very start of a line does not include that line. */
function linesOf(state: EditorState, range: SelectionRange): Line[] {
  const first = state.doc.lineAt(range.from).number;
  let last = state.doc.lineAt(range.to).number;
  if (!range.empty && last > first && state.doc.line(last).from === range.to) last--;
  const lines: Line[] = [];
  for (let n = first; n <= last; n++) lines.push(state.doc.line(n));
  return lines;
}

/**
 * The lines a line command works on: every line the ranges touch, minus code blocks, minus blank lines (unless
 * every line is blank, as with a caret on an empty line, which a command can still start).
 */
function rowsFor(state: EditorState, ranges: readonly SelectionRange[]): Row[] {
  const seen = new Set<number>();
  const rows: Row[] = [];
  for (const range of ranges) {
    for (const line of linesOf(state, range)) {
      if (seen.has(line.number)) continue;
      seen.add(line.number);
      if (inFencedCode(state, line.from)) continue;
      rows.push(parseRow(line));
    }
  }
  const filled = rows.filter((row) => !row.blank);
  return filled.length ? filled : rows;
}

function dispatchLineChanges(target: CommandTarget, changes: ChangeSpec[]): boolean {
  if (!changes.length) return false;
  const { state } = target;
  const set = state.changes(changes);
  // assoc 1: a caret at the start of the line ends up after the new marker, not before it.
  commit(target, { changes: set, selection: state.selection.map(set, 1) });
  return true;
}

type BlockWanted =
  | { kind: "heading"; level: 1 | 2 | 3 }
  | { kind: "bullet" }
  | { kind: "number" }
  | { kind: "task" };

function setBlock(target: CommandTarget, want: BlockWanted): boolean {
  const { state } = target;
  const rows = rowsFor(state, state.selection.ranges);
  if (!rows.length) return false;
  const level = want.kind === "heading" ? want.level : 0;
  const allHave = rows.every((row) => row.kind === want.kind && row.level === level);

  const changes: ChangeSpec[] = [];
  let count = 1;
  for (const row of rows) {
    let prefix: string;
    if (allHave) {
      // Toggle off: keep any quote, and the indent of a list line.
      prefix = row.quote + (row.kind === "heading" ? "" : row.indent);
    } else {
      const indent = want.kind === "heading" ? "" : row.indent;
      const marker =
        want.kind === "heading"
          ? `${"#".repeat(want.level)} `
          : want.kind === "bullet"
            ? "- "
            : want.kind === "task"
              ? "- [ ] "
              : `${count++}. `;
      prefix = row.quote + indent + marker;
    }
    const from = row.line.from;
    const to = from + row.prefixLength;
    if (state.sliceDoc(from, to) !== prefix) changes.push({ from, to, insert: prefix });
  }
  return dispatchLineChanges(target, changes);
}

function toggleQuote(target: CommandTarget): boolean {
  const { state } = target;
  const rows = rowsFor(state, state.selection.ranges);
  if (!rows.length) return false;
  const allQuoted = rows.every((row) => row.quote !== "");
  const changes: ChangeSpec[] = [];
  for (const row of rows) {
    const from = row.line.from;
    if (allQuoted) {
      // One level at a time: "> > x" becomes "> x".
      const level = /^>[ \t]?/.exec(row.line.text)?.[0] ?? "";
      changes.push({ from, to: from + level.length });
    } else if (row.quote === "") {
      changes.push({ from, insert: "> " });
    }
  }
  return dispatchLineChanges(target, changes);
}

/** A nested list item must start under its parent's text: 3 columns for "1. ", 2 for "- ". */
function indentUnit(row: Row): number {
  return row.kind === "number" ? 3 : 2;
}

function shiftIndent(target: CommandTarget, direction: 1 | -1): boolean {
  const { state } = target;
  const rows = rowsFor(state, state.selection.ranges).filter(
    (row) => row.kind === "bullet" || row.kind === "number" || row.kind === "task",
  );
  const changes: ChangeSpec[] = [];
  for (const row of rows) {
    const at = row.line.from + row.quote.length;
    if (direction === 1) {
      changes.push({ from: at, insert: " ".repeat(indentUnit(row)) });
    } else if (row.indent) {
      const remove = row.indent.startsWith("\t") ? 1 : Math.min(indentUnit(row), row.indent.length);
      changes.push({ from: at, to: at + remove });
    }
  }
  return dispatchLineChanges(target, changes);
}

// ---------------------------------------------------------------------------------------------------------------
// Blocks: code block, horizontal rule, table
// ---------------------------------------------------------------------------------------------------------------

function fencedCodeAt(state: EditorState, pos: number): SyntaxNode | null {
  const tree = syntaxTree(state);
  for (const side of [-1, 1] as const) {
    for (let node: SyntaxNode | null = tree.resolveInner(pos, side); node; node = node.parent) {
      if (node.name === "FencedCode") return node;
    }
  }
  return null;
}

function toggleCodeBlock(target: CommandTarget): boolean {
  const { state } = target;
  const { doc } = state;
  const main = state.selection.main;

  const fenced = fencedCodeAt(state, main.head);
  if (fenced) {
    // Unwrap: remove the two fence lines and keep what is between them.
    const open = doc.lineAt(fenced.from);
    const close = doc.lineAt(fenced.to);
    const hasClose = close.number > open.number && /^\s*(```+|~~~+)\s*$/.test(close.text);
    const changes: ChangeSpec[] = [];
    if (hasClose && close.number === open.number + 1) {
      changes.push({ from: open.from, to: close.to < doc.length ? close.to + 1 : close.to });
    } else {
      changes.push({ from: open.from, to: Math.min(open.to + 1, doc.length) });
      if (hasClose) changes.push({ from: close.from - 1, to: close.to });
    }
    commit(target, { changes });
    return true;
  }

  const lines = linesOf(state, main);
  const first = lines[0];
  const last = lines[lines.length - 1];
  if (main.empty && first.text.trim() === "") {
    commit(target, {
      changes: { from: first.from, to: first.to, insert: "```\n\n```" },
      selection: EditorSelection.cursor(first.from + 4),
    });
    return true;
  }
  commit(target, {
    changes: [
      { from: first.from, insert: "```\n" },
      { from: last.to, insert: "\n```" },
    ],
    selection: EditorSelection.single(main.anchor + 4, main.head + 4),
  });
  return true;
}

/**
 * Inserts a block (rule, table) on its own lines, with a blank line before it so a line of text above never turns
 * it into a heading or swallows it, and one after it so the text below never becomes a table row.
 */
function insertBlock(target: CommandTarget, text: string, select?: Span): boolean {
  const { state } = target;
  const line = state.doc.lineAt(state.selection.main.head);
  const onBlankLine = line.text.trim() === "";
  const previousBlank = line.number === 1 || state.doc.line(line.number - 1).text.trim() === "";

  let from = line.to;
  let to = line.to;
  let lead = "\n\n";
  if (onBlankLine) {
    from = line.from;
    lead = previousBlank ? "" : "\n";
  }
  const insert = `${lead}${text}\n`;
  commit(target, {
    changes: { from, to, insert },
    selection: select
      ? EditorSelection.range(from + lead.length + select.from, from + lead.length + select.to)
      : EditorSelection.cursor(from + insert.length),
  });
  return true;
}

const TABLE_TEMPLATE = "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |";

// ---------------------------------------------------------------------------------------------------------------
// Clear formatting
// ---------------------------------------------------------------------------------------------------------------

function clearFormatting(target: CommandTarget): boolean {
  const { state } = target;
  const tree = syntaxTree(state);
  const spans = new Map<number, Span>();
  const addSpans = (node: SyntaxNode) => {
    const found = node.name === "Link" ? linkSpans(node) : INLINE_NODES.has(node.name) ? markSpans(node) : [];
    for (const span of found) spans.set(span.from, span);
  };

  for (const range of state.selection.ranges) {
    tree.iterate({
      from: range.from,
      to: range.to,
      enter: (node) => {
        if (node.name === "Link" || INLINE_NODES.has(node.name)) addSpans(node.node);
      },
    });
    for (const [pos, side] of [
      [range.from, 1],
      [range.to, -1],
    ] as const) {
      for (let node: SyntaxNode | null = tree.resolveInner(pos, side); node; node = node.parent) {
        if (node.name === "Link" || INLINE_NODES.has(node.name)) addSpans(node);
      }
    }
  }

  const changes: ChangeSpec[] = [...spans.values()].map((span) => ({ from: span.from, to: span.to }));
  for (const row of rowsFor(state, state.selection.ranges)) {
    if (row.prefixLength > 0) changes.push({ from: row.line.from, to: row.line.from + row.prefixLength });
  }
  return dispatchLineChanges(target, changes);
}

// ---------------------------------------------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------------------------------------------

/** Runs one formatting command against any target. Returns false when there was nothing to do. */
export function execFormat(target: CommandTarget, id: FormatId): boolean {
  if (target.state.readOnly) return false;
  switch (id) {
    case "bold":
    case "italic":
    case "strike":
    case "code":
      return toggleInline(target, id);
    case "link":
      return toggleLink(target);
    case "h1":
      return setBlock(target, { kind: "heading", level: 1 });
    case "h2":
      return setBlock(target, { kind: "heading", level: 2 });
    case "h3":
      return setBlock(target, { kind: "heading", level: 3 });
    case "bullet":
      return setBlock(target, { kind: "bullet" });
    case "number":
      return setBlock(target, { kind: "number" });
    case "task":
      return setBlock(target, { kind: "task" });
    case "quote":
      return toggleQuote(target);
    case "indent":
      return shiftIndent(target, 1);
    case "outdent":
      return shiftIndent(target, -1);
    case "codeblock":
      return toggleCodeBlock(target);
    case "hr":
      return insertBlock(target, "---");
    case "table":
      return insertBlock(target, TABLE_TEMPLATE, { from: 2, to: 10 });
    case "clear":
      return clearFormatting(target);
    case "undo":
      return undo(target as unknown as EditorView);
    case "redo":
      return redo(target as unknown as EditorView);
  }
}

/** Runs a command in the live editor and hands focus back to it, so the caret never leaves the note. */
export function runFormat(view: EditorView, id: FormatId): boolean {
  const done = execFormat(view, id);
  view.focus();
  return done;
}

/** What is formatted at the main selection. Cheap enough to run on every selection change. */
export function formatState(state: EditorState): FormatState {
  const active: FormatId[] = [];
  const { from, to, head } = state.selection.main;
  for (const id of ["bold", "italic", "strike", "code"] as const) {
    if (enclosing(state, from, to, INLINE[id].node)) active.push(id);
  }
  if (enclosing(state, from, to, "Link")) active.push("link");

  const rows = rowsFor(state, [state.selection.main]).filter((row) => !row.blank);
  if (rows.length) {
    const every = (test: (row: Row) => boolean) => rows.every(test);
    if (every((row) => row.kind === "heading" && row.level === 1)) active.push("h1");
    else if (every((row) => row.kind === "heading" && row.level === 2)) active.push("h2");
    else if (every((row) => row.kind === "heading" && row.level === 3)) active.push("h3");
    else if (every((row) => row.kind === "bullet")) active.push("bullet");
    else if (every((row) => row.kind === "number")) active.push("number");
    else if (every((row) => row.kind === "task")) active.push("task");
    if (every((row) => row.quote !== "")) active.push("quote");
  }
  if (fencedCodeAt(state, head)) active.push("codeblock");

  return { active, canUndo: undoDepth(state) > 0, canRedo: redoDepth(state) > 0 };
}

/**
 * Shortcuts. Low precedence on purpose: if the editor's own keymap already binds one of these keys, that binding
 * runs first and this one never fires, so nothing is ever applied twice.
 *
 * Mod+B is deliberately NOT here: AppShell uses it to show and hide the sidebar, and the sidebar advertises it. Bold
 * is on the toolbar. To make Mod+B bold instead, add `{ key: "Mod-b", run: (view) => runFormat(view, "bold"),
 * preventDefault: true }` below and `bold: "Mod+B"` to FORMAT_SHORTCUTS. AppShell ignores keys that are already
 * handled (it checks `defaultPrevented`), so inside the note Bold would win and the sidebar would keep Mod+B
 * everywhere else.
 */
export const formattingKeymap: Extension = Prec.low(
  keymap.of([
    { key: "Mod-i", run: (view) => runFormat(view, "italic"), preventDefault: true },
    { key: "Mod-Shift-x", run: (view) => runFormat(view, "strike"), preventDefault: true },
    { key: "Mod-e", run: (view) => runFormat(view, "code"), preventDefault: true },
    { key: "Mod-k", run: (view) => runFormat(view, "link"), preventDefault: true },
    { key: "Mod-Alt-1", run: (view) => runFormat(view, "h1"), preventDefault: true },
    { key: "Mod-Alt-2", run: (view) => runFormat(view, "h2"), preventDefault: true },
    { key: "Mod-Alt-3", run: (view) => runFormat(view, "h3"), preventDefault: true },
    { key: "Mod-Shift-7", run: (view) => runFormat(view, "number"), preventDefault: true },
    { key: "Mod-Shift-8", run: (view) => runFormat(view, "bullet"), preventDefault: true },
    { key: "Mod-Shift-9", run: (view) => runFormat(view, "task"), preventDefault: true },
  ]),
);
