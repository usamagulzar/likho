"use client";

import { memo, useMemo, useSyncExternalStore } from "react";
import { PencilEdit02Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { AccountArea } from "@/components/AccountArea";
import { LogoMark } from "@/components/brand/LogoMark";
import { FolderTree, type FolderPanel } from "@/components/folders/FolderTree";
import { Icon } from "@/components/Icon";
import { NoteList } from "@/components/NoteList";
import { ThemeButton } from "@/components/ThemeButton";
import { iconButtonClass } from "@/components/styles";
import { cn } from "@/lib/utils";
import type { NoteSummary } from "@/lib/types";

const noSubscribe = () => () => undefined;

// Platform-dependent, so it resolves on the client only. The server snapshot is null, which keeps the hydration match.
function getIsMac(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

function useShortcutLabels(): { newNote: string; toggle: string } {
  const mac = useSyncExternalStore<boolean | null>(noSubscribe, getIsMac, () => null);
  if (mac === null) return { newNote: "", toggle: "" };
  return mac ? { newNote: "⌘⇧O", toggle: "⌘B" } : { newNote: "Ctrl+Shift+O", toggle: "Ctrl+B" };
}

interface NotesSidebarProps {
  notes: NoteSummary[];
  activeId: string | undefined;
  ready: boolean;
  onNewNote: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  /** Folder state and actions. Memoised by the parent, so the memo below still skips typing re-renders. */
  panel: FolderPanel;
  /** Desktop only. Passing it makes the sidebar collapsible: the same tree then shows its icon rail. */
  onToggle?: () => void;
  /** Desktop only: whether the sidebar is expanded. */
  open?: boolean;
}

/**
 * One tree for the desktop sidebar (both widths) and the mobile drawer. Collapsing never swaps components:
 * the parent's data-sidebar attribute drives the widths and the fades (see .sb-aside in globals.css).
 * Icons sit in a 40px column at the same x in both states, so they do not jump while the sidebar animates.
 */
export const NotesSidebar = memo(function NotesSidebar({
  notes,
  activeId,
  ready,
  onNewNote,
  onPick,
  onDelete,
  panel,
  onToggle,
  open = true,
}: NotesSidebarProps) {
  const shortcuts = useShortcutLabels();
  const collapsible = onToggle !== undefined;

  // Notes that are not in any folder stay in the plain list below the folders.
  const topNotes = useMemo(() => {
    const folderIds = new Set(panel.folders.map((folder) => folder.id));
    return notes.filter((note) => {
      const folderId = panel.assignments[note.id];
      return folderId === undefined || !folderIds.has(folderId);
    });
  }, [notes, panel.folders, panel.assignments]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Desktop only. The mobile drawer draws its own header. */}
      {collapsible && (
        <div className="sb-inset flex h-12 shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            aria-expanded={false}
            aria-controls="notes-sidebar"
            title={`Expand sidebar${shortcuts.toggle ? ` (${shortcuts.toggle})` : ""}`}
            className={cn(iconButtonClass, "sb-rail-only size-10 items-center justify-center")}
          >
            <Icon icon={SidebarLeftIcon} />
          </button>
          <span className="sb-fade ml-1.5 flex min-w-0 flex-1 items-center gap-2 select-none">
            <LogoMark size={24} tile="var(--logo-tile)" className="shrink-0" />
            <span
              className="truncate text-[16px] leading-none font-semibold tracking-[-0.01em] text-foreground"
            >
              Likho
            </span>
          </span>
          <ThemeButton className="sb-fade" />
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            aria-expanded={open}
            aria-controls="notes-sidebar"
            title={`Collapse sidebar${shortcuts.toggle ? ` (${shortcuts.toggle})` : ""}`}
            className={cn(iconButtonClass, "sb-fade")}
          >
            <Icon icon={SidebarLeftIcon} />
          </button>
        </div>
      )}

      {collapsible && (
        <div className="sb-rail-only sb-inset shrink-0">
          <ThemeButton className="size-10" />
        </div>
      )}

      <div className="sb-inset shrink-0 pt-2">
        <button
          type="button"
          onClick={onNewNote}
          aria-label="New note"
          title={shortcuts.newNote ? `New note (${shortcuts.newNote})` : "New note"}
          className="sb-new flex h-10 items-center overflow-hidden rounded-[10px] bg-brand-soft text-left text-sm font-medium whitespace-nowrap text-foreground outline-none transition-[background-color,width,margin] duration-150 hover:bg-brand-soft-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-9 shrink-0 place-items-center">
            <Icon icon={PencilEdit02Icon} className="text-brand" />
          </span>
          <span className="sb-fade min-w-0 flex-1 truncate">New note</span>
        </button>
      </div>

      <div className="sb-fade sb-inset mt-4 min-h-0 flex-1 overflow-y-auto pb-2">
        <FolderTree panel={panel} notes={notes} activeId={activeId} onPick={onPick} onDelete={onDelete} />

        <p className="px-2.5 pt-4 pb-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground">Notes</p>
        <NoteList
          notes={topNotes}
          activeId={panel.folderView === null ? activeId : undefined}
          ready={ready}
          emptyText={notes.length > 0 ? null : undefined}
          onPick={onPick}
          onDelete={onDelete}
          onMove={panel.onMoveNote}
        />
      </div>

      {/* One profile row pinned to the bottom, with a hairline above and an 8px inset. Expanded: the account row.
          Collapsed: the avatar alone in the icon column. Both share one grid cell, so the footer keeps its height. */}
      <div className="grid shrink-0 grid-cols-1 items-center border-t border-border px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="sb-fade col-start-1 row-start-1 min-w-0">
          <AccountArea />
        </div>
        {collapsible && (
          <div className="sb-rail-only col-start-1 row-start-1 items-center">
            <AccountArea variant="rail" />
          </div>
        )}
      </div>
    </div>
  );
});

