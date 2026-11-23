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

interface DeleteNoteDialogProps {
  /** The note waiting for an answer, or null when the dialog is closed. */
  note: { id: string; title: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Asks before a note is deleted. Cancel holds the first focus, so a stray Enter never deletes. The undo toast that
 * follows a confirmed delete stays as a second safety net.
 */
export function DeleteNoteDialog({ note, onCancel, onConfirm }: DeleteNoteDialogProps) {
  return (
    <Dialog open={note !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Delete this note?</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-foreground">
            <span className="font-medium text-foreground break-words">“{note?.title}”</span> will be removed. You can
            undo this right after.
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
            onClick={() => note && onConfirm(note.id)}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
