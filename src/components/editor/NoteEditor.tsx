"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Annotation, Compartment, EditorState, Transaction, type Extension } from "@codemirror/state";
import { drawSelection, EditorView, keymap, placeholder as placeholderExtension } from "@codemirror/view";
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { editorKeymap, fenceExitOnBacktick, type EditorBridge } from "./commands";
import { formatState, formattingKeymap, runFormat, type FormatId, type FormatState } from "./formatting";
import { editorInteractions } from "./interactions";
import { livePreview } from "./livePreview";
import { markdownSupport } from "./markdown";
import { smartPaste } from "./smartPaste";
import { tablePipeInputHandler } from "./tableCommands";
import { tablePreview } from "./tables";
import { urduSupport } from "./urdu";
import { codeHighlight, editorBaseTheme } from "./theme";
import "./editor.css";

export interface NoteEditorHandle {
  focusStart: () => void;
  focusEnd: () => void;
  focusAt: (pos: number) => void;
  /** Re-measures the viewport. The pad scrolls the editor, so the editor needs a nudge when it scrolls. */
  refresh: () => void;
  /** Runs a toolbar command (bold, a heading, a list ...) on the current selection, then refocuses the note. */
  format: (id: FormatId) => void;
}

export interface NoteEditorProps {
  /** Changing id loads a fresh document with its own undo history. */
  noteId: string | null;
  /** The Markdown body: everything after the title line. */
  value: string;
  readOnly: boolean;
  placeholder: string;
  onChange: (body: string) => void;
  /** ArrowUp from the first line, or Backspace at the start, moves focus to the title. */
  onAtTop: () => void;
  onReady?: () => void;
  /** What the caret is inside (bold, a heading ...), so the toolbar can light its buttons. Only fires on change. */
  onFormatState?: (state: FormatState) => void;
  handleRef: RefObject<NoteEditorHandle | null>;
}

interface Wiring {
  compartments: { readOnly: Compartment; placeholder: Compartment };
  bridge: EditorBridge & { onChange: (body: string) => void };
  /** Reports the formatting at the caret to the toolbar, skipping reports that would say nothing new. */
  formats: (state: EditorState) => void;
}

/** Marks edits that copy the store into the editor, so they do not echo back as user changes. */
const externalSync = Annotation.define<boolean>();

function readOnlyExtension(readOnly: boolean): Extension {
  return readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : [];
}

function placeholderFor(text: string): Extension {
  return text ? placeholderExtension(text) : [];
}

function createState(doc: string, wiring: Wiring, readOnly: boolean, placeholder: string): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      history(),
      drawSelection({ drawRangeCursor: false }),
      EditorView.lineWrapping,
      markdownSupport,
      livePreview,
      tablePreview,
      codeHighlight,
      editorBaseTheme,
      editorKeymap(wiring.bridge),
      fenceExitOnBacktick,
      tablePipeInputHandler,
      smartPaste(),
      urduSupport,
      editorInteractions,
      wiring.compartments.readOnly.of(readOnlyExtension(readOnly)),
      wiring.compartments.placeholder.of(placeholderFor(placeholder)),
      formattingKeymap,
      keymap.of([...historyKeymap, ...defaultKeymap]),
      EditorView.contentAttributes.of({ "aria-label": "Note body", spellcheck: "true" }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        if (update.transactions.some((tr) => tr.annotation(externalSync))) return;
        wiring.bridge.onChange(update.state.doc.toString());
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet || update.focusChanged) wiring.formats(update.state);
      }),
    ],
  });
}

/**
 * The note body as a live Markdown editor. One CodeMirror view is created and kept for the life of the pad. It
 * only takes a new document when the note id changes, or when the store changes the text from outside.
 */
export function NoteEditor({
  noteId,
  value,
  readOnly,
  placeholder,
  onChange,
  onAtTop,
  onReady,
  onFormatState,
  handleRef,
}: NoteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  // The latest props, read by the editor's callbacks. The callbacks themselves never change identity.
  const latest = useRef({ noteId, value, readOnly, placeholder, onChange, onAtTop, onReady, onFormatState });
  const [wiring] = useState<Wiring>(() => {
    let lastReported = "";
    return {
      compartments: { readOnly: new Compartment(), placeholder: new Compartment() },
      bridge: {
        onChange: (body: string) => latest.current.onChange(body),
        onAtTop: () => latest.current.onAtTop(),
      },
      formats: (state: EditorState) => {
        const next = formatState(state);
        const key = `${next.active.join(",")}|${next.canUndo}|${next.canRedo}`;
        if (key === lastReported) return;
        lastReported = key;
        latest.current.onFormatState?.(next);
      },
    };
  });

  useLayoutEffect(() => {
    latest.current = { noteId, value, readOnly, placeholder, onChange, onAtTop, onReady, onFormatState };
  });

  // Created once. The view then lives across every keystroke.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const current = latest.current;
    const view = new EditorView({
      parent: host,
      state: createState(current.value, wiring, current.readOnly, current.placeholder),
    });
    viewRef.current = view;
    loadedIdRef.current = current.noteId;
    wiring.formats(view.state);
    current.onReady?.();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [wiring]);

  // Syncs from the store only when the note changed, or the text differs from the editor's own document.
  // Typing already matches, so the caret never jumps.
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (loadedIdRef.current !== noteId) {
      loadedIdRef.current = noteId;
      view.setState(createState(value, wiring, readOnly, placeholder));
      wiring.formats(view.state);
      return;
    }
    if (view.composing || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      selection: { anchor: Math.min(view.state.selection.main.head, value.length) },
      annotations: [externalSync.of(true), Transaction.addToHistory.of(false)],
    });
  }, [noteId, value, readOnly, placeholder, wiring]);

  useLayoutEffect(() => {
    viewRef.current?.dispatch({
      effects: [
        wiring.compartments.readOnly.reconfigure(readOnlyExtension(readOnly)),
        wiring.compartments.placeholder.reconfigure(placeholderFor(placeholder)),
      ],
    });
  }, [readOnly, placeholder, wiring]);

  useImperativeHandle(
    handleRef,
    () => {
      const place = (pos: number) => {
        const view = viewRef.current;
        if (!view) return;
        const anchor = Math.min(Math.max(pos, 0), view.state.doc.length);
        view.dispatch({ selection: { anchor }, scrollIntoView: true });
        view.focus();
      };
      return {
        focusStart: () => place(0),
        focusEnd: () => place(Number.MAX_SAFE_INTEGER),
        focusAt: place,
        refresh: () => viewRef.current?.requestMeasure(),
        format: (id: FormatId) => {
          const view = viewRef.current;
          if (view) runFormat(view, id);
        },
      };
    },
    [],
  );

  return <div ref={hostRef} className="note-editor min-w-0 flex-1" />;
}

