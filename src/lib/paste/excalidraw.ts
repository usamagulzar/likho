interface TextItem {
  text: string;
  x: number;
  y: number;
  lineHeight: number;
  order: number;
}

interface TextLine {
  y: number;
  maxLineHeight: number;
  items: TextItem[];
}

const EXCALIDRAW_TYPES = new Set([
  "excalidraw/clipboard",
  "excalidraw",
  "excalidrawlib",
  "excalidraw/library",
  "excalidraw/scene",
]);

export function readExcalidrawText(clipboardText: string): string[] | null {
  if (!clipboardText.trim()) return null;

  let root: unknown;
  try {
    root = JSON.parse(clipboardText.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }

  if (!isRecord(root) || typeof root.type !== "string" || !EXCALIDRAW_TYPES.has(root.type)) {
    return null;
  }

  const items: TextItem[] = [];
  let order = 0;
  const readElements = (elements: unknown) => {
    if (!Array.isArray(elements)) return;
    for (const value of elements) {
      if (!isRecord(value)) continue;
      const type = value.type;
      if (type === "text") {
        const text = stringValue(value.text) ?? stringValue(value.originalText);
        if (text !== null && text.trim()) {
          items.push(makeTextItem(text, value, order++));
        }
        continue;
      }

      const label = value.label;
      if (typeof label === "string" && label.trim()) {
        items.push(makeTextItem(label, value, order++));
      } else if (isRecord(label)) {
        const text = stringValue(label.text) ?? stringValue(label.originalText);
        if (text !== null && text.trim()) {
          items.push(makeTextItem(text, {
            ...value,
            x: numberValue(label.x) ?? numberValue(value.x),
            y: numberValue(label.y) ?? numberValue(value.y),
            height: numberValue(label.height) ?? numberValue(value.height),
            fontSize: numberValue(label.fontSize) ?? numberValue(value.fontSize),
            lineHeight: numberValue(label.lineHeight) ?? numberValue(value.lineHeight),
          }, order++));
        }
      }
    }
  };

  const visitContainer = (value: unknown) => {
    if (!isRecord(value)) return;
    readElements(value.elements);
    if (Array.isArray(value.libraryItems)) {
      for (const item of value.libraryItems) visitContainer(item);
    }
    if (isRecord(value.scene)) visitContainer(value.scene);
    if (isRecord(value.library)) visitContainer(value.library);
  };

  visitContainer(root);
  return sortReadingOrder(items).map((item) => item.text.replace(/\r\n?/g, "\n").replace(/\n/g, "\n  "));
}

function makeTextItem(text: string, source: Record<string, unknown>, order: number): TextItem {
  const fontSize = numberValue(source.fontSize);
  const lineCount = Math.max(1, text.split(/\r\n?|\n/).length);
  const height = numberValue(source.height);
  const explicitLineHeight = numberValue(source.lineHeight);
  const lineHeight = explicitLineHeight && explicitLineHeight > 2
    ? explicitLineHeight
    : fontSize && fontSize > 0
      ? fontSize * (explicitLineHeight && explicitLineHeight > 0 ? explicitLineHeight : 1.25)
      : height && height > 0
        ? height / lineCount
        : 16;

  return {
    text,
    x: numberValue(source.x) ?? order,
    y: numberValue(source.y) ?? 0,
    lineHeight,
    order,
  };
}

function sortReadingOrder(items: TextItem[]): TextItem[] {
  const sorted = [...items].sort((left, right) => left.y - right.y || left.x - right.x || left.order - right.order);
  const lines: TextLine[] = [];

  for (const item of sorted) {
    const previous = lines.at(-1);
    const tolerance = previous ? Math.max(previous.maxLineHeight, item.lineHeight) / 2 : 0;
    if (previous && Math.abs(item.y - previous.y) <= tolerance) {
      previous.items.push(item);
      previous.maxLineHeight = Math.max(previous.maxLineHeight, item.lineHeight);
      previous.y = previous.items.reduce((sum, entry) => sum + entry.y, 0) / previous.items.length;
    } else {
      lines.push({ y: item.y, maxLineHeight: item.lineHeight, items: [item] });
    }
  }

  return lines.flatMap((line) => line.items.sort((left, right) => left.x - right.x || left.order - right.order));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
