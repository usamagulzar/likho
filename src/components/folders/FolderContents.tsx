"use client";

import { useMemo } from "react";

import { ChevronIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "@/components/folders/FolderIcons";
import { relativeTime } from "@/components/format";
import { useNow } from "@/components/useNow";
import { Button } from "@/components/ui/button";
import { childFolders, folderPath, subtreeIds } from "@/lib/folders/tree";
import type { Assignments, Folder } from "@/lib/folders/types";
import type { NoteSummary } from "@/lib/types";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import { cn } from "@/lib/utils";

interface FolderContentsProps {
  folderId: string;
  folders: Folder[];
  assignments: Assignments;
  notes: NoteSummary[];
  onOpenFolder: (id: string) => void;
  onOpenNote: (id: string) => void;
  onNewNote: (folderId: string) => void;
  onNewSubfolder: (folderId: string) => void;
  /** Leaves the folder view and returns to the note that was open. */
  onClose: () => void;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const rowClass =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-start outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The folder's "Contents" page. Nothing is stored: it is built from the folder's current notes and sub-folders,
 * so it is always up to date. Read-only.
 */
export function FolderContents({
  folderId,
  folders,
  assignments,
  notes,
  onOpenFolder,
  onOpenNote,
  onNewNote,
  onNewSubfolder,
  onClose,
}: FolderContentsProps) {
  const now = useNow();

  const path = useMemo(() => folderPath(folders, folderId), [folders, folderId]);
  const folder = path[path.length - 1];
  const subfolders = useMemo(() => childFolders(folders, folderId), [folders, folderId]);
  const folderNotes = useMemo(
    () => notes.filter((note) => assignments[note.id] === folderId),
    [notes, assignments, folderId],
  );

  // Note count per sub-folder, including everything below it.
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const sub of subfolders) {
      const ids = subtreeIds(folders, sub.id);
      result.set(sub.id, notes.filter((note) => ids.has(assignments[note.id] ?? "")).length);
    }
    return result;
  }, [subfolders, folders, notes, assignments]);

  if (!folder) return null;

  const empty = subfolders.length === 0 && folderNotes.length === 0;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-pad">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <nav aria-label="Folder path" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <button type="button" onClick={onClose} className="rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              Notes
            </button>
            {path.map((part, index) => {
              const last = index === path.length - 1;
              return (
                <span key={part.id} className="flex min-w-0 items-center gap-1">
                  <ChevronIcon className="size-3.5" />
                  {last ? (
                    <span dir="auto" className="truncate text-foreground">
                      {part.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenFolder(part.id)}
                      dir="auto"
                      className="truncate rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {part.name}
                    </button>
                  )}
                </span>
              );
            })}
          </nav>

          <h1
            dir="auto"
            lang={ARABIC_SCRIPT.test(folder.name) ? "ur" : undefined}
            className={cn(
              "text-2xl font-semibold tracking-tight break-words text-foreground",
              ARABIC_SCRIPT.test(folder.name) && "urdu-row",
            )}
          >
            {folder.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contents · {plural(folderNotes.length, "note", "notes")}, {plural(subfolders.length, "folder", "folders")}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" className="h-10 sm:h-9" onClick={() => onNewNote(folderId)}>
              <PlusIcon /> New note here
            </Button>
            <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={() => onNewSubfolder(folderId)}>
              <FolderPlusIcon /> New subfolder
            </Button>
          </div>

          {empty && (
            <p className="mt-10 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
              This folder is empty. Add a note or a subfolder, or move notes here from the sidebar.
            </p>
          )}

          {subfolders.length > 0 && (
            <section className="mt-8" aria-label="Folders">
              <h2 className="mb-2 px-3 text-xs font-medium text-muted-foreground">Folders</h2>
              <ul className="flex flex-col gap-1">
                {subfolders.map((sub) => (
                  <li key={sub.id}>
                    <button type="button" onClick={() => onOpenFolder(sub.id)} className={rowClass}>
                      <FolderIcon className="text-muted-foreground" />
                      <span dir="auto" className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {sub.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {plural(counts.get(sub.id) ?? 0, "note", "notes")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {folderNotes.length > 0 && (
            <section className="mt-8" aria-label="Notes">
              <h2 className="mb-2 px-3 text-xs font-medium text-muted-foreground">Notes</h2>
              <ul className="flex flex-col gap-1">
                {folderNotes.map((note) => (
                  <li key={note.id}>
                    <button type="button" onClick={() => onOpenNote(note.id)} className={rowClass}>
                      <span
                        dir="auto"
                        lang={ARABIC_SCRIPT.test(note.title) ? "ur" : undefined}
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm text-foreground",
                          ARABIC_SCRIPT.test(note.title) && "urdu-row",
                        )}
                      >
                        {note.title}
                      </span>
                      {note.unsaved && <span aria-label="Unsaved changes" className="size-2 shrink-0 rounded-full bg-brand" />}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {now > 0 ? relativeTime(note.updatedAt, now) : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
