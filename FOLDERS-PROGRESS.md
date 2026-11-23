# Likho folders: progress and next steps

Goal: nested folders in the left panel (like Claude Projects). Every folder has an auto-generated "Contents" page listing its notes and sub-folders. Works for guest (local) and account (database) notes.

## Design (unchanged)
- Nested folders; a note is in one folder or at the top level.
- Contents is virtual: built from the folder's current notes and sub-folders, nothing stored.
- Deleting a folder deletes nothing: notes and sub-folders move up one level.
- Folder state is a separate layer from the notes store (`useFolders`); `cloudSession` / `useNoteStore` are untouched.
  - Guest: localStorage `likho:folders:v1`. Account: `/api/folders`, `PUT /api/notes/:id/folder` (does not touch updated_at).
  - Account note moves for notes not yet in the database wait in `likho:folders:pending:<userId>` and are sent once the note is saved.
- New notes go into the current folder (open note's folder, or the folder whose Contents is showing).

## Done (rebuilt, in likho-folders.zip)
Schema (`folders` table, `notes.folder_id`), folder API routes, `lib/folders/{types,tree,api,useFolders}`, `components/folders/{FolderIcons,FolderTree,MoveDialog,DeleteFolderDialog,FolderContents}`, patched `NoteList` (onMove, emptyText), `NotesSidebar` (Folders tree + unfiled Notes), `AppShell` (folder state, dialogs, Contents view, new note in folder).

## Still to do
1. Run `pnpm exec drizzle-kit push` (needs DATABASE_URL), then `pnpm typecheck` and `pnpm lint`. The code was NOT type-checked or run (no dependencies in the sandbox).
2. Test: guest mode, account mode (move a note, then save it), nested move + loop prevention, delete folder (children move up), Urdu folder names, mobile drawer.
3. Optional later: drag and drop, guest-to-account folder migration (`migrateGuest.ts`), Contents inside search, rename from the Contents page.

## Earlier work still to redo (see context-urdu.md)
Kasheeda `size-adjust` 125% and font file, bold Urdu fix, corrected Urdu keymap (U types hamza-yeh), live keyboard layout panel, English | Urdu toggle in the notebook.
