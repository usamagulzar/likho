export const MAX_NOTE_CONTENT_BYTES = 1_048_576;

export interface NoteParts {
  title: string;
  body: string;
}

export function splitNoteContent(content: string): NoteParts {
  const newline = content.indexOf("\n");
  if (newline === -1) return { title: content, body: "" };

  const rawTitle = content.slice(0, newline);
  return {
    title: rawTitle.endsWith("\r") ? rawTitle.slice(0, -1) : rawTitle,
    body: content.slice(newline + 1),
  };
}

export function joinNoteContent(title: string, body: string): string {
  return body.length > 0 ? `${title}\n${body}` : title;
}

export function hasValidTitle(title: string): boolean {
  return title.length <= 200 && !/[\r\n]/.test(title);
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function escapeLikeQuery(query: string): string {
  return query.replace(/[\\%_]/g, "\\$&");
}

export function makeSnippet(content: string, query: string): string {
  const matchAt = content.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (matchAt === -1) return content.slice(0, 160);

  const start = Math.max(0, matchAt - 80);
  const end = Math.min(content.length, matchAt + query.length + 80);
  return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
}
