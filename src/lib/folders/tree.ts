import { DEFAULT_FOLDER_NAME, FOLDER_NAME_MAX, type Assignments, type Folder, type FolderData } from "./types";

export const EMPTY_FOLDER_DATA: FolderData = { folders: [], assignments: {} };

/** Collapses whitespace, trims, and cuts to the name limit. May return an empty string. */
export function cleanFolderName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, FOLDER_NAME_MAX);
}

export function folderNameOrDefault(raw: string): string {
  return cleanFolderName(raw) || DEFAULT_FOLDER_NAME;
}

function byName(left: Folder, right: Folder): number {
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true });
}

/** Direct sub-folders of `parentId` (null = top level), sorted by name. */
export function childFolders(folders: readonly Folder[], parentId: string | null): Folder[] {
  return folders.filter((folder) => folder.parentId === parentId).sort(byName);
}

/** The folder's own id plus the ids of every folder below it. */
export function subtreeIds(folders: readonly Folder[], rootId: string): Set<string> {
  const result = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const folder of folders) {
      if (folder.parentId !== null && result.has(folder.parentId) && !result.has(folder.id)) {
        result.add(folder.id);
        grew = true;
      }
    }
  }
  return result;
}

/** Folders from the top level down to `id`, inclusive. Empty when the id is unknown. */
export function folderPath(folders: readonly Folder[], id: string | null): Folder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: Folder[] = [];
  const seen = new Set<string>();
  let current = id !== null ? byId.get(id) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId !== null ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export interface PickerEntry {
  id: string;
  name: string;
  depth: number;
}

/** Depth-first list for a "Move to" picker. Folders in `exclude` (and everything below them) are left out. */
export function pickerEntries(folders: readonly Folder[], exclude?: ReadonlySet<string>): PickerEntry[] {
  const out: PickerEntry[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const folder of childFolders(folders, parentId)) {
      if (exclude?.has(folder.id)) continue;
      out.push({ id: folder.id, name: folder.name, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Ids of the notes whose assignment is exactly `folderId`. */
export function noteIdsIn(assignments: Assignments, folderId: string): string[] {
  return Object.keys(assignments).filter((noteId) => assignments[noteId] === folderId);
}

/** Turns anything read from storage or the network into valid folder data: no dangling parents, no cycles. */
export function sanitizeFolderData(raw: unknown, now = Date.now()): FolderData {
  if (typeof raw !== "object" || raw === null) return EMPTY_FOLDER_DATA;
  const input = raw as { folders?: unknown; assignments?: unknown };

  const folders: Folder[] = [];
  const seen = new Set<string>();
  if (Array.isArray(input.folders)) {
    for (const item of input.folders) {
      if (typeof item !== "object" || item === null) continue;
      const f = item as Record<string, unknown>;
      if (typeof f.id !== "string" || !f.id || seen.has(f.id)) continue;
      const name = typeof f.name === "string" ? cleanFolderName(f.name) : "";
      seen.add(f.id);
      folders.push({
        id: f.id,
        name: name || DEFAULT_FOLDER_NAME,
        parentId: typeof f.parentId === "string" && f.parentId !== f.id ? f.parentId : null,
        createdAt: typeof f.createdAt === "number" ? f.createdAt : now,
        updatedAt: typeof f.updatedAt === "number" ? f.updatedAt : now,
      });
    }
  }

  const ids = new Set(folders.map((folder) => folder.id));
  for (const folder of folders) {
    if (folder.parentId !== null && !ids.has(folder.parentId)) folder.parentId = null;
  }
  // Break cycles: a folder whose ancestors lead back to itself goes to the top level.
  const parentOf = new Map(folders.map((folder) => [folder.id, folder.parentId]));
  for (const folder of folders) {
    const visited = new Set<string>([folder.id]);
    let current = folder.parentId;
    while (current !== null) {
      if (visited.has(current)) {
        folder.parentId = null;
        parentOf.set(folder.id, null);
        break;
      }
      visited.add(current);
      current = parentOf.get(current) ?? null;
    }
  }

  const assignments: Assignments = {};
  if (typeof input.assignments === "object" && input.assignments !== null) {
    for (const [noteId, folderId] of Object.entries(input.assignments)) {
      if (typeof folderId === "string" && ids.has(folderId)) assignments[noteId] = folderId;
    }
  }

  return { folders, assignments };
}
