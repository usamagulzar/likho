"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { Menu01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { applyFont, applySize, applyTheme } from "@/components/appearance";
import { LogoMark } from "@/components/brand/LogoMark";
import { DeleteNoteDialog } from "@/components/DeleteNoteDialog";
import { DeleteFolderDialog } from "@/components/folders/DeleteFolderDialog";
import { FolderContents } from "@/components/folders/FolderContents";
import type { FolderPanel } from "@/components/folders/FolderTree";
import { MoveDialog, type MoveTarget } from "@/components/folders/MoveDialog";
import { Icon } from "@/components/Icon";
import { NotesSidebar } from "@/components/NotesSidebar";
import { SaveButton } from "@/components/SaveButton";
import { SharePopover, useShareController } from "@/components/share/SharePopover";
import { ThemeButton } from "@/components/ThemeButton";
import { UrduKeyboard } from "@/components/UrduKeyboard";
import { iconButtonClass } from "@/components/styles";
import { WritingPad, type WritingPadHandle } from "@/components/WritingPad";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFolders } from "@/lib/folders/useFolders";
import { site } from "@/lib/site";
import { readUiPrefs, usePrefs } from "@/lib/store/prefs";
import { useNoteStore } from "@/lib/store/useNoteStore";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => undefined;

// Phone top bar buttons: 44px targets (Apple and Material minimum), same look as the desktop icon buttons.
const barButtonClass = cn(iconButtonClass, "size-11");

// False while hydrating (the server snapshot), true afterwards. Lets the sidebar attribute wait for the real prefs.
function useHydrated(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

export function AppShell() {
  const store = useNoteStore();
  const folderModel = useFolders(store.mode, store.notes);
  // The folder whose Contents page is open. Derived, so a deleted folder closes its own page.
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const folderView =
    openFolderId !== null && folderModel.folders.some((folder) => folder.id === openFolderId) ? openFolderId : null;
  const shareController = useShareController(store);
  const { prefs, setPrefs } = usePrefs();
  const hydrated = useHydrated();
  const padRef = useRef<WritingPadHandle>(null);
  const asideRef = useRef<HTMLElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Radix would return focus to the menu button after the sheet closes. After a pick, send it to the pad instead.
  const pickedFromSheet = useRef(false);
  const sidebarOpen = prefs.sidebarOpen;
  const theme = prefs.theme;

  // Callbacks read the latest store through a ref, so they keep their identity and the memoized sidebar skips
  // re-rendering while the pad types.
  const storeRef = useRef(store);
  const folderModelRef = useRef(folderModel);
  const folderViewRef = useRef(folderView);
  useLayoutEffect(() => {
    storeRef.current = store;
    folderModelRef.current = folderModel;
    folderViewRef.current = folderView;
  });

  const focusPad = useCallback(() => padRef.current?.focusNote(), []);

  // Where a new note goes: the folder whose Contents page is open, otherwise the folder of the open note.
  const currentFolderTarget = useCallback((): string | null => {
    if (folderViewRef.current !== null) return folderViewRef.current;
    const activeId = storeRef.current.activeNote?.id;
    return activeId ? folderModelRef.current.folderOf(activeId) : null;
  }, []);

  // Creates a note and files it. The target is worked out before create(), because create() changes the active note.
  // flushSync: the pad must show the new note (and leave the Contents page) before anything reads the new id.
  const createNoteIn = useCallback((target: string | null) => {
    flushSync(() => {
      storeRef.current.create();
      setOpenFolderId(null);
    });
    const id = storeRef.current.activeNote?.id;
    if (id && target !== null) folderModelRef.current.assignNote(id, target);
  }, []);

  const newNote = useCallback(() => {
    createNoteIn(currentFolderTarget());
    focusPad();
  }, [createNoteIn, currentFolderTarget, focusPad]);

  const newNoteInFolder = useCallback(
    (folderId: string) => {
      createNoteIn(folderId);
      focusPad();
    },
    [createNoteIn, focusPad],
  );

  const pickNote = useCallback(
    (id: string) => {
      flushSync(() => {
        storeRef.current.select(id);
        setOpenFolderId(null);
      });
      focusPad();
    },
    [focusPad],
  );

  // Deleting asks first. The dialog holds the note until the user answers.
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const deleteNote = useCallback((id: string) => {
    const note = storeRef.current.notes.find((candidate) => candidate.id === id);
    setPendingDelete({ id, title: note?.title ?? "Untitled note" });
  }, []);

  const confirmDelete = useCallback((id: string) => {
    setPendingDelete(null);
    storeRef.current.remove(id);
    toast("Note deleted", {
      action: { label: "Undo", onClick: () => storeRef.current.restore(id) },
    });
  }, []);

  // Same actions from the mobile sheet: close it first, then the pad takes focus once it has closed.
  const newNoteFromSheet = useCallback(() => {
    pickedFromSheet.current = true;
    createNoteIn(currentFolderTarget());
    setSheetOpen(false);
  }, [createNoteIn, currentFolderTarget]);

  const newNoteInFolderFromSheet = useCallback(
    (folderId: string) => {
      pickedFromSheet.current = true;
      createNoteIn(folderId);
      setSheetOpen(false);
    },
    [createNoteIn],
  );

  const pickNoteFromSheet = useCallback((id: string) => {
    pickedFromSheet.current = true;
    flushSync(() => {
      storeRef.current.select(id);
      setOpenFolderId(null);
    });
    setSheetOpen(false);
  }, []);

  const openContentsFromSheet = useCallback((id: string) => {
    setOpenFolderId(id);
    setSheetOpen(false);
  }, []);

  // ---- folder dialogs and the panel props for the two sidebars ----

  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [pendingFolderDelete, setPendingFolderDelete] = useState<{ id: string; name: string } | null>(null);

  const moveNote = useCallback((noteId: string) => {
    const note = storeRef.current.notes.find((candidate) => candidate.id === noteId);
    setMoveTarget({
      kind: "note",
      id: noteId,
      title: note?.title ?? "Untitled note",
      currentParentId: folderModelRef.current.folderOf(noteId),
    });
  }, []);

  const moveFolder = useCallback((folderId: string) => {
    const folder = folderModelRef.current.folders.find((candidate) => candidate.id === folderId);
    if (!folder) return;
    setMoveTarget({ kind: "folder", id: folderId, title: folder.name, currentParentId: folder.parentId });
  }, []);

  const confirmMove = useCallback((target: MoveTarget, parentId: string | null) => {
    setMoveTarget(null);
    if (target.kind === "note") {
      folderModelRef.current.assignNote(target.id, parentId);
    } else if (!folderModelRef.current.moveFolder(target.id, parentId)) {
      toast.error("A folder can't be moved into itself.");
    }
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    const folder = folderModelRef.current.folders.find((candidate) => candidate.id === folderId);
    if (folder) setPendingFolderDelete({ id: folder.id, name: folder.name });
  }, []);

  const confirmFolderDelete = useCallback((id: string) => {
    setPendingFolderDelete(null);
    folderModelRef.current.deleteFolder(id);
  }, []);

  const newFolder = useCallback((parentId: string | null) => folderModelRef.current.createFolder("", parentId), []);
  const renameFolder = useCallback((id: string, name: string) => folderModelRef.current.renameFolder(id, name), []);

  const desktopPanel = useMemo<FolderPanel>(
    () => ({
      folders: folderModel.folders,
      assignments: folderModel.assignments,
      loaded: folderModel.loaded,
      folderView,
      onOpenContents: setOpenFolderId,
      onNewNoteIn: newNoteInFolder,
      onNewFolder: newFolder,
      onRename: renameFolder,
      onMoveFolder: moveFolder,
      onMoveNote: moveNote,
      onDeleteFolder: deleteFolder,
    }),
    [folderModel.folders, folderModel.assignments, folderModel.loaded, folderView, newNoteInFolder, newFolder, renameFolder, moveFolder, moveNote, deleteFolder],
  );

  // Same panel for the mobile drawer, except that opening a folder or a new note also closes the drawer.
  const sheetPanel = useMemo<FolderPanel>(
    () => ({ ...desktopPanel, onOpenContents: openContentsFromSheet, onNewNoteIn: newNoteInFolderFromSheet }),
    [desktopPanel, openContentsFromSheet, newNoteInFolderFromSheet],
  );

  const toggleSidebar = useCallback(() => {
    setPrefs((current) => ({ ...current, sidebarOpen: !current.sidebarOpen }));
  }, [setPrefs]);

  // The browser chrome (Android task switcher, iOS standalone status bar) follows the theme the user picked in the
  // app. The Next viewport metadata emits one light theme-color tag; this effect swaps its colour for dark.
  useEffect(() => {
    if (!hydrated) return;
    const color = theme === "dark" ? site.colors.dark : site.colors.light;
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.removeAttribute("media");
      meta.content = color;
    });
  }, [hydrated, theme]);

  // Drives the desktop sidebar width (see .sb-aside in globals.css). Layout effect, so it lands before paint.
  // Skipped during hydration: the server snapshot would wrongly say "open" and animate the sidebar on load.
  useLayoutEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.sidebar = sidebarOpen ? "open" : "collapsed";

    // A collapsed sidebar hides its labels. If focus was on one of them, move it to the toggle that stays visible.
    const aside = asideRef.current;
    const active = document.activeElement;
    if (
      !sidebarOpen &&
      aside &&
      active instanceof HTMLElement &&
      aside.contains(active) &&
      !active.matches('[aria-controls="notes-sidebar"]')
    ) {
      aside.querySelector<HTMLElement>('[aria-controls="notes-sidebar"]')?.focus();
    }
  }, [hydrated, sidebarOpen]);

  // Next.js can keep the editor DOM hidden after navigation. Release the lock when its layout effects are disconnected.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("editor-scroll-lock");
    return () => root.classList.remove("editor-scroll-lock");
  }, []);

  // Another tab changed the appearance. Read storage directly so this never runs against the server snapshot.
  useEffect(() => {
    const onStorage = () => {
      const current = readUiPrefs();
      applyTheme(current.theme);
      applyFont(current.font);
      applySize(current.size);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // When the viewport shrinks (on-screen keyboard, rotation), the pad keeps its scroll position and the caret can fall
  // below the new bottom edge. Bring the caret back into view inside the pad.
  useEffect(() => {
    let frame = 0;
    const keepCaretVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = window.getSelection()?.focusNode;
        const el = node instanceof Element ? node : node?.parentElement;
        if (el?.closest(".shell-main")) el.scrollIntoView({ block: "nearest" });
      });
    };
    const vv = window.visualViewport;
    window.addEventListener("resize", keepCaretVisible);
    vv?.addEventListener("resize", keepCaretVisible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", keepCaretVisible);
      vv?.removeEventListener("resize", keepCaretVisible);
    };
  }, []);

  // Mod+Shift+O starts a new note, in both modes. Mod+B shows or hides the sidebar.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey) return;
      const key = event.key.toLowerCase();
      if (event.shiftKey && key === "o") {
        event.preventDefault();
        newNote();
      } else if (!event.shiftKey && key === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newNote, toggleSidebar]);

  return (
    <div className="shell-root flex bg-canvas text-foreground">
      <UrduKeyboard />
      {/* One element for both widths. Its width animates; the tree inside never changes. Desktop-class screens only. */}
      <aside
        ref={asideRef}
        id="notes-sidebar"
        className="sb-aside shell-desk-only shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar"
      >
        <NotesSidebar
          notes={store.notes}
          activeId={store.activeNote?.id}
          ready={store.ready}
          onNewNote={newNote}
          onPick={pickNote}
          onDelete={deleteNote}
          panel={desktopPanel}
          onToggle={toggleSidebar}
          open={sidebarOpen}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar. The pad scrolls underneath, so the bar stays put without sticky positioning. */}
        <header className="shell-phone-only shrink-0 flex-col border-b border-border bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="flex h-14 items-center gap-1 pr-2 pl-1 landscape:h-12">
            <button type="button" onClick={() => setSheetOpen(true)} aria-label="Open notes" className={barButtonClass}>
              <Icon icon={Menu01Icon} />
            </button>
            <ThemeButton className={barButtonClass} />
            <span className="flex min-w-0 flex-1 items-center gap-2 pl-0.5 text-[15px] font-semibold tracking-[-0.01em] text-foreground select-none">
              <LogoMark size={24} tile="var(--logo-tile)" className="shrink-0" />
              <span className="truncate">Likho</span>
            </span>
            {folderView === null && (
              <>
                <SaveButton store={store} compact />
                <SharePopover store={store} controller={shareController} compact />
              </>
            )}
            <button type="button" onClick={newNote} aria-label="New note" className={cn(barButtonClass, "text-brand")}>
              <Icon icon={PencilEdit02Icon} />
            </button>
          </div>
        </header>

        <main className="shell-main">
          {folderView !== null ? (
            <FolderContents
              folderId={folderView}
              folders={folderModel.folders}
              assignments={folderModel.assignments}
              notes={store.notes}
              onOpenFolder={setOpenFolderId}
              onOpenNote={pickNote}
              onNewNote={newNoteInFolder}
              onNewSubfolder={(parentId) => {
                folderModel.createFolder("", parentId);
              }}
              onClose={() => setOpenFolderId(null)}
            />
          ) : (
            <WritingPad store={store} handleRef={padRef} shareController={shareController} />
          )}
        </main>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          onSwipeClose={() => setSheetOpen(false)}
          onCloseAutoFocus={(event) => {
            if (!pickedFromSheet.current) return;
            event.preventDefault();
            pickedFromSheet.current = false;
            focusPad();
          }}
          className="gap-0 bg-sidebar p-0"
        >
          <SheetHeader className="sr-only">
            <SheetDescription>Your notes. Pick one to open it.</SheetDescription>
          </SheetHeader>
          {/* The theme toggle is also available while the drawer is open. */}
          <div className="flex h-12 shrink-0 items-center gap-1 pr-2.5 pl-4">
            <SheetTitle className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] select-none">
              <LogoMark size={24} tile="var(--logo-tile)" className="shrink-0" />
              <span className="truncate">Likho</span>
            </SheetTitle>
            <ThemeButton />
          </div>
          <NotesSidebar
            notes={store.notes}
            activeId={store.activeNote?.id}
            ready={store.ready}
            onNewNote={newNoteFromSheet}
            onPick={pickNoteFromSheet}
            onDelete={deleteNote}
            panel={sheetPanel}
          />
        </SheetContent>
      </Sheet>
      <DeleteNoteDialog note={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
      <MoveDialog
        target={moveTarget}
        folders={folderModel.folders}
        onCancel={() => setMoveTarget(null)}
        onConfirm={confirmMove}
      />
      <DeleteFolderDialog
        folder={pendingFolderDelete}
        onCancel={() => setPendingFolderDelete(null)}
        onConfirm={confirmFolderDelete}
      />
    </div>
  );
}

