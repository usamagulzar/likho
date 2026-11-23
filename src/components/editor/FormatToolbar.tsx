"use client";

import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { FORMAT_SHORTCUTS, type FormatId, type FormatState } from "./formatTypes";

interface Tool {
  id: FormatId;
  label: string;
  icon: LucideIcon;
}

/** Groups are separated by a thin rule. Order follows how often each is reached for while writing. */
const GROUPS: readonly (readonly Tool[])[] = [
  [
    { id: "undo", label: "Undo", icon: Undo2 },
    { id: "redo", label: "Redo", icon: Redo2 },
  ],
  [
    { id: "h1", label: "Heading 1", icon: Heading1 },
    { id: "h2", label: "Heading 2", icon: Heading2 },
    { id: "h3", label: "Heading 3", icon: Heading3 },
  ],
  [
    { id: "bold", label: "Bold", icon: Bold },
    { id: "italic", label: "Italic", icon: Italic },
    { id: "strike", label: "Strikethrough", icon: Strikethrough },
    { id: "code", label: "Inline code", icon: Code },
  ],
  [{ id: "link", label: "Link", icon: LinkIcon }],
  [
    { id: "bullet", label: "Bulleted list", icon: List },
    { id: "number", label: "Numbered list", icon: ListOrdered },
    { id: "task", label: "Task list", icon: ListChecks },
    { id: "quote", label: "Quote", icon: Quote },
  ],
  [
    { id: "codeblock", label: "Code block", icon: SquareCode },
    { id: "hr", label: "Horizontal rule", icon: Minus },
  ],
  [{ id: "clear", label: "Clear formatting", icon: RemoveFormatting }],
];

/** Buttons that show an on/off state. The rest just do something when pressed. */
const TOGGLES: ReadonlySet<FormatId> = new Set([
  "h1",
  "h2",
  "h3",
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "bullet",
  "number",
  "task",
  "quote",
  "codeblock",
]);

const FLAT: readonly Tool[] = GROUPS.flat();

/** "Mod+Shift+X" as it reads on this machine: "Ctrl+Shift+X", or "⇧⌘X" on a Mac. */
function shortcutText(shortcut: string, mac: boolean): string {
  const parts = shortcut.split("+");
  if (!mac) return parts.map((part) => (part === "Mod" ? "Ctrl" : part)).join("+");
  const symbols: Record<string, string> = { Mod: "⌘", Shift: "⇧", Alt: "⌥" };
  const order = ["Alt", "Shift", "Mod"];
  const key = parts[parts.length - 1];
  const modifiers = order.filter((name) => parts.includes(name)).map((name) => symbols[name]);
  return modifiers.join("") + key;
}

interface FormatToolbarProps {
  /** What the caret is inside right now. Comes from the editor. */
  state: FormatState;
  /** The note is loading or read-only. The buttons stay visible but do nothing. */
  disabled?: boolean;
  onCommand: (id: FormatId) => void;
  className?: string;
}

/**
 * The Markdown formatting panel: one row of buttons above the notebook sheet. It never takes focus from the note.
 * Pressing a button runs the same command as its keyboard shortcut and the caret stays where it was, so you can
 * keep typing. Buttons light up for whatever the caret is inside (bold, a heading, a list ...). It scrolls sideways
 * on narrow screens.
 *
 * Keyboard: the row is one Tab stop. Arrow keys, Home and End move along it, Enter or Space presses.
 */
export function FormatToolbar({ state, disabled = false, onCommand, className }: FormatToolbarProps) {
  const [mac, setMac] = useState(false);
  const [stop, setStop] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Platform is only known in the browser, so the hints switch after hydration rather than mismatching it.
  useEffect(() => {
    setMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  function moveFocus(to: number) {
    const next = (to + FLAT.length) % FLAT.length;
    setStop(next);
    buttons.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = buttons.current.findIndex((button) => button === document.activeElement);
    if (current < 0) return;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(current + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(current - 1);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(FLAT.length - 1);
        break;
    }
  }

  function unavailable(id: FormatId): boolean {
    if (disabled) return true;
    if (id === "undo") return !state.canUndo;
    if (id === "redo") return !state.canRedo;
    return false;
  }

  let index = -1;
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      // Keep the caret and selection in the note when a button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      // A click here is not a click on the empty page, so the pad must not move the caret to the end of the note.
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "format-toolbar shrink-0 overflow-x-auto border-b border-border bg-pad px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div className="mx-auto flex w-max items-center gap-0.5">
        {GROUPS.map((group, groupIndex) => (
          <Fragment key={group[0].id}>
            {groupIndex > 0 ? (
              <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
            ) : null}
            {group.map((tool) => {
              index += 1;
              const position = index;
              const active = state.active.includes(tool.id);
              const off = unavailable(tool.id);
              const shortcut = FORMAT_SHORTCUTS[tool.id];
              const title = shortcut ? `${tool.label} (${shortcutText(shortcut, mac)})` : tool.label;
              const Glyph = tool.icon;
              return (
                <button
                  key={tool.id}
                  ref={(node) => {
                    buttons.current[position] = node;
                  }}
                  type="button"
                  title={title}
                  aria-label={tool.label}
                  aria-pressed={TOGGLES.has(tool.id) ? active : undefined}
                  aria-disabled={off || undefined}
                  tabIndex={position === stop ? 0 : -1}
                  onFocus={() => setStop(position)}
                  onClick={() => {
                    if (!off) onCommand(tool.id);
                  }}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring sm:size-8",
                    off
                      ? "cursor-default text-muted-foreground opacity-45"
                      : active
                        ? "bg-brand/15 text-foreground"
                        : "text-secondary-foreground hover:bg-hover hover:text-foreground",
                  )}
                >
                  <Glyph size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
