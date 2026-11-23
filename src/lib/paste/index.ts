import { convertHtml, parseHtmlInBrowser } from "./html";
import { readExcalidrawText } from "./excalidraw";
import { convertPlainText } from "./plain";
import type { ClipboardInput, HtmlParser, PasteResult } from "./types";

const IMAGE_MESSAGE = "Images can't be pasted into notes yet.";
const DRAWING_MESSAGE = "Drawings can't be pasted into a note yet — only their text can.";
const MAX_OUTPUT_BYTES = 1_048_576;

export type { ClipboardInput, PasteResult } from "./types";

export function convertClipboard(input: ClipboardInput): PasteResult {
  return convertClipboardWithParser(input, parseHtmlInBrowser);
}

/** Parser injection keeps HTML conversion testable in Node without browser globals. */
export function convertClipboardWithParser(input: ClipboardInput, parseHtml: HtmlParser): PasteResult {
  try {
    const html = input.html ?? "";
    const text = input.text ?? "";
    const excalidraw = readExcalidrawText(text);
    if (excalidraw !== null) {
      if (!excalidraw.length) return { kind: "blocked", reason: "drawing", message: DRAWING_MESSAGE };
      return markdownResult("excalidraw", excalidraw.map((line) => `- ${line}`).join("\n"));
    }

    const hasImageFiles = input.fileTypes.some((type) => type.toLowerCase().startsWith("image/"));
    const plainHasText = Boolean(text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim());
    if (html.trim()) {
      const converted = convertHtml(html, text, parseHtml);
      if (hasImageFiles && !plainHasText && !converted?.hasText) {
        return { kind: "blocked", reason: "image", message: IMAGE_MESSAGE };
      }
      // The HTML adds nothing over the text (copied from a plain-text page, say): clean the text instead.
      if (converted) return markdownResult("html", converted.markdown);
      const cleaned = convertPlainText(text, input.selectionText ?? "");
      return cleaned === null ? { kind: "default" } : markdownResult("plain", cleaned);
    }

    if (hasImageFiles && !plainHasText) {
      return { kind: "blocked", reason: "image", message: IMAGE_MESSAGE };
    }

    const plain = convertPlainText(text, input.selectionText ?? "");
    return plain === null ? { kind: "default" } : markdownResult("plain", plain);
  } catch {
    return { kind: "default" };
  }
}

function markdownResult(source: "html" | "plain" | "excalidraw", text: string): PasteResult {
  if (utf8ByteLength(text) > MAX_OUTPUT_BYTES) return { kind: "default" };
  return { kind: "markdown", text, source };
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
