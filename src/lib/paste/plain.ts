const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const BLANK_LINE_RUN = /\n{4,}/g;
const URL_LINE = /^https?:\/\/\S+$/i;

export function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(ZERO_WIDTH, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(BLANK_LINE_RUN, "\n\n\n");
}

export function convertPlainText(text: string, selectionText: string): string | null {
  const normalized = normalizePlainText(text);
  if (!normalized) return null;

  const url = normalized.trim();
  if (URL_LINE.test(url) && !url.includes("\n")) {
    const selected = selectionText.replace(/\r\n?/g, "\n");
    if (!selected || selected.includes("\n")) return null;
    const label = selected.replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
    return `[${label}](${url})`;
  }

  if (containsMarkdownSyntax(normalized)) {
    return normalized === text ? null : normalized;
  }

  const tabled = convertTabularRuns(normalized);
  const indented = replaceIndentTabs(tabled);
  const converted = indented
    .split("\n")
    .map(convertListLine)
    .join("\n");

  return converted === text ? null : converted;
}

function containsMarkdownSyntax(text: string): boolean {
  return (
    /(^|\n)\s{0,3}#{1,6}\s+/.test(text) ||
    /\*\*[^\n]+?\*\*|__[^\n]+?__/.test(text) ||
    /(^|[\s(])(?:\*[^*\n]+\*|_[^_\n]+_)(?=$|[\s).,!?:;])/.test(text) ||
    /~~[^~\n]+~~/.test(text) ||
    /(^|\n)\s{0,3}(?:```|~~~)/.test(text) ||
    /(^|\n)\s*\|[^\n]*\|\s*\n\s*\|?\s*:?-{3,}/.test(text) ||
    /!?\[[^\]]+\]\([^)]+\)/.test(text) ||
    /(^|\n)\s{0,3}\d+\.\s+/.test(text) ||
    /(^|\n)\s{0,3}>\s?/.test(text) ||
    /(^|\n)\s*(?:- |\+ |\* )\[(?: |[xX])\]\s/.test(text) ||
    /(^|\n)\s{0,3}[-*_]{3,}\s*(?:\n|$)/.test(text) ||
    /`[^`\n]+`/.test(text)
  );
}

function convertTabularRuns(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let index = 0; index < lines.length;) {
    const columns = lines[index].split("\t");
    if (columns.length < 2) {
      result.push(lines[index]);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < lines.length && lines[end].split("\t").length === columns.length) end += 1;

    if (end - index < 2) {
      result.push(lines[index]);
      index += 1;
      continue;
    }

    const rows = lines.slice(index, end).map((line) => line.split("\t"));
    const header = rows[0].map(escapeTableCell);
    const divider = header.map(() => "---");
    result.push(formatTableRow(header), formatTableRow(divider));
    for (const row of rows.slice(1)) result.push(formatTableRow(row.map(escapeTableCell)));
    // GFM reads a line right after a table as one more row, so a table always ends with a blank line.
    if (end < lines.length && lines[end].trim() !== "") result.push("");
    index = end;
  }

  return result.join("\n");
}

function escapeTableCell(value: string): string {
  return value.replace(/\\?\|/g, (pipe) => (pipe.startsWith("\\") ? pipe : "\\|"));
}

function formatTableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function replaceIndentTabs(text: string): string {
  return text.replace(/^(\t+)/gm, (tabs) => "  ".repeat(tabs.length));
}

function convertListLine(line: string): string {
  const indentation = line.match(/^[ \t]*/)?.[0] ?? "";
  const content = line.slice(indentation.length);
  const marker = /^(?:(\d+[.)]|\(\d+\)|[A-Za-z]\))|([•◦▪●○·►‣⁃–—*]))\s+(.*)$/u.exec(content);
  const taskSource = marker ? marker[3] : content;
  const task = /^(☐|☑|✓|\[\s\]|\[[xX]\])\s*(.*)$/u.exec(taskSource);

  if (task) {
    const checked = task[1] === "☑" || task[1] === "✓" || /^\[[xX]\]$/.test(task[1]);
    return `${indentation}- [${checked ? "x" : " "}]${task[2] ? ` ${task[2]}` : ""}`;
  }

  if (marker) {
    const ordered = marker[1] ? orderedListMarker(marker[1]) : null;
    return `${indentation}${ordered ?? "-"} ${marker[3]}`;
  }

  return line;
}

function orderedListMarker(marker: string): string {
  const number = /^(\d+)[.)]$/.exec(marker) ?? /^\((\d+)\)$/.exec(marker);
  if (number) return `${number[1]}.`;
  const letter = /^([A-Za-z])\)$/.exec(marker);
  if (letter) return `${letter[1].toLowerCase().charCodeAt(0) - 96}.`;
  return "1.";
}
