import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

/**
 * A bullet, numbered or task item line. Group 1 is the indent, 2 the marker, 3 the spacing after it and 4 the task
 * box. A marker only counts when a space or tab follows it, so a lone "-" (on its way to "---") stays plain text.
 */
export const LIST_LINE = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)(\[[ xX]\][ \t]+)?/;
/** A blockquote prefix such as "> " or "> > ". */
export const QUOTE_PREFIX = /^[ \t]*(?:>[ \t]?)+/;

/** The FencedCode node around a position, or null. Looks on both sides so an edge position still finds its block. */
export function fencedBlockAt(state: EditorState, pos: number): SyntaxNode | null {
  const tree = syntaxTree(state);
  for (const side of [1, -1] as const) {
    let node: SyntaxNode | null = tree.resolveInner(pos, side);
    while (node && node.name !== "FencedCode") node = node.parent;
    if (node) return node;
  }
  return null;
}

/** The closing fence mark of a fenced block, or null while the block is still open. */
export function closingFence(block: SyntaxNode): SyntaxNode | null {
  const first = block.firstChild;
  const last = block.lastChild;
  if (!first || !last || last.name !== "CodeMark" || last.from === first.from) return null;
  return last;
}

/** The language word after the opening fence, or "". */
export function fenceInfo(state: EditorState, block: SyntaxNode): string {
  const info = block.getChild("CodeInfo");
  return info ? state.doc.sliceString(info.from, info.to).trim() : "";
}

/** The code between the fence lines, without the fences. */
export function fenceBody(state: EditorState, block: SyntaxNode): string {
  const doc = state.doc;
  const open = doc.lineAt(block.from);
  const close = closingFence(block);
  const end = close ? doc.lineAt(close.from).from - 1 : block.to;
  return end > open.to ? doc.sliceString(open.to + 1, end) : "";
}

/** Flips the [ ] / [x] box of the task item on the line at pos. Returns false when that line has no task box. */
export function toggleTaskAt(view: EditorView, pos: number): boolean {
  const line = view.state.doc.lineAt(pos);
  const match = LIST_LINE.exec(line.text);
  if (!match || !match[4]) return false;
  const boxStart = line.from + match[0].length - match[4].length;
  const checked = match[4][1] !== " ";
  view.dispatch({
    changes: { from: boxStart + 1, to: boxStart + 2, insert: checked ? " " : "x" },
    userEvent: "input.toggle",
  });
  return true;
}

/** Text of an automatic edit. Not joinable with typing, so one Cmd+Z reverts only this conversion. */
export const AUTO_EVENT = "input.autoformat";
