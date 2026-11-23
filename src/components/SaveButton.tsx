"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { toast } from "sonner";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { iconButtonClass } from "@/components/styles";
import { SaveRequiredPrompt } from "@/components/SaveRequiredPrompt";
import { cn } from "@/lib/utils";
import type { NoteStore } from "@/lib/types";

export type SaveStore = Pick<NoteStore, "mode" | "dirty" | "saveState" | "save" | "activeNote">;

export interface SaveAction {
  /** Saves the active note, or opens the sign-in prompt for a signed-out visitor. The button and Ctrl/Cmd+S both call it. */
  run: () => Promise<void>;
  /** The sign-in prompt. Render it once per SaveAction. SaveButton renders it when it owns the action. */
  prompt: ReactNode;
  /** Attached to the button, so the prompt can hang from it. */
  anchorRef: RefObject<HTMLButtonElement | null>;
  /** Text for the polite live region: "Saving", "Saved" or "Couldn't save". Empty when nothing is announced. */
  announcement: string;
}

const OFFLINE_MESSAGE = "You're offline — your note is kept on this device. Try again when you're back online.";
const ERROR_MESSAGE = "Couldn't save. Your note is still on this device.";

/**
 * The one code path for saving: the Save button and Ctrl/Cmd+S both call run(). It owns the sign-in prompt and the
 * toasts, so neither is duplicated elsewhere.
 */
export function useSaveAction(store: SaveStore): SaveAction {
  const [promptOpen, setPromptOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);

  async function run(): Promise<void> {
    const note = store.activeNote;
    if (!note || note.content.trim() === "") return;
    if (store.saveState === "saving") return;

    // Signed out: save() does no network work and says so. Then the prompt opens, once.
    if (store.mode === "guest") {
      const result = await store.save();
      if (!result.ok && result.reason === "signed-out") setPromptOpen(true);
      return;
    }

    // Signed in and clean: nothing to write. A failed save stays dirty, so it can be retried.
    const retrying = store.saveState === "offline" || store.saveState === "error";
    if (!store.dirty && !retrying) return;

    setAnnouncement("Saving");
    const result = await store.save();
    if (result.ok) {
      setAnnouncement("Saved");
      toast.success("Saved to your account");
      return;
    }
    if (result.reason === "signed-out") {
      setAnnouncement("");
      setPromptOpen(true);
      return;
    }
    setAnnouncement("Couldn't save");
    if (result.reason === "offline") toast.error(OFFLINE_MESSAGE);
    else if (result.reason === "error") toast.error(ERROR_MESSAGE);
  }

  return {
    run,
    prompt: <SaveRequiredPrompt open={promptOpen} onOpenChange={setPromptOpen} anchorRef={anchorRef} />,
    anchorRef,
    announcement,
  };
}

type View = "empty" | "guest" | "dirty" | "saving" | "saved" | "retry";

function viewOf(store: SaveStore): View {
  const note = store.activeNote;
  if (!note || note.content.trim() === "") return "empty";
  if (store.mode === "guest") return "guest";
  if (store.saveState === "saving") return "saving";
  if (store.saveState === "offline" || store.saveState === "error") return "retry";
  if (store.dirty || store.saveState === "unsaved") return "dirty";
  return "saved";
}

const LABEL: Record<View, string> = {
  empty: "Save",
  guest: "Save",
  dirty: "Save",
  saving: "Saving…",
  saved: "Saved",
  retry: "Retry",
};

const TITLE: Partial<Record<View, string>> = {
  empty: "Write something to save it",
  guest: "Save to your account",
  dirty: "Save to your account (Ctrl/⌘+S)",
  retry: "Couldn't save. Try again.",
};

const GLYPH: Record<View, IconSvgElement> = {
  empty: CloudUploadIcon,
  guest: CloudUploadIcon,
  dirty: CloudUploadIcon,
  saving: Loading03Icon,
  saved: CheckmarkCircle02Icon,
  retry: Alert02Icon,
};

const VARIANT: Record<View, string> = {
  empty: "border border-border text-muted-foreground",
  guest: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  dirty: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  saving: "bg-primary text-primary-foreground",
  saved: "text-secondary-foreground",
  retry: "border border-warning/40 bg-warning/10 text-warning hover:bg-warning/15",
};

const COMPACT_TONE: Record<View, string> = {
  empty: "text-muted-foreground",
  guest: "text-secondary-foreground",
  dirty: "text-foreground",
  saving: "text-muted-foreground",
  saved: "text-muted-foreground",
  retry: "text-warning",
};

const COMPACT_DOT: Partial<Record<View, string>> = {
  dirty: "bg-brand",
  retry: "bg-warning",
};

interface SaveButtonProps {
  store: SaveStore;
  /** Icon only, 44px square, for the mobile top bar. */
  compact?: boolean;
  className?: string;
  /** Share another SaveAction (from useSaveAction) so the pad's shortcut and this button use one prompt. */
  action?: SaveAction;
}

/** The Save control. Full variant is a 36px pill with icon and label. Compact is a 44px icon button. */
export function SaveButton({ store, compact = false, className, action }: SaveButtonProps) {
  const own = useSaveAction(store);
  const shared = action;
  const view = viewOf(store);
  const label = LABEL[view];
  const glyph = GLYPH[view];
  const disabled = view === "empty" || view === "saving" || view === "saved";

  const onClick = () => void (shared ? shared.run() : own.run());
  const anchor = shared ? shared.anchorRef : own.anchorRef;
  const announcer = (
    <span aria-live="polite" className="sr-only">
      {shared ? shared.announcement : own.announcement}
    </span>
  );

  if (compact) {
    // Matches the other 44px bar icons: a ghost icon. Dirty or failed saves get a small dot, not a filled disc.
    return (
      <>
        <button
          ref={anchor}
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-busy={view === "saving" || undefined}
          aria-label={label}
          title={label}
          className={cn(iconButtonClass, "relative size-11", COMPACT_TONE[view], className)}
        >
          <Icon icon={glyph} className={cn(view === "saving" && "animate-spin motion-reduce:animate-none")} />
          {COMPACT_DOT[view] ? (
            <span aria-hidden="true" className={cn("absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-canvas", COMPACT_DOT[view])} />
          ) : null}
        </button>
        {announcer}
        {shared ? null : own.prompt}
      </>
    );
  }

  return (
    <>
      <button
        ref={anchor}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={view === "saving" || undefined}
        title={TITLE[view]}
        className={cn(
          "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad disabled:cursor-default motion-reduce:transition-none",
          VARIANT[view],
          className,
        )}
      >
        <Icon icon={glyph} className={cn(view === "saving" && "animate-spin motion-reduce:animate-none")} />
        <span>{label}</span>
      </button>
      {announcer}
      {shared ? null : own.prompt}
    </>
  );
}
