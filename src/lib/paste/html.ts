import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { convertPlainText } from "./plain";
import type { HtmlParser } from "./types";

export interface HtmlConversion {
  markdown: string;
  hasText: boolean;
}

const DROP_TAGS = new Set([
  "script", "style", "meta", "link", "iframe", "object", "form", "select", "textarea",
  "button", "option", "optgroup", "fieldset", "legend", "input", "noscript",
]);

export function parseHtmlInBrowser(html: string): Document {
  if (typeof DOMParser === "undefined") throw new Error("DOMParser is unavailable");
  return new DOMParser().parseFromString(html, "text/html");
}

export function convertHtml(html: string, plainText: string, parseHtml: HtmlParser): HtmlConversion | null {
  if (!html.trim()) return null;

  const document = parseHtml(html);
  const body = document.body;
  const isMonospaceEditor = hasMonospaceEditorWrapper(body);
  // Word marks its lists with mso-list styles, which sanitizeStyle drops, so read them first.
  markWordListParagraphs(body);
  // Text a page shows with its line breaks kept (white-space: pre-wrap) is cleaned as plain text, not as HTML.
  const preformatted = extractPreformattedText(body, document);
  sanitizeChildren(body, document);
  removePageChrome(body);
  convertWordLists(body, document);
  nestStrayLists(body);
  flattenBlocksIn(body, document, "li");
  flattenBlocksIn(body, document, "td, th");
  makeFirstTableRowsHeaders(body, document);

  const hasText = hasUsableText(body);
  // Only text in plain divs and spans (a page showing a text file, a notes app): the clipboard text is the better
  // source, because HTML collapses its line breaks.
  if (!isMonospaceEditor && !hasMarkdownStructure(body)) return null;
  if (isMonospaceEditor && plainText.includes("\n")) {
    const code = plainText.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
    return { markdown: `\`\`\`\n${code}\n\`\`\``, hasText };
  }

  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });
  service.use(gfm);
  const originalEscape = service.escape.bind(service);
  service.escape = (value: string) => originalEscape(value).replace(/\\_/g, "_");
  service.addRule("doubleStrikethrough", {
    filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
    replacement: (content) => `~~${content}~~`,
  });
  service.addRule("escapeTablePipes", {
    filter: ["th", "td"],
    replacement: (content, node) => {
      const index = Array.prototype.indexOf.call(node.parentNode?.childNodes ?? [], node);
      const prefix = index === 0 ? "| " : " ";
      const escaped = content.replace(/(?<!\\)\|/g, "\\|");
      return `${prefix}${escaped} |`;
    },
  });
  service.addRule("compactListItem", {
    filter: "li",
    replacement: (content, node, options) => {
      const parent = node.parentNode as HTMLElement | null;
      let prefix = `${options.bulletListMarker} `;
      if (parent?.nodeName === "OL") {
        const start = parent.getAttribute("start");
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${start ? Number(start) + index : index + 1}. `;
      }
      const hasTrailingNewline = /\n$/.test(content);
      const trimmedContent = content.replace(/^\n+|\n+$/g, "") + (hasTrailingNewline ? "\n" : "");
      const indentedContent = trimmedContent.replace(/\n/g, `\n${" ".repeat(prefix.length)}`);
      return prefix + indentedContent + (node.nextSibling ? "\n" : "");
    },
  });
  service.addRule("pasteTaskMarker", {
    filter: (node) => node.nodeName === "SPAN" && node.hasAttribute("data-paste-task"),
    replacement: (_content, node) => `[${node.getAttribute("data-paste-task")}] `,
  });
  service.addRule("styledSpan", {
    filter: (node) => node.nodeName === "SPAN" && spanMarkdownMarkers(node).prefix.length > 0,
    replacement: (content, node) => {
      const markers = spanMarkdownMarkers(node);
      return `${markers.prefix}${content}${markers.suffix}`;
    },
  });

  let markdown = normalizeMarkdown(service.turndown(body));
  preformatted.forEach((text, index) => {
    const cleaned = convertPlainText(text, "") ?? text.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "");
    markdown = markdown.replace(`PASTEPLAIN${index}END`, () => cleaned.trim());
  });
  if (!markdown) return null;

  if (plainText.trim() && comparableText(markdown) === comparableText(plainText)) return null;
  return { markdown, hasText };
}

function sanitizeChildren(parent: Node, document: Document): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 8) {
      parent.removeChild(child);
      continue;
    }
    if (child.nodeType === 3) {
      child.nodeValue = (child.nodeValue ?? "").replace(/\u00a0/g, " ");
      continue;
    }
    if (child.nodeType !== 1) continue;

    const element = child as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "input" && element.getAttribute("type")?.toLowerCase() === "checkbox" && element.parentElement?.tagName.toLowerCase() === "li") {
      const checked = element.hasAttribute("checked") || (element as HTMLInputElement).checked;
      const marker = document.createElement("span");
      marker.setAttribute("data-paste-task", checked ? "x" : " ");
      marker.textContent = checked ? "[x]" : "[ ]";
      element.parentNode?.insertBefore(marker, element);
      element.parentNode?.removeChild(element);
      continue;
    }
    if (DROP_TAGS.has(tag)) {
      parent.removeChild(child);
      continue;
    }
    if (tag === "o:p" || (tag === "b" && (element.getAttribute("id") ?? "").startsWith("docs-internal-guid-"))) {
      sanitizeChildren(element, document);
      unwrap(element);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
    }
    sanitizeStyle(element);

    if (tag === "a") {
      const href = element.getAttribute("href") ?? "";
      if (isUnsafeUrl(href)) element.removeAttribute("href");
    } else if (tag === "img") {
      const src = element.getAttribute("src") ?? "";
      if (!/^https:\/\//i.test(src.trim())) {
        parent.removeChild(child);
        continue;
      }
    }

    sanitizeChildren(element, document);
  }
}

function unwrap(element: Element): void {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
}

function sanitizeStyle(element: HTMLElement): void {
  const style = element.getAttribute("style");
  if (!style) return;
  const allowed = new Map<string, string>();
  for (const declaration of style.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    const lowerValue = value.toLowerCase();
    if (property === "font-weight" && /^(?:bold|bolder|[6-9]00)$/.test(lowerValue)) {
      allowed.set(property, lowerValue);
    } else if (property === "font-style" && /^(?:italic|oblique)$/.test(lowerValue)) {
      allowed.set(property, lowerValue);
    } else if (property === "text-decoration" && /\b(?:line-through|underline)\b/.test(lowerValue)) {
      allowed.set(property, lowerValue);
    } else if (property === "font-family" && value.length <= 160 && !/[<>;]/.test(value)) {
      allowed.set(property, value);
    }
  }
  if (allowed.size) {
    element.setAttribute("style", Array.from(allowed, ([property, value]) => `${property}: ${value}`).join("; "));
  } else {
    element.removeAttribute("style");
  }
}

function hasUsableText(body: HTMLElement): boolean {
  const copy = body.cloneNode(true) as HTMLElement;
  for (const marker of Array.from(copy.querySelectorAll("[data-paste-task]"))) {
    marker.parentNode?.removeChild(marker);
  }
  return Boolean(copy.textContent?.replace(/\u00a0/g, " ").trim());
}

function isUnsafeUrl(value: string): boolean {
  const normalized = value.trim().replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  return /^(?:javascript|vbscript|data):/.test(normalized);
}

const STRUCTURE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,ul,ol,li,table,pre,blockquote,a[href],img,b,strong,i,em,u,s,del,strike,code,hr,sup,sub,p,br";

function hasMarkdownStructure(body: HTMLElement): boolean {
  if (body.querySelector(STRUCTURE_SELECTOR)) return true;
  return Array.from(body.querySelectorAll("span, div")).some((node) => spanMarkdownMarkers(node as HTMLElement).prefix.length > 0);
}

function hasMonospaceEditorWrapper(body: HTMLElement): boolean {
  if (body.querySelector(".vscode-editor-data")) return true;
  if (hasMonospaceFont(body.getAttribute("style") ?? "")) return true;
  return Array.from(body.children).some((child) => hasMonospaceFont(child.getAttribute("style") ?? ""));
}

function hasMonospaceFont(style: string): boolean {
  const family = /(?:^|;)\s*font-family\s*:\s*([^;]+)/i.exec(style)?.[1] ?? "";
  return /(?:^|[\s,'"])(?:monospace|consolas|menlo|droid sans mono|courier(?: new)?)(?:$|[\s,'"])/i.test(family);
}

function spanMarkdownMarkers(node: HTMLElement): { prefix: string; suffix: string } {
  const style = node.getAttribute("style") ?? "";
  const bold = /(?:^|;)\s*font-weight\s*:\s*(?:bold|bolder|[6-9]00)(?:\s*!important)?\s*(?:;|$)/i.test(style);
  const italic = /(?:^|;)\s*font-style\s*:\s*(?:italic|oblique)(?:\s*!important)?\s*(?:;|$)/i.test(style);
  const strike = /(?:^|;)\s*text-decoration\s*:[^;]*\bline-through\b/i.test(style);
  const marks = `${strike ? "~~" : ""}${bold ? "**" : ""}${italic ? "*" : ""}`;
  return { prefix: marks, suffix: [...marks.matchAll(/~~|\*\*|\*/g)].map((match) => match[0]).reverse().join("") };
}

function makeFirstTableRowsHeaders(body: HTMLElement, document: Document): void {
  for (const table of Array.from(body.querySelectorAll("table"))) {
    const firstRow = Array.from(table.querySelectorAll("tr")).find((row) => row.closest("table") === table);
    if (!firstRow) continue;
    for (const cell of Array.from(firstRow.children)) {
      if (cell.tagName.toLowerCase() !== "td") continue;
      const header = document.createElement("th");
      for (const attribute of Array.from(cell.attributes)) header.setAttribute(attribute.name, attribute.value);
      while (cell.firstChild) header.appendChild(cell.firstChild);
      cell.parentNode?.replaceChild(header, cell);
    }
  }
}

const BULLET_GLYPHS = "•·▪◦●○►‣⁃";
const CHROME_WORDS = new Set([
  "cookie", "cookies", "consent", "gdpr", "advert", "adverts", "advertisement", "ad", "ads", "sponsor", "sponsored",
  "share", "sharing", "subscribe", "newsletter", "popup",
]);

function isBlankElement(node: Node): boolean {
  return node.nodeType === 3
    ? !(node.nodeValue ?? "").replace(/[\s\u00a0]/g, "")
    : node.nodeType === 1 && (node as Element).tagName === "P" && !(node.textContent ?? "").replace(/[\s\u00a0]/g, "");
}

/** Tags Word list paragraphs (mso-list) with their level and kind, and drops the typed "·" / "1." marker. */
function markWordListParagraphs(body: HTMLElement): void {
  for (const paragraph of Array.from(body.querySelectorAll("p"))) {
    const style = paragraph.getAttribute("style") ?? "";
    const isList = (/mso-list\s*:\s*(?!none)/i.test(style)) || /\bMsoListParagraph/i.test(paragraph.getAttribute("class") ?? "");
    if (!isList) continue;
    const level = Number(/level(\d+)/i.exec(style)?.[1] ?? "1") || 1;
    const marker = Array.from(paragraph.childNodes).find((node) => node.nodeType === 1 && (node.textContent ?? "").trim() !== "");
    const markerText = (marker?.textContent ?? "").replace(/[\s\u00a0]+/g, " ").trim();
    let ordered = false;
    if (marker && markerText.length <= 6 && !(marker as Element).querySelector("b, i, a, strong, em")) {
      ordered = /^(?:\d+|[a-zA-Z])[.)]$/.test(markerText);
      marker.parentNode?.removeChild(marker);
    }
    paragraph.setAttribute("data-mso-level", String(level));
    if (ordered) paragraph.setAttribute("data-mso-ordered", "1");
  }
}

/** Swaps each pre-wrap element for a placeholder paragraph and returns its text, in order. */
function extractPreformattedText(body: HTMLElement, document: Document): string[] {
  const texts: string[] = [];
  for (const element of Array.from(body.querySelectorAll("[style]"))) {
    if (!element.parentNode || element.tagName === "PRE" || element.closest("pre")) continue;
    if (!/white-space\s*:\s*(?:pre|pre-wrap|pre-line|break-spaces)\b/i.test(element.getAttribute("style") ?? "")) continue;
    if (element.closest("table, li")) continue;
    const copy = element.cloneNode(true) as HTMLElement;
    for (const br of Array.from(copy.querySelectorAll("br"))) br.replaceWith(document.createTextNode("\n"));
    const text = copy.textContent ?? "";
    if (!text.includes("\n")) continue;
    const placeholder = document.createElement("p");
    placeholder.textContent = `PASTEPLAIN${texts.length}END`;
    element.parentNode.replaceChild(placeholder, element);
    texts.push(text);
  }
  return texts;
}

function nextMeaningfulSibling(node: Node): Node | null {
  let next = node.nextSibling;
  while (next && isBlankElement(next)) next = next.nextSibling;
  return next;
}

/** Turns runs of tagged Word paragraphs into real nested <ul>/<ol> lists. */
function convertWordLists(body: HTMLElement, document: Document): void {
  const paragraphs = Array.from(body.querySelectorAll("p[data-mso-level]"));
  let index = 0;
  while (index < paragraphs.length) {
    const group = [paragraphs[index]];
    while (index + 1 < paragraphs.length && nextMeaningfulSibling(group[group.length - 1]) === paragraphs[index + 1]) {
      group.push(paragraphs[index + 1]);
      index += 1;
    }
    index += 1;

    const first = group[0];
    const root = document.createElement(first.hasAttribute("data-mso-ordered") ? "ol" : "ul");
    first.parentNode?.insertBefore(root, first);
    const stack: Array<{ level: number; list: Element; last: Element | null }> = [{ level: 1, list: root, last: null }];

    for (const paragraph of group) {
      const level = Math.max(1, Number(paragraph.getAttribute("data-mso-level")) || 1);
      while (stack.length > 1 && stack[stack.length - 1].level > level) stack.pop();
      let top = stack[stack.length - 1];
      if (top.level < level) {
        const host = top.last ?? top.list.appendChild(document.createElement("li"));
        const list = document.createElement(paragraph.hasAttribute("data-mso-ordered") ? "ol" : "ul");
        host.appendChild(list);
        top = { level, list, last: null };
        stack.push(top);
      }
      const item = document.createElement("li");
      while (paragraph.firstChild) item.appendChild(paragraph.firstChild);
      top.list.appendChild(item);
      top.last = item;
      paragraph.parentNode?.removeChild(paragraph);
    }
  }
}

/** Google Docs puts a nested <ul> straight inside its parent <ul>. Move it into the previous <li>. */
function nestStrayLists(body: HTMLElement): void {
  for (const list of Array.from(body.querySelectorAll("ul > ul, ul > ol, ol > ul, ol > ol"))) {
    const previous = list.previousElementSibling;
    if (previous && previous.tagName === "LI") previous.appendChild(list);
  }
}

/** Removes navigation, ads, cookie banners and share bars that ride along when a whole page is copied. */
function removePageChrome(body: HTMLElement): void {
  for (const element of Array.from(body.querySelectorAll("nav, aside, [class], [id]"))) {
    if (!element.parentNode || element === body) continue;
    if (element.tagName === "NAV" || element.tagName === "ASIDE") {
      element.parentNode.removeChild(element);
      continue;
    }
    const words = `${element.getAttribute("class") ?? ""} ${element.getAttribute("id") ?? ""}`.toLowerCase().split(/[^a-z0-9]+/);
    if (words.some((word) => CHROME_WORDS.has(word))) element.parentNode.removeChild(element);
  }
}

/** Inside list items and table cells, paragraphs become inline text so the Markdown stays tight. */
function flattenBlocksIn(body: HTMLElement, document: Document, selector: string): void {
  for (const container of Array.from(body.querySelectorAll(selector))) {
    const blocks = Array.from(container.children).filter((child) => child.tagName === "P" || child.tagName === "DIV");
    blocks.forEach((block, position) => {
      if (position > 0) block.parentNode?.insertBefore(document.createTextNode(" "), block);
      unwrap(block);
    });
  }
}

function normalizeMarkdown(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+$/g, "")
        .replace(/^(\s*- \[[ x]\])\s{2,}/, "$1 ")
        // Pasted paragraphs that start with "1." or a bullet glyph are list items that lost their list.
        .replace(/^(\s*)(\d{1,3})\\\.(\s)/, "$1$2.$3")
        .replace(new RegExp(`^(\\s*)[${BULLET_GLYPHS}]\\s+`), "$1- "),
    )
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function comparableText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
