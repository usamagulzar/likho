export type PasteResult =
  | { kind: "default" }
  | { kind: "markdown"; text: string; source: "html" | "plain" | "excalidraw" }
  | { kind: "blocked"; reason: "image" | "drawing"; message: string };

export interface ClipboardInput {
  html: string;
  text: string;
  fileTypes: string[];
  selectionText: string;
}

export type HtmlParser = (html: string) => Document;
