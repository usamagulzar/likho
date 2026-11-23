"use client";

import { useMemo, useState } from "react";

import { FolderIcon } from "@/components/folders/FolderIcons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickerEntries, subtreeIds } from "@/lib/folders/tree";
import type { Folder } from "@/lib/folders/types";
import { cn } from "@/lib/utils";

export interface MoveTarget {
  kind: "note" | "folder";
  id: string;
  title: string;
  /** Where it sits now: a folder id, or null for the top level. */
  currentParentId: string | null;
}

interface MoveDialogProps {
  target: MoveTarget | null;
  folders: Folder[];
  onCancel: () => void;
  onConfirm: (target: MoveTarget, parentId: string | null) => void;
}

function MoveBody({ target, folders, onCancel, onConfirm }: Omit<MoveDialogProps, "target"> & { target: MoveTarget }) {
  const [choice, setChoice] = useState<string | null>(target.currentParentId);

  // A folder cannot go into itself or into one of its own sub-folders.
  const entries = useMemo(
    () => pickerEntries(folders, target.kind === "folder" ? subtreeIds(folders, target.id) : undefined),
    [folders, target],
  );

  const optionClass = (selected: boolean) =>
    cn(
      "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-start text-sm outline-none transition-colors duration-150 pointer-coarse:h-11 focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "bg-selected text-foreground" : "text-secondary-foreground hover:bg-hover",
    );

  return (
    <>
      <DialogHeader className="gap-1.5 text-left">
        <DialogTitle className="text-lg font-semibold tracking-tight">Move to…</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-secondary-foreground">
          Choose where <span className="font-medium text-foreground break-words">“{target.title}”</span> should go.
        </DialogDescription>
      </DialogHeader>

      <div role="radiogroup" aria-label="Destination folder" className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          role="radio"
          aria-checked={choice === null}
          onClick={() => setChoice(null)}
          className={optionClass(choice === null)}
        >
          <FolderIcon className="text-muted-foreground" />
          <span className="truncate">No folder (top level)</span>
        </button>
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={choice === entry.id}
            onClick={() => setChoice(entry.id)}
            style={{ paddingInlineStart: `${0.625 + entry.depth * 1.1}rem` }}
            className={optionClass(choice === entry.id)}
          >
            <FolderIcon className="text-muted-foreground" />
            <span dir="auto" className="truncate">
              {entry.name}
            </span>
          </button>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          className="h-10 sm:h-9"
          disabled={choice === target.currentParentId}
          onClick={() => onConfirm(target, choice)}
        >
          Move
        </Button>
      </DialogFooter>
    </>
  );
}

/** Pick a folder for a note or a folder. The list leaves out destinations that would be invalid. */
export function MoveDialog({ target, folders, onCancel, onConfirm }: MoveDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        {target && (
          <MoveBody
            key={`${target.kind}:${target.id}`}
            target={target}
            folders={folders}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
