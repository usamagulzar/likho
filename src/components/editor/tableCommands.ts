import { EditorView, type KeyBinding } from "@codemirror/view";
import { AUTO_EVENT, fencedBlockAt } from "./syntax";
import { splitTableCells, tableNodes, tableRows, type TableCellSource, type TableRowNode } from "./tables";

interface CommandRow extends TableRowNode {
  cells: TableCellSource[];
}

interface TableContext {
  table: ReturnType<typeof tableNodes>[number];
  rows: CommandRow[];
  row: CommandRow;
  cell: TableCellSource;
  index: number;
  columns: number;
}

function delimiterRow(table: TableContext["table"]): TableContext["table"] | null {
  for (let child = table.firstChild; child; child = child.nextSibling) {
    if (child.name === "TableDelimiter" && child.to - child.from > 1) return child;
  }
  return null;
}

function tableAt(view: EditorView, pos: number): TableContext | null {
  const { state } = view;
  if (fencedBlockAt(state, pos)) return null;
  const table = tableNodes(state).find((node) => pos >= node.from && pos <= node.to);
  if (!table) return null;

  const sourceRows = tableRows(table);
  const header = sourceRows.find((row) => row.header);
  if (!header) return null;
  const columns = splitTableCells(state.doc.sliceString(header.node.from, header.node.to), header.node.from).length;
  const rows = sourceRows.map((row) => ({
    ...row,
    cells: splitTableCells(state.doc.sliceString(row.node.from, row.node.to), row.node.from, columns),
  }));
  const allCells = rows.flatMap((row) => row.cells);
  if (!allCells.length) return null;

  let index = allCells.findIndex((cell) => pos >= cell.rawFrom && pos <= cell.rawTo);
  if (index < 0) {
    index = allCells.findIndex((cell) => pos < cell.rawFrom);
    if (index < 0) index = allCells.length - 1;
  }
  const cell = allCells[index];
  const row = rows.find((candidate) => candidate.cells.includes(cell));
  return row ? { table, rows, row, cell, index, columns } : null;
}

function blankRow(columns: number): string {
  return `| ${Array.from({ length: columns }, () => "").join(" | ")} |`;
}

function dispatchAuto(view: EditorView, changes: Parameters<EditorView["dispatch"]>[0]["changes"], anchor: number): void {
  view.dispatch({ changes, selection: { anchor }, userEvent: AUTO_EVENT, scrollIntoView: true });
}

/** Creates a small GFM table before the current line, selecting its first header cell. */
export function insertMarkdownTable(view: EditorView): boolean {
  if (view.composing) return false;
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  if (fencedBlockAt(state, state.selection.main.head)) return false;

  const starter = "| Column | Column | Column |\n| --- | --- | --- |\n|  |  |  |";
  const insert = line.text ? `${starter}\n` : starter;
  const selectedFrom = line.from + 2;
  view.dispatch({
    changes: { from: line.from, insert },
    selection: { anchor: selectedFrom, head: selectedFrom + "Column".length },
    userEvent: AUTO_EVENT,
    scrollIntoView: true,
  });
  return true;
}

/** Converts a typed pipe row into a GFM table on Enter. */
export function onTableEnter(view: EditorView): boolean {
  if (view.composing) return false;
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const pos = range.head;
  if (fencedBlockAt(state, pos)) return false;

  const context = tableAt(view, pos);
  if (context) {
    if (!context.row.header && context.row.cells.every((cell) => cell.text.trim() === "")) {
      leaveEmptyTableRow(view, context);
      return true;
    }

    const after = context.row.header ? delimiterRow(context.table) : context.row.node;
    if (!after) return false;
    const line = state.doc.lineAt(after.to);
    const insert = `\n${blankRow(context.columns)}`;
    dispatchAuto(view, { from: line.to, insert }, line.to + 3);
    return true;
  }

  const line = state.doc.lineAt(pos);
  if (pos !== line.to) return false;
  const cells = splitTableCells(line.text, line.from);
  if (cells.length < 2) return false;

  const divider = `| ${Array.from({ length: cells.length }, () => "---").join(" | ")} |`;
  const body = blankRow(cells.length);
  const insert = `\n${divider}\n${body}`;
  const bodyStart = pos + 1 + divider.length + 1;
  dispatchAuto(view, { from: pos, insert }, bodyStart + 2);
  return true;
}

function leaveEmptyTableRow(view: EditorView, context: TableContext): void {
  const { state } = view;
  const line = state.doc.lineAt(context.row.node.from);
  const lastRow = context.rows[context.rows.length - 1];
  const isLastRow = lastRow?.node === context.row.node;

  if (isLastRow) {
    // Keep the line break so the caret lands in an empty paragraph after the remaining table.
    dispatchAuto(view, { from: line.from, to: line.to, insert: "" }, line.from);
    return;
  }

  // Keep the remaining rows together, then add one blank paragraph after the table to leave it.
  const deleteTo = Math.min(line.to + 1, state.doc.length);
  const removed = deleteTo - line.from;
  const tableEnd = context.table.to;
  view.dispatch({
    changes: [
      { from: line.from, to: deleteTo },
      { from: tableEnd, insert: "\n" },
    ],
    selection: { anchor: tableEnd - removed + 1 },
    userEvent: AUTO_EVENT,
    scrollIntoView: true,
  });
}

/** Moves between cells and adds a blank row at the end of a table. */
export function onTableTab(view: EditorView, backwards: boolean): boolean {
  if (view.composing) return false;
  const range = view.state.selection.main;
  const context = tableAt(view, range.head);
  if (!context) return false;
  if (!range.empty && (range.from < context.cell.rawFrom || range.to > context.cell.rawTo)) return false;

  if (backwards) {
    if (context.index === 0) return false;
    const previous = context.rows.flatMap((row) => row.cells)[context.index - 1];
    view.dispatch({ selection: { anchor: previous.from, head: previous.to }, scrollIntoView: true });
    return true;
  }

  const allCells = context.rows.flatMap((row) => row.cells);
  if (context.index < allCells.length - 1) {
    const next = allCells[context.index + 1];
    view.dispatch({ selection: { anchor: next.from, head: next.to }, scrollIntoView: true });
    return true;
  }

  const lastNode = context.table;
  const line = view.state.doc.lineAt(lastNode.to);
  const insert = `\n${blankRow(context.columns)}`;
  dispatchAuto(view, { from: line.to, insert }, line.to + 3);
  return true;
}

/** Keeps Backspace from deleting a separator in an empty source cell. */
export function onTableBackspace(view: EditorView): boolean {
  if (view.composing) return false;
  const range = view.state.selection.main;
  if (!range.empty) return false;
  const context = tableAt(view, range.head);
  if (!context || context.cell.text.trim() !== "") return false;
  return range.head >= context.cell.rawFrom && range.head <= context.cell.rawTo;
}

/** Typing a pipe inside cell content inserts the escaped literal `\\|`. */
export const tablePipeInputHandler = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== "|" || view.composing) return false;
  const context = tableAt(view, from);
  if (!context || from < context.cell.rawFrom || to > context.cell.rawTo) return false;
  view.dispatch({
    changes: { from, to, insert: "\\|" },
    selection: { anchor: from + 2 },
    userEvent: "input",
  });
  return true;
});

export const tableKeyBindings: KeyBinding[] = [
  { key: "Mod-Alt-t", run: insertMarkdownTable },
];

