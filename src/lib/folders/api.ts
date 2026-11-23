import { sanitizeFolderData } from "./tree";
import type { FolderData } from "./types";

export class FoldersApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FoldersApiError";
    this.status = status;
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new FoldersApiError(0, "Network error.");
  }
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
    } catch {
      // Not JSON: keep the generic message.
    }
    throw new FoldersApiError(response.status, message);
  }
  return response;
}

export async function fetchFolderData(): Promise<FolderData> {
  const response = await call("/api/folders");
  return sanitizeFolderData(await response.json());
}

/** Creates the folder if the id is new, otherwise renames and/or moves it. */
export async function saveFolder(
  id: string,
  body: { name?: string; parentId?: string | null },
): Promise<void> {
  await call(`/api/folders/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteFolderRemote(id: string): Promise<void> {
  await call(`/api/folders/${id}`, { method: "DELETE" });
}

/** Moves a note into a folder (null = top level). Throws a 404 error for a note that is not in the database yet. */
export async function placeNote(noteId: string, folderId: string | null): Promise<void> {
  await call(`/api/notes/${noteId}/folder`, { method: "PUT", body: JSON.stringify({ folderId }) });
}
