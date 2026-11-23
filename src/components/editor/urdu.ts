import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";

export const URDU_MODE_EVENT = "likho:urdu-mode";

const RTL_LETTER = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_LETTER = /[A-Za-z\u00C0-\u024F]/;

/** Direction of the first letter in the line, like the Unicode "first strong character" rule. */
function firstStrong(text: string): "rtl" | "ltr" | null {
  for (const char of text) {
    if (RTL_LETTER.test(char)) return "rtl";
    if (LTR_LETTER.test(char)) return "ltr";
  }
  return null;
}

const urduLtr = Decoration.line({ class: "cm-urdu-line" });
const urduRtl = Decoration.line({ class: "cm-urdu-line", attributes: { dir: "rtl" } });
const emptyRtl = Decoration.line({ attributes: { dir: "rtl" } });

function build(view: EditorView): DecorationSet {
  const keyboardOn = document.documentElement.dataset.urdu === "on";
  const builder = new RangeSetBuilder<Decoration>();
  let last = -1;
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (line.from > last) {
        last = line.from;
        const direction = firstStrong(line.text);
        if (ARABIC_SCRIPT.test(line.text)) {
          builder.add(line.from, line.from, direction === "ltr" ? urduLtr : urduRtl);
        } else if (keyboardOn && direction === null) {
          // Blank or number-only lines start at the right while the Urdu keyboard is on, so the caret is where Urdu starts.
          builder.add(line.from, line.from, emptyRtl);
        }
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

/**
 * Urdu support in the note body. A line that starts with Urdu is right-to-left and right-aligned; a line that starts
 * with English stays left-to-right. Lines with Urdu get two ruled rows of height, because Nastaliq letters are tall.
 */
export const urduSupport: Extension = [
  EditorView.perLineTextDirection.of(true),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private readonly refresh: () => void;
      constructor(private readonly view: EditorView) {
        this.decorations = build(view);
        // Switching the Urdu keyboard on or off changes how empty lines are aligned.
        this.refresh = () => {
          this.decorations = build(this.view);
          this.view.requestMeasure();
          this.view.dispatch({});
        };
        window.addEventListener(URDU_MODE_EVENT, this.refresh);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) this.decorations = build(update.view);
      }
      destroy() {
        window.removeEventListener(URDU_MODE_EVENT, this.refresh);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  ),
];
