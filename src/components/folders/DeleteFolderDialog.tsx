"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteFolderDialogProps {
  /** The folder waiting for an answer, or null when the dialog is closed. */
  folder: { id: string; name: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/** Deleting a folder deletes nothing else: its notes and sub-folders move up one level. */
export function DeleteFolderDialog({ folder, onCancel, onConfirm }: DeleteFolderDialogProps) {
  return (
    <Dialog open={folder !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Delete this folder?</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-foreground">
            <span className="font-medium text-foreground break-words">“{folder?.name}”</span> will be removed. Its notes
            and sub-folders are kept and move up one level.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 sm:h-9"
            onClick={() => folder && onConfirm(folder.id)}
          >
            Delete folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
