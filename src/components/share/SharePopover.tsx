"use client";

import { useCallback, useId, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import {
  Cancel01Icon,
  Copy01Icon,
  ExternalLinkIcon,
  Loading03Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { useWideScreen } from "@/components/useWideScreen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { iconButtonClass } from "@/components/styles";
import type { NoteStore } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShareStore = Pick<NoteStore, "mode" | "activeNote" | "activeNotePersisted">;

export interface ShareLink {
  slug: string;
  url: string;
  createdAt: string;
}

interface ShareRecord {
  noteId: string;
  share: ShareLink | null;
}

export interface ShareController {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
  available: boolean;
  known: boolean;
  share: ShareLink | null;
  loading: boolean;
  failed: boolean;
  busy: boolean;
  retryLoad: () => void;
  toggle: () => Promise<void>;
}

function readShareResponse(value: unknown): ShareLink | null {
  if (typeof value !== "object" || value === null) throw new Error("Invalid share response");
  const data = value as Record<string, unknown>;
  if (data.shared === false) return null;
  if (
    data.shared === true &&
    typeof data.slug === "string" &&
    typeof data.url === "string" &&
    typeof data.createdAt === "string"
  ) {
    return { slug: data.slug, url: data.url, createdAt: data.createdAt };
  }
  throw new Error("Invalid share response");
}

async function requestShare(noteId: string, method: "GET" | "POST" | "DELETE"): Promise<ShareLink | null> {
  const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}/share`, {
    method,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Share request failed");

  const share = readShareResponse(await response.json());
  if ((method === "POST" && !share) || (method === "DELETE" && share)) {
    throw new Error("Unexpected share response");
  }
  return share;
}

/** One share state controller is shared by the phone and desktop buttons. */
export function useShareController(store: ShareStore): ShareController {
  const noteId = store.activeNote?.id ?? null;
  const available = store.mode === "account" && noteId !== null && store.activeNotePersisted === true;
  const [openFor, setOpenFor] = useState<{ noteId: string | null; open: boolean }>({ noteId: null, open: false });
  const open = openFor.noteId === noteId && openFor.open;
  const [record, setRecord] = useState<ShareRecord | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadSequence = useRef(0);

  const loadShare = useCallback(async (id: string) => {
    const request = ++loadSequence.current;
    setLoadingId(id);
    setFailedId(null);
    try {
      const share = await requestShare(id, "GET");
      if (request !== loadSequence.current) return;
      setRecord({ noteId: id, share });
    } catch {
      if (request !== loadSequence.current) return;
      setFailedId(id);
      toast.error("Couldn't load sharing settings.");
    } finally {
      if (request === loadSequence.current) setLoadingId((current) => (current === id ? null : current));
    }
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpenFor({ noteId, open: next });
      if (next && available && noteId) void loadShare(noteId);
    },
    [available, loadShare, noteId],
  );

  const retryLoad = useCallback(() => {
    if (available && noteId) void loadShare(noteId);
  }, [available, loadShare, noteId]);

  const currentRecord = record?.noteId === noteId ? record : null;

  const toggle = useCallback(async () => {
    if (!available || !noteId || !currentRecord || loadingId === noteId || busyId === noteId) return;
    const id = noteId;
    const method = currentRecord.share ? "DELETE" : "POST";
    // Ignore any earlier GET so it cannot replace the result of this mutation.
    loadSequence.current += 1;
    setLoadingId((current) => (current === id ? null : current));
    setBusyId(id);
    setFailedId(null);
    try {
      const share = await requestShare(id, method);
      setRecord({ noteId: id, share });
      toast.success(method === "POST" ? "Sharing link created" : "Sharing stopped");
    } catch {
      toast.error("Couldn't update sharing. Try again.");
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  }, [available, busyId, currentRecord, loadingId, noteId]);

  return {
    open,
    onOpenChange,
    noteId,
    available,
    known: currentRecord !== null,
    share: currentRecord?.share ?? null,
    loading: loadingId === noteId,
    failed: failedId === noteId,
    busy: busyId === noteId,
    retryLoad,
    toggle,
  };
}

interface SharePopoverProps {
  store: ShareStore;
  controller: ShareController;
  /** Icon-only 44px phone header variant. */
  compact?: boolean;
}

export function SharePopover({ store, controller, compact = false }: SharePopoverProps) {
  const wide = useWideScreen();
  const titleId = useId();
  const descriptionId = useId();
  const linkRef = useRef<HTMLInputElement>(null);
  if (store.mode !== "account" || (compact ? wide : !wide)) return null;

  const noteId = store.activeNote?.id ?? null;
  const persisted = store.activeNotePersisted === true;
  const disabled = !noteId || !persisted;
  const shareIsOn = controller.noteId === noteId && controller.known && controller.share !== null;
  const pending = controller.loading || controller.busy;
  const triggerLabel = shareIsOn ? "Share note, link is on" : "Share note";
  const triggerTitle = disabled ? "Save the note to share it" : triggerLabel;

  async function copyLink() {
    const url = controller.share?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      return;
    } catch {
      // Fall back to selecting the read-only field when clipboard access is unavailable.
    }

    const input = linkRef.current;
    if (!input) {
      toast.error("Couldn't copy the link.");
      return;
    }
    input.focus();
    input.select();
    try {
      if (document.execCommand("copy")) {
        toast.success("Link copied");
        return;
      }
    } catch {
      // Leave the selection in place so the user can copy it with the keyboard.
    }
    toast("Link selected. Press Ctrl+C or ⌘C to copy.");
  }

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      title={triggerTitle}
      aria-label={triggerLabel}
      aria-expanded={controller.open}
      aria-busy={pending || undefined}
      className={
        compact
          ? cn(
              iconButtonClass,
              "relative size-11 disabled:cursor-not-allowed disabled:opacity-40",
              shareIsOn && "text-brand",
            )
          : cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
              shareIsOn
                ? "border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft"
                : "border-border text-secondary-foreground hover:bg-hover hover:text-foreground",
            )
      }
    >
      <Icon
        icon={pending ? Loading03Icon : Share01Icon}
        className={cn(pending && "animate-spin motion-reduce:animate-none")}
      />
      {compact ? null : <span>Share</span>}
      {shareIsOn ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2.5 right-2.5 size-2 rounded-full bg-brand ring-2 ring-canvas",
            !compact && "static size-1.5 ring-0",
          )}
        />
      ) : null}
    </button>
  );

  const panel = (
    <SharePanel
      controller={controller}
      titleId={titleId}
      descriptionId={descriptionId}
      linkRef={linkRef}
      onCopy={() => void copyLink()}
      onClose={() => controller.onOpenChange(false)}
      inSheet={compact}
    />
  );

  if (compact) {
    return (
      <Sheet open={controller.open} onOpenChange={controller.onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-label="Share note"
          className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={controller.open} onOpenChange={controller.onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={16}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-4"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

interface SharePanelProps {
  controller: ShareController;
  titleId: string;
  descriptionId: string;
  linkRef: RefObject<HTMLInputElement | null>;
  onCopy: () => void;
  onClose: () => void;
  inSheet: boolean;
}

function SharePanel({
  controller,
  titleId,
  descriptionId,
  linkRef,
  onCopy,
  onClose,
  inSheet,
}: SharePanelProps) {
  const shareIsOn = controller.known && controller.share !== null;
  const canToggle = controller.available && controller.known && !controller.loading && !controller.busy;
  const title = inSheet ? (
    <SheetTitle className="text-base leading-snug font-semibold text-foreground">Share note</SheetTitle>
  ) : (
    <h2 id={titleId} className="text-base leading-snug font-semibold text-foreground">
      Share note
    </h2>
  );
  const description = inSheet ? (
    <SheetDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
      Create a read-only link anyone can open.
    </SheetDescription>
  ) : (
    <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted-foreground">
      Create a read-only link anyone can open.
    </p>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 text-foreground">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {title}
          {description}
        </div>
        {inSheet ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share settings"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-secondary-foreground outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon icon={Cancel01Icon} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-3">
        <span className="min-w-0 flex-1 text-sm leading-snug font-medium text-secondary-foreground">
          Anyone with the link can view
        </span>
        {controller.loading || controller.busy ? (
          <Icon icon={Loading03Icon} className="animate-spin text-brand motion-reduce:animate-none" />
        ) : null}
        <button
          type="button"
          role="switch"
          aria-label="Anyone with the link can view"
          aria-checked={shareIsOn}
          disabled={!canToggle}
          onClick={() => void controller.toggle()}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted outline-none transition-colors duration-150 after:absolute after:inset-[-8px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none aria-checked:bg-brand"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-4 rounded-full bg-canvas shadow-xs transition-transform duration-150 motion-reduce:transition-none",
              shareIsOn ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {controller.loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Checking link status…
        </p>
      ) : controller.busy ? (
        <p role="status" className="text-xs text-muted-foreground">
          Updating sharing…
        </p>
      ) : controller.failed && !controller.known ? (
        <div className="flex items-center justify-between gap-3 text-xs text-destructive">
          <span>Couldn&apos;t load sharing settings.</span>
          <button
            type="button"
            onClick={controller.retryLoad}
            className="shrink-0 rounded-md px-2 py-1 font-medium text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        </div>
      ) : null}

      {shareIsOn && controller.share ? (
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={linkRef}
              type="url"
              aria-label="Share link"
              readOnly
              value={controller.share.url}
              onFocus={(event) => event.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-pad px-2.5 font-mono text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon={Copy01Icon} />
              <span>Copy</span>
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Viewers see the last saved version. Edits appear after you save.
          </p>
          <a
            href={controller.share.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-md text-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open link
            <Icon icon={ExternalLinkIcon} className="size-4" />
          </a>
        </div>
      ) : controller.known && !controller.failed ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Turn on the link when you’re ready to share this note.
        </p>
      ) : null}
    </div>
  );
}
