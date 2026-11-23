"use client";

import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { saveNoteFile, type ExportFormat } from "@/components/exportNote";
import { Icon } from "@/components/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Saves the note as a file and says so. A completely empty note saves nothing. */
export function saveNoteAs(content: string, format: ExportFormat): void {
  const filename = saveNoteFile(content, format);
  if (filename) toast.success(`Saved as ${filename}`);
}

const options: { format: ExportFormat; label: string; description: string }[] = [
  { format: "md", label: "Markdown (.md)", description: "Keeps headings and formatting." },
  { format: "txt", label: "Plain text (.txt)", description: "Title and body, no markup." },
];

interface ExportMenuProps {
  content: string;
}

/** The pad's download control: a labelled button in the bottom strip, left of the counter. */
export function ExportMenu({ content }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const empty = content.trim() === "";

  function handleOpenChange(next: boolean) {
    if (next && empty) return;
    setOpen(next);
  }

  function save(format: ExportFormat) {
    setOpen(false);
    saveNoteAs(content, format);
  }

  // Arrow Up and Down move between the two choices. Tab and Escape work as usual.
  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-export-item]"));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    event.preventDefault();
    items[(index + step + items.length) % items.length]?.focus();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Download note as a file"
          aria-label="Save note as a file"
          aria-disabled={empty || undefined}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-canvas px-3 text-xs font-medium text-secondary-foreground shadow-xs outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-canvas aria-disabled:hover:text-secondary-foreground min-[768px]:h-7"
        >
          <Icon icon={Download04Icon} className="size-4" />
          <span>Download</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        onKeyDown={handleMenuKeyDown}
        className="w-64 rounded-xl border border-border bg-pad p-1.5 text-foreground shadow-menu"
      >
        <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Save note as</p>
        <div className="flex flex-col gap-0.5">
          {options.map((option) => (
            <button
              key={option.format}
              type="button"
              data-export-item
              onClick={() => save(option.format)}
              className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
