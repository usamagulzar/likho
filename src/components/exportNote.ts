/**
 * Save-as helpers for the writing pad. The text functions are pure; downloadText is the only DOM code.
 * A note is one string: the first line is the title, everything after the first line break is the body.
 */

export type ExportFormat = "md" | "txt";

const MIME: Record<ExportFormat, string> = {
  md: "text/markdown;charset=utf-8",
  txt: "text/plain;charset=utf-8",
};

/** Splits a stored note into its title (first line) and body (the rest). */
export function splitNote(content: string): { title: string; body: string } {
  const lineBreak = /\r?\n/.exec(content);
  if (!lineBreak) return { title: content, body: "" };
  return {
    title: content.slice(0, lineBreak.index),
    body: content.slice(lineBreak.index + lineBreak[0].length),
  };
}

/** The file's text. Markdown keeps the title as a heading; plain text writes it as a plain line. */
export function noteToText(content: string, format: ExportFormat): string {
  const { title: rawTitle, body: rawBody } = splitNote(content.replace(/\r\n?/g, "\n"));
  const title = rawTitle.trim();
  const body = rawBody.replace(/\s+$/, "");
  const titleLine = title === "" ? "" : format === "md" ? `# ${title}` : title;
  const blocks = [titleLine, body].filter((block) => block !== "");
  if (blocks.length === 0) return "";
  return `${blocks.join("\n\n")}\n`;
}

/** A file name from the title: no path or reserved characters, one line, at most 80 characters. */
export function noteFilename(title: string, format: ExportFormat): string {
  const cleaned = title
    .trim()
    // Path separators, reserved characters and control characters become "-".
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  // Array.from keeps surrogate pairs whole when cutting to 80 characters.
  const base = Array.from(cleaned).slice(0, 80).join("").trim() || "Untitled note";
  return `${base}.${format}`;
}

/** Downloads text as a file: Blob, a temporary object URL and a link with the download attribute. */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers still need the URL for a moment after the click starts the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Saves the note as a file. Returns the file name, or null when the note is completely empty (nothing saved). */
export function saveNoteFile(content: string, format: ExportFormat): string | null {
  if (content.trim() === "") return null;
  const { title } = splitNote(content.replace(/\r\n?/g, "\n"));
  const filename = noteFilename(title, format);
  downloadText(filename, noteToText(content, format), MIME[format]);
  return filename;
}
