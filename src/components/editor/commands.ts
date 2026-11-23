import { EditorSelection, Prec, type ChangeSpec, type Extension, type TransactionSpec } from "@codemirror/state";
import { EditorView, keymap, type KeyBinding } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import {
  AUTO_EVENT,
  closingFence,
  fencedBlockAt,
  LIST_LINE,
  QUOTE_PREFIX,
  toggleTaskAt,
} from "./syntax";
import { onTableBackspace, onTableEnter, onTableTab, tableKeyBindings } from "./tableCommands";

export interface EditorBridge {
  /** ArrowUp from the first line, or Backspace at the very start, moves focus to the end of the title. */
  onAtTop: () => void;
}

const FENCE_OPEN = /^([ \t]*)(`{3,})/;
const INDENT = /^[ \t]*/;

/** An automatic edit: it is its own undo step, so one Cmd+Z reverts only this conversion. */
function autoEdit(view: EditorView, spec: TransactionSpec) {
  view.dispatch({ ...spec, userEvent: AUTO_EVENT, scrollIntoView: true });
}

/** Enter. Continues lists and quotes, opens fenced blocks with a closing fence, and keeps indent inside code. */
function onEnter(view: EditorView): boolean {
  if (view.composing) return false;
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const pos = range.head;
  const doc = state.doc;
  const line = doc.lineAt(pos);

  const block = fencedBlockAt(state, pos);
  if (block) {
    const open = doc.lineAt(block.from);
    const close = closingFence(block);
    if (line.number === open.number) {
      // A fence line typed with the caret at its end gets its closing fence right away.
      const fence = FENCE_OPEN.exec(line.text);
      if (!close && fence && pos === line.to) {
        const indent = fence[1];
        const insert = `\n${indent}\n${indent}${fence[2]}`;
        autoEdit(view, { changes: { from: pos, insert }, selection: { anchor: pos + 1 + indent.length } });
        return true;
      }
      return false;
    }
    if (close && line.number === doc.lineAt(close.from).number) return false;
    // Inside the body: a new line that keeps the indent of the line above.
    const indent = INDENT.exec(line.text)?.[0] ?? "";
    view.dispatch({
      changes: { from: pos, insert: `\n${indent}` },
      selection: { anchor: pos + 1 + indent.length },
      scrollIntoView: true,
      userEvent: "input",
    });
    return true;
  }

  const list = LIST_LINE.exec(line.text);
  if (list) {
    const markerLength = list[0].length;
    if (pos < line.from + markerLength) return false;
    if (line.text.slice(markerLength).trim() === "") {
      // An empty item leaves the list. Nested, it steps out one level first.
      const indent = list[1].length;
      if (indent > 0) {
        const remove = Math.min(2, indent);
        autoEdit(view, {
          changes: { from: line.from, to: line.from + remove },
          selection: { anchor: Math.max(line.from, pos - remove) },
        });
      } else {
        // Leaving at the top level ends the list with a blank line, so the next text starts a new paragraph.
        autoEdit(view, { changes: { from: line.from, to: line.to, insert: "\n" }, selection: { anchor: line.from + 1 } });
      }
      return true;
    }
    // Continue the list: same bullet, next number, and a fresh unchecked box for a task.
    const marker = list[2];
    const next = /\d/.test(marker) ? `${parseInt(marker, 10) + 1}${marker.slice(-1)}` : marker;
    const task = list[4] ? "[ ] " : "";
    const insert = `\n${list[1]}${next}${list[3]}${task}`;
    autoEdit(view, { changes: { from: pos, insert }, selection: { anchor: pos + insert.length } });
    return true;
  }

  const quote = QUOTE_PREFIX.exec(line.text);
  if (quote) {
    const prefix = quote[0];
    if (pos < line.from + prefix.length) return false;
    if (line.text.slice(prefix.length).trim() === "") {
      // Leaving a quote ends it with a blank line, as with lists.
      autoEdit(view, { changes: { from: line.from, to: line.to, insert: "\n" }, selection: { anchor: line.from + 1 } });
    } else {
      const insert = `\n${prefix.endsWith(" ") ? prefix : `${prefix} `}`;
      autoEdit(view, { changes: { from: pos, insert }, selection: { anchor: pos + insert.length } });
    }
    return true;
  }

  return false;
}

/** Backspace right after a list marker turns the item back into plain text. At the very start it goes to the title. */
function onBackspace(view: EditorView, bridge: EditorBridge): boolean {
  if (view.composing) return false;
  const range = view.state.selection.main;
  if (!range.empty) return false;
  const pos = range.head;
  if (pos === 0) {
    bridge.onAtTop();
    return true;
  }
  const line = view.state.doc.lineAt(pos);
  const list = LIST_LINE.exec(line.text);
  if (list && pos === line.from + list[0].length) {
    autoEdit(view, { changes: { from: line.from, to: pos }, selection: { anchor: line.from } });
    return true;
  }
  return false;
}

/** ArrowUp on the first visual row of the first line moves focus to the title. */
function onArrowUp(view: EditorView, bridge: EditorBridge): boolean {
  if (view.composing) return false;
  const range = view.state.selection.main;
  if (!range.empty || view.state.doc.lineAt(range.head).number !== 1) return false;
  const coords = view.coordsAtPos(range.head);
  const top = view.contentDOM.getBoundingClientRect().top;
  // A wrapped first line still has rows above the caret, so the caret moves within it first.
  if (coords && coords.top - top >= 28) return false;
  bridge.onAtTop();
  return true;
}

/** Leaves a fenced block downward: the caret moves to the line after its closing fence. */
function exitBelow(view: EditorView, block: SyntaxNode): boolean {
  const doc = view.state.doc;
  const close = closingFence(block);
  if (!close) return false;
  const closeLine = doc.lineAt(close.from);
  if (closeLine.number < doc.lines) {
    view.dispatch({ selection: { anchor: closeLine.to + 1 }, scrollIntoView: true });
  } else {
    view.dispatch({
      changes: { from: closeLine.to, insert: "\n" },
      selection: { anchor: closeLine.to + 1 },
      scrollIntoView: true,
      userEvent: "input",
    });
  }
  return true;
}

/** ArrowDown on the last line of a code body leaves the block. */
function onArrowDown(view: EditorView): boolean {
  if (view.composing) return false;
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const block = fencedBlockAt(state, range.head);
  if (!block) return false;
  const close = closingFence(block);
  if (!close) return false;
  const line = state.doc.lineAt(range.head);
  const closeLine = state.doc.lineAt(close.from);
  if (line.number !== closeLine.number - 1 || range.head !== line.to) return false;
  if (line.number <= state.doc.lineAt(block.from).number) return false;
  return exitBelow(view, block);
}

/** Cmd/Ctrl+Enter: toggles a task box, or leaves a code block. Elsewhere it keeps the default blank line. */
function onModEnter(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  if (toggleTaskAt(view, pos)) return true;
  const block = fencedBlockAt(view.state, pos);
  if (block) return exitBelow(view, block);
  return false;
}

/**
 * Tab nests a list item by two spaces (or the marker width for numbers). Inside code it inserts two spaces.
 * Outside lists and code it is left alone, so Tab still moves focus.
 */
function onTab(view: EditorView, outdent: boolean): boolean {
  if (view.composing) return false;
  const { state } = view;
  const range = state.selection.main;
  const line = state.doc.lineAt(range.head);
  const block = fencedBlockAt(state, range.head);
  if (block) {
    const close = closingFence(block);
    const onFence =
      line.number === state.doc.lineAt(block.from).number ||
      (close !== null && line.number === state.doc.lineAt(close.from).number);
    if (onFence) return false;
    if (outdent) return removeIndent(view, line.from, 2);
    view.dispatch(state.replaceSelection("  "));
    return true;
  }

  const list = LIST_LINE.exec(line.text);
  if (!list) return false;
  const step = list[2].length + list[3].length;
  if (outdent) return removeIndent(view, line.from, Math.min(step, list[1].length));
  view.dispatch({
    changes: { from: line.from, insert: " ".repeat(step) },
    selection: { anchor: range.head + step },
    userEvent: "input.indent",
  });
  return true;
}

function removeIndent(view: EditorView, lineFrom: number, count: number): boolean {
  const { state } = view;
  const text = state.doc.lineAt(lineFrom).text;
  let n = 0;
  while (n < count && text[n] === " ") n++;
  if (n === 0) return true;
  const head = state.selection.main.head;
  view.dispatch({
    changes: { from: lineFrom, to: lineFrom + n },
    selection: { anchor: Math.max(lineFrom, head - n) },
    userEvent: "delete.dedent",
  });
  return true;
}

/** Cmd/Ctrl+B and Cmd/Ctrl+I: wrap the selection, or unwrap it when it is already wrapped. */
function wrapSelection(view: EditorView, marker: string): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const doc = state.doc;
  const m = marker.length;

  if (from === to) {
    view.dispatch({
      changes: { from, insert: marker + marker },
      selection: { anchor: from + m },
      userEvent: "input",
    });
    return true;
  }

  const before = doc.sliceString(Math.max(0, from - m), from);
  const after = doc.sliceString(to, to + m);
  if (before === marker && after === marker) {
    const changes: ChangeSpec[] = [
      { from: from - m, to: from },
      { from: to, to: to + m },
    ];
    view.dispatch({ changes, selection: EditorSelection.range(from - m, to - m), userEvent: "input" });
    return true;
  }

  const selected = doc.sliceString(from, to);
  if (selected.length >= 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const changes: ChangeSpec[] = [
      { from, to: from + m },
      { from: to - m, to },
    ];
    view.dispatch({ changes, selection: EditorSelection.range(from, to - 2 * m), userEvent: "input" });
    return true;
  }

  view.dispatch({
    changes: [
      { from, insert: marker },
      { from: to, insert: marker },
    ],
    selection: EditorSelection.range(from + m, to + m),
    userEvent: "input",
  });
  return true;
}

/**
 * Typing the third backtick of a closing fence inside a block that already has one below: the typed fence leaves
 * the block instead of opening a new one. The two typed backticks are dropped and the caret steps below the fence.
 */
export const fenceExitOnBacktick = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== "`" || from !== to || view.composing) return false;
  const { state } = view;
  const line = state.doc.lineAt(from);
  if (!/^[ \t]*``$/.test(line.text.slice(0, from - line.from))) return false;
  const block = fencedBlockAt(state, from);
  if (!block) return false;
  const close = closingFence(block);
  if (!close) return false;
  const closeLine = state.doc.lineAt(close.from);
  if (line.number <= state.doc.lineAt(block.from).number || line.number >= closeLine.number) return false;

  // The typed line goes with its line break, so no empty row is left inside the block.
  const removeFrom = line.from - 1;
  const removed = from - removeFrom;
  const changes: ChangeSpec[] = [{ from: removeFrom, to: from }];
  if (closeLine.number >= state.doc.lines) changes.push({ from: closeLine.to, insert: "\n" });
  // The caret goes to the line after the closing fence, in the new document.
  view.dispatch({
    changes,
    selection: { anchor: closeLine.to - removed + 1 },
    scrollIntoView: true,
    userEvent: AUTO_EVENT,
  });
  return true;
});

/** The editor's own keys. Prec.highest, so they run before the default keymap. */
export function editorKeymap(bridge: EditorBridge): Extension {
  const bindings: KeyBinding[] = [
    { key: "Enter", run: (view) => onTableEnter(view) || onEnter(view) },
    { key: "Backspace", run: (view) => onTableBackspace(view) || onBackspace(view, bridge) },
    { key: "Tab", run: (view) => onTableTab(view, false) || onTab(view, false) },
    { key: "Shift-Tab", run: (view) => onTableTab(view, true) || onTab(view, true) },
    ...tableKeyBindings,
    { key: "Mod-Enter", run: onModEnter },
    { key: "ArrowDown", run: onArrowDown },
    { key: "ArrowUp", run: (view) => onArrowUp(view, bridge) },
    { key: "Mod-b", run: (view) => wrapSelection(view, "**") },
    { key: "Mod-i", run: (view) => wrapSelection(view, "*") },
  ];
  return Prec.highest(keymap.of(bindings));
}
