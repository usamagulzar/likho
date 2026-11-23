import { syntaxTree } from "@codemirror/language";
import { StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

export interface TableRowNode {
  node: SyntaxNode;
  header: boolean;
}

export interface TableCellSource {
  /** The trimmed Markdown content range, used as the cell's caret position. */
  from: number;
  to: number;
  /** The range between separator pipes, including padding spaces. */
  rawFrom: number;
  rawTo: number;
  text: string;
}

type CellAlignment = "left" | "center" | "right";

interface RenderCell extends TableCellSource {
  alignment: CellAlignment;
}

interface RenderRow {
  header: boolean;
  cells: RenderCell[];
}

/** Parsed GFM table nodes, excluding any table-like text in fenced code (which GFM does not parse as Table). */
export function tableNodes(state: EditorView["state"]): SyntaxNode[] {
  const tables: SyntaxNode[] = [];
  syntaxTree(state).iterate({
    enter(ref) {
      if (ref.name === "Table") {
        tables.push(ref.node);
        return false;
      }
    },
  });
  return tables;
}

/** The header and body rows in source order. The delimiter row is intentionally omitted. */
export function tableRows(table: SyntaxNode): TableRowNode[] {
  const rows: TableRowNode[] = [];
  for (let child = table.firstChild; child; child = child.nextSibling) {
    if (child.name === "TableHeader") rows.push({ node: child, header: true });
    else if (child.name === "TableRow") rows.push({ node: child, header: false });
  }
  return rows;
}

/**
 * Split one parsed table row into source-mapped cells. Empty cells are not represented by Lezer nodes, so this
 * reads the row text and treats only unescaped pipes as separators.
 */
export function splitTableCells(source: string, sourceFrom: number, columns?: number): TableCellSource[] {
  const left = source.search(/\S|$/);
  const right = source.trimEnd().length;
  let start = left;
  let end = right;

  if (source[start] === "|") start += 1;
  if (end > start && source[end - 1] === "|" && !isEscaped(source, end - 1)) end -= 1;

  const ranges: Array<{ from: number; to: number }> = [];
  let cellStart = start;
  for (let index = start; index < end; index += 1) {
    if (source[index] !== "|" || isEscaped(source, index)) continue;
    ranges.push({ from: cellStart, to: index });
    cellStart = index + 1;
  }
  ranges.push({ from: cellStart, to: end });

  const cells = ranges.map(({ from, to }) => {
    let contentFrom = from;
    let contentTo = to;
    while (contentFrom < contentTo && /\s/.test(source[contentFrom] ?? "")) contentFrom += 1;
    while (contentTo > contentFrom && /\s/.test(source[contentTo - 1] ?? "")) contentTo -= 1;
    // An empty cell puts the caret after the first padding space, so typing gives "| text |" and not "|  text|".
    if (contentFrom >= contentTo) {
      contentFrom = Math.min(from + 1, to);
      contentTo = contentFrom;
    }
    return {
      from: sourceFrom + contentFrom,
      to: sourceFrom + contentTo,
      rawFrom: sourceFrom + from,
      rawTo: sourceFrom + to,
      text: source.slice(contentFrom, contentTo),
    };
  });

  if (columns === undefined) return cells;
  if (cells.length > columns) return cells.slice(0, columns);
  while (cells.length < columns) {
    const at = sourceFrom + source.length;
    cells.push({ from: at, to: at, rawFrom: at, rawTo: at, text: "" });
  }
  return cells;
}

function isEscaped(source: string, index: number): boolean {
  let slashes = 0;
  for (let at = index - 1; at >= 0 && source[at] === "\\"; at -= 1) slashes += 1;
  return slashes % 2 === 1;
}

function directDelimiterRow(table: SyntaxNode): SyntaxNode | null {
  for (let child = table.firstChild; child; child = child.nextSibling) {
    if (child.name === "TableDelimiter" && child.to - child.from > 1) return child;
  }
  return null;
}

function alignments(state: EditorView["state"], table: SyntaxNode, columns: number): CellAlignment[] {
  const delimiter = directDelimiterRow(table);
  if (!delimiter) return Array.from({ length: columns }, () => "left");
  const source = state.doc.sliceString(delimiter.from, delimiter.to);
  return splitTableCells(source, delimiter.from, columns).map(({ text }) => {
    const marker = text.trim();
    const starts = marker.startsWith(":");
    const ends = marker.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
  });
}

function renderRows(state: EditorView["state"], table: SyntaxNode): RenderRow[] {
  const doc = state.doc;
  const sourceRows = tableRows(table);
  const header = sourceRows.find((row) => row.header);
  if (!header) return [];
  const headerLine = doc.sliceString(header.node.from, header.node.to);
  const columns = splitTableCells(headerLine, header.node.from).length;
  const columnAlignments = alignments(state, table, columns);
  return sourceRows.map((row) => {
    const source = doc.sliceString(row.node.from, row.node.to);
    return {
      header: row.header,
      cells: splitTableCells(source, row.node.from, columns).map((cell, index) => ({
        ...cell,
        alignment: columnAlignments[index] ?? "left",
      })),
    };
  });
}

class TableWidget extends WidgetType {
  private readonly signature: string;
  private readonly firstCellFrom: number;

  constructor(private readonly rows: RenderRow[]) {
    super();
    this.firstCellFrom = rows[0]?.cells[0]?.from ?? 0;
    this.signature = JSON.stringify(rows);
  }

  eq(other: TableWidget): boolean {
    return this.signature === other.signature;
  }

  toDOM(view: EditorView): HTMLElement {
    const scroll = document.createElement("div");
    scroll.className = "md-table-scroll";
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Markdown table preview; click a cell to edit");
    scroll.contentEditable = "false";
    scroll.style.height = `${Math.max(1, this.rows.length) * 28}px`;

    const table = document.createElement("table");
    table.className = "md-table";
    const head = document.createElement("thead");
    const body = document.createElement("tbody");

    for (const row of this.rows) {
      const tr = document.createElement("tr");
      tr.className = row.header ? "md-table-header" : "md-table-row";
      for (const item of row.cells) {
        const cell = document.createElement(row.header ? "th" : "td");
        cell.style.textAlign = item.alignment;
        cell.dataset.sourceFrom = String(item.from);
        cell.dataset.sourceTo = String(item.to);
        if (row.header) cell.setAttribute("scope", "col");
        appendInline(cell, item.text);
        tr.append(cell);
      }
      (row.header ? head : body).append(tr);
    }

    table.append(head, body);
    scroll.append(table);

    scroll.addEventListener("mousedown", (event) => {
      if (event.button === 0) event.preventDefault();
    });
    scroll.addEventListener("click", (event) => {
      const target = event.target;
      const cell = target instanceof Element ? target.closest<HTMLElement>("[data-source-from]") : null;
      // The caret goes to the end of the clicked cell's text, where you'd keep typing.
      const pos = cell ? Number(cell.dataset.sourceTo) : this.firstCellFrom;
      view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
      view.focus();
    });
    return scroll;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

const pipeMark = Decoration.mark({ class: "md-table-pipe" });
const sourceLine = Decoration.line({ attributes: { class: "md-table-source" } });
const INLINE_TOKEN = /\\\||\[[^\]\n]+\]\([^)]+\)|`[^`\n]+`|~~[^~\n]+~~|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_/g;

function appendInline(parent: HTMLElement, source: string): void {
  let cursor = 0;
  for (const match of source.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const from = match.index ?? 0;
    if (from > cursor) parent.append(document.createTextNode(source.slice(cursor, from)));

    if (token === "\\|") {
      parent.append(document.createTextNode("|"));
    } else if (token.startsWith("[")) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = link ? safeLink(link[2]) : null;
      if (!link || !href) parent.append(document.createTextNode(link?.[1] ?? token));
      else {
        const anchor = document.createElement("a");
        anchor.className = "md-table-link";
        anchor.href = href;
        anchor.rel = "noopener noreferrer";
        if (/^https?:/i.test(href)) anchor.target = "_blank";
        appendInline(anchor, link[1]);
        parent.append(anchor);
      }
    } else if (token.startsWith("`")) {
      const code = document.createElement("code");
      code.className = "md-code-inline";
      code.textContent = token.slice(1, -1);
      parent.append(code);
    } else {
      const strong = token.startsWith("**") || token.startsWith("__");
      const strike = token.startsWith("~~");
      const element = document.createElement(strong ? "strong" : strike ? "del" : "em");
      const markerLength = strong || strike ? 2 : 1;
      appendInline(element, token.slice(markerLength, -markerLength));
      parent.append(element);
    }

    cursor = from + token.length;
  }
  if (cursor < source.length) parent.append(document.createTextNode(source.slice(cursor)));
}

function safeLink(href: string): string | null {
  try {
    const parsed = new URL(href, document.baseURI);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? href : null;
  } catch {
    return null;
  }
}

function addRawDecorations(state: EditorView["state"], table: SyntaxNode, ranges: ReturnType<typeof pipeMark.range>[]): void {
  const doc = state.doc;
  const start = doc.lineAt(table.from);
  const end = doc.lineAt(table.to);
  for (let number = start.number; number <= end.number; number += 1) {
    ranges.push(sourceLine.range(doc.line(number).from));
  }

  const addPipes = (node: SyntaxNode) => {
    if (node.name === "TableDelimiter" && node.to - node.from === 1) {
      ranges.push(pipeMark.range(node.from, node.to));
    }
    for (let child = node.firstChild; child; child = child.nextSibling) addPipes(child);
  };
  addPipes(table);
}

function activeInSelection(state: EditorView["state"], from: number, to: number): boolean {
  return state.selection.ranges.some((range) =>
    range.empty ? range.from >= from && range.from < to : range.from < to && range.to > from,
  );
}

function build(state: EditorView["state"]): DecorationSet {
  const ranges: ReturnType<typeof pipeMark.range>[] = [];
  const doc = state.doc;
  for (const table of tableNodes(state)) {
    const from = doc.lineAt(table.from).from;
    const to = doc.lineAt(table.to).to;
    if (activeInSelection(state, from, to)) {
      addRawDecorations(state, table, ranges);
    } else {
      ranges.push(Decoration.replace({ widget: new TableWidget(renderRows(state, table)), block: true }).range(from, to));
    }
  }
  return Decoration.set(ranges, true);
}

/** Block replacements must come from a state field. Raw mode is selected from the source selection, never by editing. */
export const tablePreview = StateField.define<DecorationSet>({
  create: build,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection ? build(transaction.state) : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

