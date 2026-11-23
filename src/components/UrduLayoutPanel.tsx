"use client";

import { useEffect, useState } from "react";
import { KEY_ROWS, urduForKey } from "@/lib/urdu/keymap";
import { cn } from "@/lib/utils";

const LETTER_CODE = /^Key[A-Z]$/;
const COMBINING = /\p{M}/u;

/** Keys that are drawn for realism only. [label, width in key units]. */
const EDGE_KEYS: Record<number, { left: [string, number]; right: [string, number] }> = {
  0: { left: ["", 0], right: ["Backspace", 2] },
  1: { left: ["Tab", 1.5], right: ["", 0] },
  2: { left: ["Caps", 1.75], right: ["Enter", 2.25] },
  3: { left: ["Shift", 2.25], right: ["Shift", 2.75] },
};
/** Extra width for the last key of the Q row (the backslash key is wider than a letter key). */
const WIDE_LAST_KEY: Record<number, number> = { 1: 1.5 };

/** A combining mark needs a base to sit on, so it is drawn on a dotted circle. */
function showable(char: string): string {
  return COMBINING.test(char) ? `◌${char}` : char;
}

interface Props {
  /** Whether the Urdu keyboard is switched on. */
  on: boolean;
  /** Types text at the caret of the focused editor. Returns false when there is nowhere to type. */
  onType: (text: string) => boolean;
  onClose: () => void;
}

/**
 * A live picture of the Urdu layout, drawn from the same table that does the typing. Pressing keys lights them up,
 * holding Shift (or Caps Lock on letters) flips the characters, and the keys can be clicked or tapped to type.
 */
export function UrduLayoutPanel({ on, onType, onClose }: Props) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const [shiftHeld, setShiftHeld] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  // On-screen Shift (for touch): applies to the next key only.
  const [stickyShift, setStickyShift] = useState(false);

  useEffect(() => {
    function sync(event: KeyboardEvent) {
      setShiftHeld(event.shiftKey);
      setCapsOn(event.getModifierState("CapsLock"));
    }
    function onKeyDown(event: KeyboardEvent) {
      sync(event);
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
      setPressed((previous) => new Set(previous).add(event.code));
    }
    function onKeyUp(event: KeyboardEvent) {
      sync(event);
      setPressed((previous) => {
        const next = new Set(previous);
        next.delete(event.code);
        return next;
      });
    }
    function reset() {
      setPressed(new Set());
      setShiftHeld(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", reset);
    };
  }, [onClose]);

  const shiftActive = shiftHeld || stickyShift;

  function layerFor(code: string): boolean {
    // Caps Lock acts like Shift on letter keys only, as it does when typing.
    return LETTER_CODE.test(code) ? shiftActive !== capsOn : shiftActive;
  }

  function clickKey(code: string, latin: [string, string]) {
    const shift = layerFor(code);
    const urdu = on ? urduForKey(code, shift) : undefined;
    onType(urdu ?? latin[shift ? 1 : 0]);
    setStickyShift(false);
  }

  const plainKey = (label: string, units: number, key: string, active = false, onClick?: () => void) => (
    <button
      key={key}
      type="button"
      tabIndex={-1}
      disabled={!onClick}
      onClick={onClick}
      aria-label={label}
      style={{ flexGrow: units, flexBasis: 0 }}
      className={cn(
        "h-12 min-w-0 rounded-md border text-[11px] text-muted-foreground transition-colors duration-100 disabled:cursor-default",
        active ? "border-brand bg-brand/15 text-foreground" : "border-border bg-sidebar",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      id="urdu-layout-panel"
      aria-label="Urdu keyboard layout"
      // Keep the caret in the editor: clicking a key must not move focus to the panel.
      onMouseDown={(event) => event.preventDefault()}
      className="pointer-events-auto absolute top-full right-0 z-20 mt-1 w-[min(46rem,100%)] rounded-2xl border border-border bg-canvas p-3 shadow-(--elev-menu)"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 text-sm text-secondary-foreground">
          <span className="font-medium text-foreground">Urdu keyboard layout</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {on ? "Press a key or tap one to type." : "Urdu is off: switch to اردو to type with it."}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide keyboard layout"
          className="grid size-7 shrink-0 place-items-center rounded-md text-secondary-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1" dir="ltr">
        {KEY_ROWS.map((row, rowIndex) => {
          const edges = EDGE_KEYS[rowIndex];
          const lastWidth = WIDE_LAST_KEY[rowIndex] ?? 1;
          return (
            <div key={rowIndex} className="flex gap-1">
              {edges.left[1] > 0 &&
                plainKey(
                  edges.left[0],
                  edges.left[1],
                  "left",
                  edges.left[0] === "Shift" ? shiftActive : edges.left[0] === "Caps" ? capsOn : pressed.has("Tab"),
                  edges.left[0] === "Shift" ? () => setStickyShift((value) => !value) : undefined,
                )}
              {row.map((key, keyIndex) => {
                const shift = layerFor(key.code);
                const urdu = urduForKey(key.code, shift);
                const mapped = on && urdu !== undefined;
                const legend = key.latin[shift ? 1 : 0];
                const isLast = keyIndex === row.length - 1;
                return (
                  <button
                    key={key.code}
                    type="button"
                    tabIndex={-1}
                    onClick={() => clickKey(key.code, key.latin)}
                    aria-label={`${legend}${urdu ? `, types ${urdu}` : ""}`}
                    style={{ flexGrow: isLast ? lastWidth : 1, flexBasis: 0 }}
                    className={cn(
                      "relative h-12 min-w-0 rounded-md border outline-none transition-[background-color,border-color,transform] duration-100",
                      pressed.has(key.code)
                        ? "translate-y-px border-brand bg-brand text-white"
                        : "border-border bg-pad text-foreground hover:bg-hover",
                    )}
                  >
                    <span
                      lang="ur"
                      dir="rtl"
                      className={cn(
                        "absolute inset-0 flex items-center justify-center text-[1.15rem] leading-none",
                        !mapped && "text-[0.95rem] opacity-40",
                      )}
                      style={{ fontFamily: mapped ? '"Mehr Row", "Mehr", system-ui, sans-serif' : "var(--font-sans), system-ui, sans-serif" }}
                    >
                      {mapped ? showable(urdu) : legend}
                    </span>
                    {mapped && (
                      <span aria-hidden className="absolute bottom-0.5 left-1 text-[9px] leading-none opacity-60">
                        {legend}
                      </span>
                    )}
                  </button>
                );
              })}
              {edges.right[1] > 0 &&
                plainKey(
                  edges.right[0],
                  edges.right[1],
                  "right",
                  edges.right[0] === "Shift" ? shiftActive : pressed.has(edges.right[0] === "Enter" ? "Enter" : "Backspace"),
                  edges.right[0] === "Shift" ? () => setStickyShift((value) => !value) : undefined,
                )}
            </div>
          );
        })}
        <div className="flex gap-1">
          <div style={{ flexGrow: 4, flexBasis: 0 }} />
          {plainKey("Space", 7, "space", pressed.has("Space"), () => onType(" "))}
          <div style={{ flexGrow: 4, flexBasis: 0 }} />
        </div>
      </div>
    </div>
  );
}
