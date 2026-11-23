import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@/db";
import { folders } from "@/db/schema";
import { FOLDER_NAME_MAX, type Folder } from "@/lib/folders/types";

import { apiError } from "../notes/_shared";

export { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "../notes/_shared";

const MAX_BODY_BYTES = 4_096;

export const folderIdSchema = z.string().uuid();

const folderName = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .refine((value) => value.length > 0 && value.length <= FOLDER_NAME_MAX, "Invalid folder name.");

export const folderBodySchema = z.object({
  name: folderName.optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const noteFolderBodySchema = z.object({
  folderId: z.string().uuid().nullable(),
});

export function toApiFolder(row: typeof folders.$inferSelect): Folder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

/** Reads a small JSON body and validates it. Folder bodies are tiny, so the cap is 4 KiB. */
export async function readSmallJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { ok: false, response: apiError(415, "Content-Type must be application/json.") };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: apiError(400, "Could not read the request body.") };
  }
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { ok: false, response: apiError(413, "Request body is too large.") };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    return { ok: false, response: apiError(400, "Request body must contain valid JSON.") };
  }

  const result = schema.safeParse(decoded);
  if (!result.success) return { ok: false, response: apiError(400, "Invalid request.") };
  return { ok: true, data: result.data };
}

/** True when the folder exists and belongs to the user. */
export async function ownsFolder(database: Database, userId: string, id: string): Promise<boolean> {
  const [row] = await database
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)))
    .limit(1);
  return Boolean(row);
}

/** True when moving `folderId` under `newParentId` would make a folder its own ancestor. */
export async function wouldCreateLoop(
  database: Database,
  userId: string,
  folderId: string,
  newParentId: string | null,
): Promise<boolean> {
  if (newParentId === null) return false;
  if (newParentId === folderId) return true;

  const rows = await database
    .select({ id: folders.id, parentId: folders.parentId })
    .from(folders)
    .where(eq(folders.userId, userId));
  const parentOf = new Map(rows.map((row) => [row.id, row.parentId]));

  let current: string | null = newParentId;
  for (let steps = 0; current !== null && steps <= rows.length; steps += 1) {
    if (current === folderId) return true;
    current = parentOf.get(current) ?? null;
  }
  return false;
}
