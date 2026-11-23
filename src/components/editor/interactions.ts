import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

/** The http(s) address of the link or bare URL at pos, or null. */
function linkUrl(view: EditorView, pos: number): string | null {
  const { doc } = view.state;
  let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(Math.min(pos + 1, doc.length), 1);
  while (node && node.name !== "Link" && node.name !== "URL") node = node.parent;
  if (!node) return null;
  const url = node.name === "URL" ? node : node.getChild("URL");
  if (!url) return null;
  const raw = doc.sliceString(url.from, url.to).trim();
  const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
  return /^https?:\/\//i.test(href) ? href : null;
}

/**
 * Pointer behaviour: the Copy button of a code block shows while the pointer is anywhere in that block, and
 * Cmd/Ctrl+click opens a link in a new tab.
 */
export const editorInteractions = EditorView.domEventHandlers({
  mouseover(event, view) {
    const target = event.target;
    const line = target instanceof Element ? target.closest(".cm-line.md-code") : null;
    let head: Element | null = null;
    for (let el: Element | null = line; el; el = el.previousElementSibling) {
      if (el.classList.contains("md-code-first")) {
        head = el;
        break;
      }
    }
    for (const el of view.contentDOM.querySelectorAll(".md-code-first.is-hover")) {
      if (el !== head) el.classList.remove("is-hover");
    }
    head?.classList.add("is-hover");
    return false;
  },

  mouseout(event, view) {
    const related = event.relatedTarget;
    if (related instanceof Node && view.dom.contains(related)) return false;
    for (const el of view.contentDOM.querySelectorAll(".md-code-first.is-hover")) {
      el.classList.remove("is-hover");
    }
    return false;
  },

  click(event, view) {
    if (!(event.metaKey || event.ctrlKey) || event.button !== 0) return false;
    const target = event.target;
    const el = target instanceof Element ? target.closest(".md-link, .md-url") : null;
    if (!el) return false;
    const url = linkUrl(view, view.posAtDOM(el));
    if (!url) return false;
    event.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  },
});
