"use client";

import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { URDU_MODE_EVENT } from "@/components/editor/urdu";
import { urduForChar, urduForKey } from "@/lib/urdu/keymap";

const STORAGE_KEY = "likho:urdu-keyboard";
const LETTER_CODE = /^Key[A-Z]$/;

// The on/off choice lives in localStorage; useSyncExternalStore keeps the server render ("off") and the first client
// render identical, then switches to the saved value.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}
export function setUrduOn(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Types `text` at the caret of the focused editor or text field. Returns false when the target can't take it. */
export function insertText(target: EventTarget | null, text: string): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const cm = target.closest(".cm-editor");
  if (cm instanceof HTMLElement && target.closest(".cm-content")) {
    const view = EditorView.findFromDOM(cm);
    if (!view || view.state.readOnly) return false;
    view.dispatch({ ...view.state.replaceSelection(text), scrollIntoView: true, userEvent: "input.type" });
    return true;
  }

  const isTextInput =
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && ["text", "search", ""].includes(target.type));
  if (isTextInput && !target.readOnly && !target.disabled) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText(text, start, end, "end");
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  return false;
}

/** The saved Urdu on/off choice, shared by the key handler and the toggle in the notebook. */
export function useUrduOn(): boolean {
  return useSyncExternalStore(subscribe, readOn, () => false);
}

/**
 * Switches typing to the Urdu keyboard layout. While it is on, keys type Urdu wherever you write (note body, title,
 * search), whatever language the system keyboard is set to. Ctrl+Shift+U toggles it.
 *
 * This component draws nothing: it only handles the keys and the saved on/off choice. The visible English | اردو
 * toggle and the layout viewer live inside the notebook (UrduToggle, mounted by WritingPad).
 */
export function UrduKeyboard() {
  const on = useUrduOn();
  const onRef = useRef(false);

  useEffect(() => {
    onRef.current = on;
    document.documentElement.dataset.urdu = on ? "on" : "off";
    window.dispatchEvent(new Event(URDU_MODE_EVENT));
  }, [on]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && !event.altKey && event.code === "KeyU") {
        event.preventDefault();
        setUrduOn(!readOn());
        return;
      }
      if (!onRef.current || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      // Caps Lock acts like Shift on letter keys, as it does on a real Urdu keyboard.
      const shift = LETTER_CODE.test(event.code)
        ? event.shiftKey !== event.getModifierState("CapsLock")
        : event.shiftKey;
      const text = urduForKey(event.code, shift);
      if (text === undefined || !insertText(event.target, text)) return;
      event.preventDefault();
      event.stopPropagation();
    }

    // Phone keyboards report the typed character rather than a key position.
    function onBeforeInput(event: InputEvent) {
      if (!onRef.current || event.isComposing || event.inputType !== "insertText" || event.data?.length !== 1) return;
      const text = urduForChar(event.data);
      if (text === undefined || !insertText(event.target, text)) return;
      event.preventDefault();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("beforeinput", onBeforeInput, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("beforeinput", onBeforeInput, true);
    };
  }, []);

  return null;
}
