"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ChevronIcon,
  ContentsIcon,
  DotsIcon,
  FolderIcon,
  FolderPlusIcon,
  MoveIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/folders/FolderIcons";
import { NoteList } from "@/components/NoteList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { childFolders, folderPath } from "@/lib/folders/tree";
import type { Assignments, Folder } from "@/lib/folders/types";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXPANDED_KEY = "likho:folders:expanded";

/** Everything the sidebar needs to draw and drive folders. AppShell memoises it so the sidebar's memo still works. */
export interface FolderPanel {
  folders: Folder[];
  assignments: Assignments;
  loaded: boolean;
  /** The folder whose Contents page is open, or null. */
  folderView: string | null;
  onOpenContents: (id: string) => void;
  onNewNoteIn: (folderId: string) => void;
  /** Creates a folder and returns its id, so the tree can start renaming it. */
  onNewFolder: (parentId: string | null) => string;
  onRename: (id: string, name: string) => void;
  onMoveFolder: (id: string) => void;
  onMoveNote: (noteId: string) => void;
  onDeleteFolder: (id: string) => void;
}

interface FolderTreeProps {
  panel: FolderPanel;
  notes: NoteSummary[];
  activeId: string | undefined;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}

const rowHeight = (urdu: boolean) => (urdu ? "h-12" : "h-9 pointer-coarse:h-11");

const smallButton =
  "grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-[color,opacity] duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring";
const hoverReveal =
  "opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100";

function RenameInput({ initial, onDone }: { initial: string; onDone: (value: string | null) => void }) {
  const [value, setValue] = useState(initial);
  const done = useRef(false);

  const finish = (result: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(result);
  };

  return (
    <input
      autoFocus
      dir="auto"
      value={value}
      maxLength={80}
      aria-label="Folder name"
      onChange={(event) => setValue(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={() => finish(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish(value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          finish(null);
        }
      }}
      className={cn(
        "mx-1 h-8 min-w-0 flex-1 rounded-md border border-border bg-pad px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ARABIC_SCRIPT.test(value) && "urdu-row",
      )}
    />
  );
}

interface NodeProps {
  folder: Folder;
  panel: FolderPanel;
  folders: Folder[];
  notesByFolder: Map<string, NoteSummary[]>;
  activeId: string | undefined;
  expanded: ReadonlySet<string>;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}

function FolderNode(props: NodeProps) {
  const { folder, panel, folders, notesByFolder, activeId, expanded, renamingId, setRenamingId, toggle, expand } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const focusInputNext = useRef(false);

  const isOpen = expanded.has(folder.id);
  const renaming = renamingId === folder.id;
  const viewing = panel.folderView === folder.id;
  const urdu = ARABIC_SCRIPT.test(folder.name);
  const children = childFolders(folders, folder.id);
  const folderNotes = notesByFolder.get(folder.id) ?? [];

  const act = (run: () => void) => () => {
    setMenuOpen(false);
    run();
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center rounded-lg transition-colors duration-150",
          rowHeight(urdu),
          viewing ? "bg-selected" : "hover:bg-hover",
        )}
      >
        <button
          type="button"
          onClick={() => toggle(folder.id)}
          aria-label={isOpen ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
          aria-expanded={isOpen}
          className={cn(smallButton, "size-7 text-muted-foreground")}
        >
          <ChevronIcon className={cn("transition-transform duration-150", isOpen && "rotate-90")} />
        </button>

        {renaming ? (
          <RenameInput
            initial={folder.name}
            onDone={(value) => {
              setRenamingId(null);
              if (value !== null) panel.onRename(folder.id, value);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              expand(folder.id);
              panel.onOpenContents(folder.id);
            }}
            aria-current={viewing ? "true" : undefined}
            className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg pe-1 ps-0.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FolderIcon className="text-muted-foreground" />
            <span
              dir="auto"
              lang={urdu ? "ur" : undefined}
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                urdu && "urdu-row",
                viewing ? "text-foreground" : "text-secondary-foreground",
              )}
            >
              {folder.name}
            </span>
          </button>
        )}

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Folder actions: ${folder.name}`}
              className={cn(smallButton, "me-1", hoverReveal, menuOpen && "opacity-100")}
            >
              <DotsIcon />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-52 p-1"
            onCloseAutoFocus={(event) => {
              // Renaming puts focus in the input. Radix must not pull it back to the menu button.
              if (focusInputNext.current) {
                event.preventDefault();
                focusInputNext.current = false;
              }
            }}
          >
            <MenuItem icon={<PlusIcon />} label="New note" onClick={act(() => panel.onNewNoteIn(folder.id))} />
            <MenuItem
              icon={<FolderPlusIcon />}
              label="New subfolder"
              onClick={act(() => {
                expand(folder.id);
                setRenamingId(panel.onNewFolder(folder.id));
              })}
            />
            <MenuItem
              icon={<PencilIcon />}
              label="Rename"
              onClick={act(() => {
                focusInputNext.current = true;
                setRenamingId(folder.id);
              })}
            />
            <MenuItem icon={<MoveIcon />} label="Move to…" onClick={act(() => panel.onMoveFolder(folder.id))} />
            <MenuItem
              icon={<TrashIcon />}
              label="Delete"
              destructive
              onClick={act(() => panel.onDeleteFolder(folder.id))}
            />
          </PopoverContent>
        </Popover>
      </div>

      {isOpen && (
        <ul className="mt-1 ml-3.5 flex flex-col gap-1 border-l border-border pl-1.5">
          <li>
            <button
              type="button"
              onClick={() => panel.onOpenContents(folder.id)}
              aria-current={viewing ? "true" : undefined}
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-start text-sm outline-none transition-colors duration-150 pointer-coarse:h-10 focus-visible:ring-2 focus-visible:ring-ring",
                viewing ? "bg-selected text-foreground" : "text-secondary-foreground hover:bg-hover",
              )}
            >
              <ContentsIcon className="text-muted-foreground" />
              <span className="truncate">Contents</span>
            </button>
          </li>
          {children.map((child) => (
            <FolderNode key={child.id} {...props} folder={child} />
          ))}
          {folderNotes.length > 0 && (
            <li>
              <NoteList
                notes={folderNotes}
                activeId={panel.folderView === null ? activeId : undefined}
                ready
                emptyText={null}
                onPick={props.onPick}
                onDelete={props.onDelete}
                onMove={panel.onMoveNote}
              />
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-start text-sm outline-none transition-colors duration-150 hover:bg-hover focus-visible:bg-hover pointer-coarse:h-11",
        destructive ? "text-destructive" : "text-foreground",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}

/** The "Folders" header and the recursive tree. Expanded folders show Contents first, then sub-folders, then notes. */
export const FolderTree = memo(function FolderTree({ panel, notes, activeId, onPick, onDelete }: FolderTreeProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Expanded ids are remembered between visits. Read after mount so the server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPANDED_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExpanded(new Set(parsed.filter((id): id is string => typeof id === "string")));
      }
    } catch {
      // Ignore a corrupt value.
    }
  }, []);

  const save = useCallback((next: ReadonlySet<string>) => {
    try {
      window.localStorage.setItem(EXPANDED_KEY, JSON.stringify([...next]));
    } catch {
      // Not remembering is fine.
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setExpanded((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        save(next);
        return next;
      });
    },
    [save],
  );

  const expand = useCallback(
    (id: string) => {
      setExpanded((current) => {
        if (current.has(id)) return current;
        const next = new Set(current).add(id);
        save(next);
        return next;
      });
    },
    [save],
  );

  // Open the folders that hold the active note (or the Contents page being shown).
  const foldersRef = useRef(panel.folders);
  const assignmentsRef = useRef(panel.assignments);
  useEffect(() => {
    foldersRef.current = panel.folders;
    assignmentsRef.current = panel.assignments;
  });
  const { folderView } = panel;
  useEffect(() => {
    const target = folderView ?? (activeId ? (assignmentsRef.current[activeId] ?? null) : null);
    if (!target) return;
    const path = folderPath(foldersRef.current, target);
    if (path.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded((current) => {
      if (path.every((folder) => current.has(folder.id))) return current;
      const next = new Set(current);
      for (const folder of path) next.add(folder.id);
      save(next);
      return next;
    });
  }, [activeId, folderView, save]);

  const notesByFolder = useMemo(() => {
    const ids = new Set(panel.folders.map((folder) => folder.id));
    const map = new Map<string, NoteSummary[]>();
    for (const note of notes) {
      const folderId = panel.assignments[note.id];
      if (folderId === undefined || !ids.has(folderId)) continue;
      const list = map.get(folderId);
      if (list) list.push(note);
      else map.set(folderId, [note]);
    }
    return map;
  }, [notes, panel.assignments, panel.folders]);

  const roots = childFolders(panel.folders, null);

  return (
    <div>
      <div className="flex items-center pb-1.5">
        <p className="min-w-0 flex-1 px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground">Folders</p>
        <button
          type="button"
          onClick={() => setRenamingId(panel.onNewFolder(null))}
          disabled={!panel.loaded}
          aria-label="New folder"
          title="New folder"
          className={cn(smallButton, "size-7 me-0.5 disabled:pointer-events-none disabled:opacity-50")}
        >
          <FolderPlusIcon />
        </button>
      </div>

      {roots.length === 0 ? (
        panel.loaded && (
          <p className="px-2.5 pb-2 text-sm leading-6 text-muted-foreground">
            Group notes into folders. Create one with the button above.
          </p>
        )
      ) : (
        <ul className="flex flex-col gap-1">
          {roots.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              panel={panel}
              folders={panel.folders}
              notesByFolder={notesByFolder}
              activeId={activeId}
              expanded={expanded}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              toggle={toggle}
              expand={expand}
              onPick={onPick}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
});
