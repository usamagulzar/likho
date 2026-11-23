import { deriveTitle, type Note, type NoteSummary } from "@/lib/types";

export function deriveNoteTitle(content: string): string {
  return deriveTitle(content);
}

export function summarizeNote(note: Pick<Note, "id" | "content" | "updatedAt">): NoteSummary {
  return {
    id: note.id,
    title: deriveNoteTitle(note.content),
    updatedAt: note.updatedAt,
  };
}

export function sortNoteSummaries(notes: readonly NoteSummary[]): NoteSummary[] {
  return [...notes].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function isBlankContent(content: string): boolean {
  return content.trim().length === 0;
}

export function nextUpdatedAt(previous: number, now = Date.now()): number {
  return Math.max(now, previous + 1);
}

export function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Older browsers may not expose randomUUID even when crypto itself is available.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
