"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { formatSize } from "@/components/format";
import { FormatToolbar } from "@/components/editor/FormatToolbar";
import { EMPTY_FORMATS, type FormatState } from "@/components/editor/formatTypes";
import { ExportMenu } from "@/components/ExportMenu";
import { splitNote } from "@/components/exportNote";
import { Icon } from "@/components/Icon";
import { SharePopover, type ShareController } from "@/components/share/SharePopover";
import { SaveButton, useSaveAction } from "@/components/SaveButton";
import { UrduToggle } from "@/components/UrduToggle";
import { useWideScreen } from "@/components/useWideScreen";
import "./WritingPad.css";
import { cn } from "@/lib/utils";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteStore } from "@/lib/types";
import type { NoteEditorHandle } from "@/components/editor/NoteEditor";

// The editor is CodeMirror. It loads on the client only, after the pad is on screen. The skeleton is one empty
// 28px row, the same as an empty note, so nothing moves when the editor mounts.
const NoteEditor = dynamic(() => import("@/components/editor/NoteEditor").then((mod) => mod.NoteEditor), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-7 min-w-0 flex-1" />,
});

interface StatusView {
  label: string;
  dot?: string;
  spinning?: boolean;
}

/**
 * What the bottom strip says. Guest: the note lives on this device. Account: the save state. An empty note says
 * nothing.
 */
function statusFor(store: Pick<NoteStore, "mode" | "saveState">, empty: boolean): StatusView | null {
  if (store.mode === "guest") return empty ? null : { label: "On this device", dot: "bg-muted-foreground/60" };
  switch (store.saveState) {
    case "saving":
      return { label: "Saving…", spinning: true };
    case "unsaved":
      return { label: "Unsaved changes", dot: "bg-warning" };
    case "offline":
      return { label: "Offline — not saved", dot: "bg-warning" };
    case "error":
      return { label: "Couldn't save", dot: "bg-destructive" };
    default:
      return empty ? null : { label: "All changes saved", dot: "bg-success" };
  }
}

/** Joins the two fields back into the stored string. An empty note stays an empty string. */
function joinNote(title: string, body: string): string {
  if (title === "" && body === "") return "";
  return `${title}\n${body}`;
}

/** What the shell can ask of the pad. Focus goes to the title of an empty note, otherwise to the end of the body. */
export interface WritingPadHandle {
  focusNote: () => void;
}

/** The margin rule sits this far from the pad's left edge. The text starts 12px to its right. */
const MARGIN_RULE = "clamp(14px, 2.5vw, 32px)";

interface WritingPadProps {
  store: NoteStore;
  handleRef: RefObject<WritingPadHandle | null>;
  shareController: ShareController;
}

export function WritingPad({ store, handleRef, shareController }: WritingPadProps) {
  const wide = useWideScreen();
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<NoteEditorHandle>(null);
  // What the caret is inside right now (bold, a heading ...). The editor reports it; the toolbar lights its buttons.
  const [formats, setFormats] = useState<FormatState>(EMPTY_FORMATS);
  // Caret to set in the body after a multi-line paste into the title. Applied once the body has re-rendered.
  const pendingBodyCaret = useRef<number | null>(null);
  // A focus request ran before the editor finished loading. The editor takes it when it is ready.
  const pendingEditorFocus = useRef<"start" | "end" | null>(null);
  // One save path for the pad's button and Cmd/Ctrl+S. Its sign-in prompt is rendered once, below.
  const save = useSaveAction(store);

  const content = store.activeNote?.content ?? "";
  const { title, body } = useMemo(() => splitNote(content), [content]);
  const size = useMemo(() => formatSize(content), [content]);
  const empty = content.trim() === "";
  const status = statusFor(store, empty);
  // Signed in with notes but none open yet: the note is still loading, so typing would be lost.
  const locked = store.mode === "account" && !store.activeNote && store.notes.length > 0;
  const readOnly = !store.ready || locked;

  useLayoutEffect(() => {
    const caret = pendingBodyCaret.current;
    if (caret === null) return;
    pendingBodyCaret.current = null;
    editorRef.current?.focusAt(caret);
  });

  // Writes both fields back as one string, so the store, sync and sidebar only ever see title + "\n" + body.
  function commit(nextTitle: string, nextBody: string) {
    // Signed in with no notes yet: the first keystroke creates one.
    if (!store.activeNote) store.create();
    store.update(joinNote(nextTitle, nextBody));
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    commit(event.target.value, body);
  }

  function handleBodyChange(nextBody: string) {
    commit(title, nextBody);
  }

  function focusTitleEnd() {
    const input = titleRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  // The editor takes focus now, or once it has loaded.
  const focusEditor = useCallback((where: "start" | "end") => {
    const editor = editorRef.current;
    if (!editor) {
      pendingEditorFocus.current = where;
    } else if (where === "start") {
      editor.focusStart();
    } else {
      editor.focusEnd();
    }
  }, []);

  const focusEditorEnd = useCallback(() => focusEditor("end"), [focusEditor]);

  const onEditorReady = useCallback(() => {
    const where = pendingEditorFocus.current;
    if (!where) return;
    pendingEditorFocus.current = null;
    focusEditor(where);
  }, [focusEditor]);

  // An empty title takes focus (new notes, first load, empty notes). Otherwise the caret goes to the end of the body.
  // Reads the DOM, so callers must flush the store update first.
  const focusNote = useCallback(() => {
    const input = titleRef.current;
    if (!input) return;
    if (input.value === "") {
      input.focus();
      input.setSelectionRange(0, 0);
    } else {
      focusEditorEnd();
    }
  }, [focusEditorEnd]);

  useImperativeHandle(handleRef, () => ({ focusNote }), [focusNote]);

  // First load: focus the note once the store has loaded it. Editing is locked until then.
  useEffect(() => {
    if (store.ready) focusNote();
  }, [store.ready, focusNote]);

  // Enter, or Arrow Down at the end of the title, moves focus to the start of the body.
  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const atEnd = selectionStart === value.length && selectionEnd === value.length;
    if (event.key === "Enter" || (event.key === "ArrowDown" && atEnd)) {
      event.preventDefault();
      editorRef.current?.focusStart();
    }
  }

  // A multi-line paste into the title: the first line stays in the title, the rest opens the body.
  function handleTitlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    const lineBreak = text.indexOf("\n");
    if (lineBreak === -1) return; // One line pastes as usual.
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    const start = selectionStart ?? title.length;
    const end = selectionEnd ?? start;
    const restOfPaste = text.slice(lineBreak + 1);
    // Title text after the caret moves down into the body, behind the rest of the paste.
    const bodyHead = restOfPaste + title.slice(end);
    commit(
      title.slice(0, start) + text.slice(0, lineBreak),
      body ? `${bodyHead}\n${body}` : bodyHead,
    );
    pendingBodyCaret.current = restOfPaste.length;
  }

  // Cmd/Ctrl+S saves the note to the account (or opens the sign-in prompt). It never downloads a file, and the
  // browser's save dialog stays shut.
  function handlePadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    if (event.key.toLowerCase() !== "s") return;
    event.preventDefault();
    void save.run();
  }

  // Clicks on the title keep their own caret. Clicks in the pad outside the text (the empty space below it, the
  // margins, the strip) put the caret at the end of the body. Clicks in portals (the sign-in prompt, the export
  // menu) are not in the pad's DOM, so they are ignored here.
  function focusPad(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Node) || !event.currentTarget.contains(target)) return;
    if (target instanceof Element && target.closest(".cm-editor, input, button, a")) return;
    focusEditorEnd();
  }

  // Urdu titles get their own size and line box, and no letter-spacing (see .urdu-title in globals.css).
  const urduTitle = ARABIC_SCRIPT.test(title);

  return (
    // The pad is a fixed sheet: border, radius and shadow stay put. Only the ruled sheet scrolls, so the bottom strip
    // is never over the text and the caret can't hide behind it.
    <div
      onClick={focusPad}
      onKeyDown={handlePadKeyDown}
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-pad"
    >
      {/* The formatting panel sits above the sheet, outside the scrolling part, so it is always in reach. */}
      <FormatToolbar state={formats} disabled={readOnly} onCommand={(id) => editorRef.current?.format(id)} />

      <div
        onScroll={() => editorRef.current?.refresh()}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* One ruled sheet for the title and the body: same 28px grid, same insets, so no rule breaks at the boundary. */}
        <div
          className="notepad relative flex min-h-full flex-col pt-3 pr-4 pad-gutter"
          style={{ paddingLeft: `calc(${MARGIN_RULE} + 12px)` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: MARGIN_RULE }}
          />

          {/* Title row: two 28px rules tall. The title text sits on the second rule. Share and Save sit at the right. */}
          <div className="relative h-14 shrink-0">
            <input
              ref={titleRef}
              type="text"
              aria-label="Note title"
              dir="auto"
              lang={urduTitle ? "ur" : undefined}
              placeholder={store.ready ? "Untitled note" : undefined}
              autoComplete="off"
              spellCheck
              value={title}
              readOnly={readOnly}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onPaste={handleTitlePaste}
              className={cn(
                "pad-title-reserve block h-14 w-full text-ellipsis bg-transparent pt-4 text-[1.75rem] leading-[36px] font-semibold tracking-[-0.01em] text-secondary-foreground caret-brand outline-none placeholder:font-medium placeholder:text-muted-foreground",
                urduTitle && "urdu-title",
              )}
              style={{ paddingRight: wide ? "12rem" : undefined }}
            />
            {/* Desktop-class screens only (CSS, same rule as the shell). Phones use the top-bar controls. */}
            <div className="shell-desk-only absolute top-[1.125rem] right-0 flex items-center gap-1">
              <SharePopover store={store} controller={shareController} />
              <SaveButton store={store} action={save} />
            </div>
          </div>

          {/* One empty 28px rule between the title and the body. Clicking it starts the body. The rules run through it.
              The English | اردو toggle and the keyboard-layout button live here, inside the notebook. */}
          <div className="relative h-7 shrink-0">
            <div
              aria-hidden="true"
              onClick={(event) => {
                event.stopPropagation();
                focusEditor("start");
              }}
              className="absolute inset-0 cursor-text"
            />
            <UrduToggle />
          </div>

          <NoteEditor
            noteId={store.activeNote?.id ?? null}
            value={body}
            readOnly={readOnly}
            placeholder={store.ready ? "Start writing…" : ""}
            onChange={handleBodyChange}
            onAtTop={focusTitleEnd}
            onReady={onEditorReady}
            onFormatState={setFormats}
            handleRef={editorRef}
          />
        </div>
      </div>

      {/* The strip is outside the scrolling sheet. Its height is 32px, or 56px plus the home-indicator inset on phones. */}
      <div className="pad-strip flex shrink-0 items-center justify-between gap-2 px-3">
        <Link
          href="/about"
          prefetch={false}
          className="inline-flex min-h-7 shrink-0 items-center rounded-sm text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          About Likho
        </Link>
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-pad/90 px-1.5 text-xs text-muted-foreground tabular-nums">
          <ExportMenu content={content} />
          <span className="hidden min-[360px]:inline">{size}</span>
          {status ? (
            <span aria-hidden="true" className="hidden min-[360px]:inline">
              ·
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5">
            {status?.spinning ? (
              <Icon icon={Loading03Icon} className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : status?.dot ? (
              <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
            ) : null}
            <span role="status" aria-live="polite" className="truncate">
              {status?.label ?? ""}
            </span>
          </span>
        </div>
      </div>

      {save.prompt}
    </div>
  );
}

