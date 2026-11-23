"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { relativeTime } from "@/components/format";
import { MoveIcon } from "@/components/folders/FolderIcons";
import { Icon } from "@/components/Icon";
import { useNow } from "@/components/useNow";
import { cn } from "@/lib/utils";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteSummary } from "@/lib/types";

interface NoteListProps {
  notes: NoteSummary[];
  activeId: string | undefined;
  ready: boolean;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  /** Shows a "Move to folder" button on each row when given. */
  onMove?: (id: string) => void;
  /** Text for an empty list. Pass null to render nothing (used inside folders). */
  emptyText?: string | null;
}

interface NoteRowProps {
  id: string;
  title: string;
  updatedAt: number;
  now: number;
  active: boolean;
  unsaved: boolean;
  /** True for a row that appears after the list has settled: it fades in once, on mount. */
  enter: boolean;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string) => void;
}

// Plain props only, so a row re-renders when its own title, time, active or unsaved state changes, not on every keystroke.
// One line per note: the title. The relative time lives in the tooltip; the trash icon shows on hover or focus.
const NoteRow = memo(function NoteRow({ id, title, updatedAt, now, active, unsaved, enter, onPick, onDelete, onMove }: NoteRowProps) {
  const when = now > 0 ? relativeTime(updatedAt, now) : "";
  // Captured at mount, so a later change of the flag never replays the fade on a row that is already on screen.
  const [fadeIn] = useState(enter);
  // Urdu titles need a taller row (Nastaliq is tall) and right-to-left alignment.
  const urdu = ARABIC_SCRIPT.test(title);
  return (
    <li
      className={cn(
        "group flex items-center rounded-lg transition-colors duration-150",
        urdu ? "h-12 pointer-coarse:h-12" : "h-9 pointer-coarse:h-11",
        fadeIn && "sb-row-in",
        active ? "bg-selected" : "hover:bg-hover",
      )}
    >
      <button
        type="button"
        onClick={() => onPick(id)}
        aria-current={active ? "true" : undefined}
        title={when || undefined}
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          dir="auto"
          lang={urdu ? "ur" : undefined}
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            urdu && "urdu-row",
            active ? "text-foreground" : "text-secondary-foreground",
          )}
        >
          {title}
        </span>
        {unsaved && (
          <span className="inline-flex shrink-0 items-center" title="Unsaved changes">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
            <span className="sr-only">Unsaved changes</span>
          </span>
        )}
      </button>
      {onMove && (
        <button
          type="button"
          aria-label={`Move note to a folder: ${title}`}
          title="Move to folder"
          onClick={() => onMove(id)}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-100 outline-none transition-[color,opacity] duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
        >
          <MoveIcon />
        </button>
      )}
      <button
        type="button"
        aria-label={`Delete note: ${title}`}
        onClick={() => onDelete(id)}
        className="mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-100 outline-none transition-[color,opacity] duration-150 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
      >
        <Icon icon={Delete02Icon} />
      </button>
    </li>
  );
});

export const NoteList = memo(function NoteList({
  notes,
  activeId,
  ready,
  onPick,
  onDelete,
  onMove,
  emptyText,
}: NoteListProps) {
  // Changes once a minute at most, so only the rows' time labels are touched by it.
  const now = useNow();
  // Rows that mount after the first settled render fade in. The first list, shown with the page, does not.
  const settled = useRef(false);
  useEffect(() => {
    if (ready && notes.length > 0) settled.current = true;
  });

  if (!ready) {
    return (
      <div className="flex flex-col gap-1" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-lg bg-hover" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    if (emptyText === null) return null;
    return (
      <p className="px-2.5 py-3 text-sm leading-6 text-muted-foreground">
        {emptyText ?? "No notes yet. Start writing and it will appear here."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => (
        <NoteRow
          key={note.id}
          id={note.id}
          title={note.title}
          updatedAt={note.updatedAt}
          now={now}
          active={note.id === activeId}
          unsaved={note.unsaved === true}
          enter={settled.current}
          onPick={onPick}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </ul>
  );
});

