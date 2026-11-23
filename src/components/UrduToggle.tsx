"use client";

import { useCallback, useState } from "react";
import { insertText, setUrduOn, useUrduOn } from "@/components/UrduKeyboard";
import { UrduLayoutPanel } from "@/components/UrduLayoutPanel";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: false, label: "English", lang: "en" },
  { value: true, label: "اردو", lang: "ur" },
] as const;

/**
 * The English | اردو toggle and the keyboard-layout button. They sit inside the notebook, in the empty ruled row
 * between the title and the body, so they scroll with the page and never cover its buttons. Fill a positioned
 * parent of one ruled row (28px) with it: it lays itself out at the right edge, and the layout viewer drops down
 * from it.
 */
export function UrduToggle() {
  const on = useUrduOn();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const closeLayout = useCallback(() => setLayoutOpen(false), []);
  const typeAtCaret = useCallback((text: string) => insertText(document.activeElement, text), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-end gap-1.5"
      // Keep the caret in the editor when these are clicked.
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        type="button"
        aria-pressed={layoutOpen}
        aria-controls="urdu-layout-panel"
        onClick={() => setLayoutOpen((open) => !open)}
        title={layoutOpen ? "Hide keyboard layout" : "Show keyboard layout"}
        className={cn(
          "pointer-events-auto grid size-7 shrink-0 place-items-center rounded-full border outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
          layoutOpen
            ? "border-brand bg-brand/15 text-foreground"
            : "border-border bg-canvas text-secondary-foreground hover:bg-hover hover:text-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
          <path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M18 13.5h.01M9 14h6" />
        </svg>
        <span className="sr-only">Keyboard layout</span>
      </button>

      <div
        role="radiogroup"
        aria-label="Typing language (Ctrl+Shift+U)"
        title="Typing language (Ctrl+Shift+U)"
        className="pointer-events-auto relative grid h-7 shrink-0 grid-cols-2 rounded-full border border-border bg-canvas p-0.5 select-none"
      >
        {/* Sliding thumb: sits under the active side. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full transition-[transform,background-color] duration-200 ease-out",
            on ? "translate-x-full bg-brand" : "translate-x-0 bg-pad shadow-xs",
          )}
        />
        {OPTIONS.map((option) => {
          const active = option.value === on;
          return (
            <button
              key={option.lang}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              lang={option.lang}
              onClick={() => setUrduOn(option.value)}
              className={cn(
                "relative z-10 flex min-w-14 items-center justify-center rounded-full px-2.5 text-xs outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                option.lang === "ur" && "urdu-label text-[0.95rem] leading-none",
                active ? (option.value ? "text-white" : "text-foreground") : "text-secondary-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {layoutOpen && <UrduLayoutPanel on={on} onType={typeAtCaret} onClose={closeLayout} />}
    </div>
  );
}
