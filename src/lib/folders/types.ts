export interface Folder {
  id: string;
  name: string;
  /** Null = top level. */
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

/** noteId -> folderId. A note that is missing from the map sits at the top level. */
export type Assignments = Record<string, string>;

export interface FolderData {
  folders: Folder[];
  assignments: Assignments;
}

export const FOLDER_NAME_MAX = 80;
export const DEFAULT_FOLDER_NAME = "New folder";
