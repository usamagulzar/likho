import { WidgetType, type EditorView } from "@codemirror/view";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { svgIcon } from "./icons";
import { fenceBody, fencedBlockAt, toggleTaskAt } from "./syntax";

/** A bullet glyph or a list number, drawn in the hanging gutter of a list line. */
export class MarkerWidget extends WidgetType {
  constructor(
    readonly label: string,
    readonly ordered: boolean,
  ) {
    super();
  }

  eq(other: MarkerWidget) {
    return other.label === this.label && other.ordered === this.ordered;
  }

  toDOM() {
    const el = document.createElement("span");
    el.className = this.ordered ? "md-marker md-marker-ol" : "md-marker md-marker-bullet";
    el.textContent = this.label;
    if (!this.ordered) el.setAttribute("aria-hidden", "true");
    el.contentEditable = "false";
    return el;
  }
}

/** A task box. Clicking it flips [ ] and [x] in the document. */
export class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly label: string,
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.label === this.label;
  }

  toDOM(view: EditorView) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "md-check";
    button.setAttribute("role", "checkbox");
    button.setAttribute("aria-checked", String(this.checked));
    button.setAttribute("aria-label", this.label ? `Task: ${this.label}` : "Task");
    button.contentEditable = "false";
    if (this.checked) button.append(svgIcon(Tick02Icon, 12));
    // Keep the editor focused and the caret where it was. The click does the toggling.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      toggleTaskAt(view, view.posAtDOM(button));
      view.focus();
    });
    return button;
  }

  ignoreEvent() {
    return true;
  }
}

/** Language label and Copy button, pinned to the top right of a code block's opening line. */
export class CodeHeadWidget extends WidgetType {
  constructor(readonly lang: string) {
    super();
  }

  eq(other: CodeHeadWidget) {
    return other.lang === this.lang;
  }

  toDOM(view: EditorView) {
    const head = document.createElement("span");
    head.className = "md-code-head";
    head.contentEditable = "false";
    if (this.lang) {
      const label = document.createElement("span");
      label.className = "md-code-lang";
      label.textContent = this.lang;
      head.append(label);
    }

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "md-copy";
    copy.setAttribute("aria-label", "Copy code");
    copy.title = "Copy code";
    copy.append(svgIcon(Copy01Icon, 16));
    copy.addEventListener("mousedown", (event) => event.preventDefault());
    copy.addEventListener("click", (event) => {
      event.preventDefault();
      const block = fencedBlockAt(view.state, view.posAtDOM(head));
      const code = block ? fenceBody(view.state, block) : "";
      void copyText(code).then((ok) => {
        copy.replaceChildren(svgIcon(ok ? Tick02Icon : Copy01Icon, 16));
        copy.setAttribute("aria-label", ok ? "Copied" : "Copy failed");
        window.setTimeout(() => {
          copy.replaceChildren(svgIcon(Copy01Icon, 16));
          copy.setAttribute("aria-label", "Copy code");
        }, 1500);
      });
    });
    head.append(copy);
    return head;
  }

  ignoreEvent() {
    return true;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API can be blocked (permissions, insecure context). Fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
