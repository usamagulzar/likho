import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { toast } from "sonner";
import { convertClipboard, type ClipboardInput } from "@/lib/paste";
import { fencedBlockAt } from "./syntax";

function isImageType(type: string): boolean {
  return /^image\//i.test(type);
}

/** Converts clipboard content before it enters the note body. */
export function smartPaste(): Extension {
  let verbatimPaste = false;
  let resetVerbatimTimer: ReturnType<typeof setTimeout> | undefined;

  const resetVerbatim = () => {
    verbatimPaste = false;
    if (resetVerbatimTimer !== undefined) clearTimeout(resetVerbatimTimer);
    resetVerbatimTimer = undefined;
  };

  return EditorView.domEventHandlers({
    keydown(event) {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.key.toLowerCase() !== "v") return false;
      verbatimPaste = true;
      if (resetVerbatimTimer !== undefined) clearTimeout(resetVerbatimTimer);
      resetVerbatimTimer = setTimeout(resetVerbatim, 0);
      return false;
    },

    paste(event, view) {
      if (view.state.facet(EditorState.readOnly)) return false;
      if (verbatimPaste) {
        resetVerbatim();
        return false;
      }

      const clipboard = event.clipboardData;
      if (!clipboard) return false;

      let input: ClipboardInput;
      try {
        const types = Array.from(clipboard.types);
        const fileTypes = [
          ...types.filter(isImageType),
          ...Array.from(clipboard.files, (file) => file.type).filter(isImageType),
        ];
        const selection = view.state.selection.main;
        input = {
          html: clipboard.getData("text/html"),
          text: clipboard.getData("text/plain"),
          fileTypes,
          selectionText: view.state.sliceDoc(selection.from, selection.to),
        };
      } catch {
        return false;
      }

      let result: ReturnType<typeof convertClipboard>;
      try {
        result = convertClipboard(input);
      } catch {
        return false;
      }

      if (result.kind === "blocked") {
        event.preventDefault();
        toast(result.message);
        return true;
      }

      const { state } = view;
      const selection = state.selection.main;
      if (fencedBlockAt(state, selection.head) || result.kind === "default") return false;

      const text = result.text.replace(/\r\n?/g, "\n");
      const caret = selection.from + text.length;
      event.preventDefault();
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: caret },
        userEvent: "input.paste",
        scrollIntoView: true,
      });
      return true;
    },
  });
}
