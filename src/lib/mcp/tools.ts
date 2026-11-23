import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { hasScope, type TokenScope } from "@/lib/tokens";
import {
  appendToNote,
  createNote,
  deleteNote,
  getNote,
  listNotes,
  restoreNote,
  searchNotes,
  updateNote,
} from "./notesRepo";
import {
  hasValidTitle,
  isUuid,
  joinNoteContent,
  MAX_NOTE_CONTENT_BYTES,
  splitNoteContent,
  utf8ByteLength,
} from "./text";

const READ_ANNOTATIONS = { readOnlyHint: true, destructiveHint: false, idempotentHint: true };
const CREATE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const DELETE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: true, idempotentHint: true };
const RESTORE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

class ToolDomainError extends Error {}

function successResult(data: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: data };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    structuredContent: { error: message },
    isError: true,
  };
}

async function safeSuccess(run: () => Promise<Record<string, unknown>>) {
  try {
    return successResult(await run());
  } catch (error) {
    if (error instanceof ToolDomainError) return errorResult(error.message);
    return errorResult("Unable to complete this notes request.");
  }
}

function scopeError(scopes: TokenScope[], needed: TokenScope, origin: string): string | null {
  if (hasScope(scopes, needed)) return null;
  return `This token is read-only. Create a read & write token at ${origin}/connect.`;
}

function validateId(id: string): string | null {
  return isUuid(id) ? null : "Note not found";
}

function validateTitle(title: string): string | null {
  return hasValidTitle(title) ? null : "Title must be 200 characters or fewer and cannot contain newlines.";
}

function tooLarge(): string {
  return "Note too large (limit 1 MiB)";
}

export function registerNoteTools(server: McpServer, context: { userId: string; scopes: TokenScope[]; origin: string }) {
  server.registerTool(
    "list_notes",
    {
      description: "List this account's notes, newest updated first.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        include_deleted: z.boolean().optional().default(false),
      },
      annotations: READ_ANNOTATIONS,
    },
    async ({ limit, offset, include_deleted }) => {
      const denied = scopeError(context.scopes, "read", context.origin);
      if (denied) return errorResult(denied);
      return safeSuccess(() => listNotes(context.userId, limit, offset, include_deleted));
    },
  );

  server.registerTool(
    "search_notes",
    {
      description: "Search this account's active notes with a case-insensitive substring query.",
      inputSchema: { query: z.string(), limit: z.number().int().min(1).max(100).optional().default(20) },
      annotations: READ_ANNOTATIONS,
    },
    async ({ query, limit }) => {
      const denied = scopeError(context.scopes, "read", context.origin);
      if (denied) return errorResult(denied);
      if (query.length < 1 || query.length > 200) return errorResult("Query must be 1–200 characters.");
      return safeSuccess(() => searchNotes(context.userId, query, limit));
    },
  );

  server.registerTool(
    "get_note",
    {
      description: "Read one of this account's notes, including a soft-deleted note.",
      inputSchema: { id: z.string().describe("Note UUID") },
      annotations: READ_ANNOTATIONS,
    },
    async ({ id }) => {
      const denied = scopeError(context.scopes, "read", context.origin);
      if (denied) return errorResult(denied);
      const idError = validateId(id);
      if (idError) return errorResult(idError);
      return safeSuccess(async () => {
        const row = await getNote(context.userId, id);
        if (!row) throw new ToolDomainError("Note not found");
        const { title, body } = splitNoteContent(row.content);
        return {
          id: row.id,
          title,
          body,
          content: row.content,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString(),
          deleted: row.deleted,
        };
      });
    },
  );

  server.registerTool(
    "create_note",
    {
      description: "Create a note with a first-line title and Markdown-capable body.",
      inputSchema: { title: z.string().optional(), body: z.string() },
      annotations: CREATE_ANNOTATIONS,
    },
    async ({ title: requestedTitle, body }) => {
      const denied = scopeError(context.scopes, "write", context.origin);
      if (denied) return errorResult(denied);
      const firstLine = body.split("\n", 1)[0]?.replace(/\r$/, "") ?? "";
      const title = requestedTitle ?? (firstLine ? firstLine.slice(0, 60) : "Untitled note");
      const titleError = validateTitle(title);
      if (titleError) return errorResult(titleError);
      if (utf8ByteLength(joinNoteContent(title, body)) > MAX_NOTE_CONTENT_BYTES) return errorResult(tooLarge());

      return safeSuccess(async () => {
        const row = await createNote(context.userId, title, body);
        return {
          id: row.id,
          title,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString(),
        };
      });
    },
  );

  server.registerTool(
    "update_note",
    {
      description: "Replace a note's title, body, or both while preserving any omitted part.",
      inputSchema: { id: z.string().describe("Note UUID"), title: z.string().optional(), body: z.string().optional() },
      annotations: UPDATE_ANNOTATIONS,
    },
    async ({ id, title, body }) => {
      const denied = scopeError(context.scopes, "write", context.origin);
      if (denied) return errorResult(denied);
      const idError = validateId(id);
      if (idError) return errorResult(idError);
      if (title === undefined && body === undefined) return errorResult("Provide a title or body to update.");
      if (title !== undefined) {
        const titleError = validateTitle(title);
        if (titleError) return errorResult(titleError);
      }

      return safeSuccess(async () => {
        const existing = await getNote(context.userId, id);
        if (!existing || existing.deleted) throw new ToolDomainError("Note not found");
        const previous = splitNoteContent(existing.content);
        const nextTitle = title ?? previous.title;
        const nextBody = body ?? previous.body;
        if (utf8ByteLength(joinNoteContent(nextTitle, nextBody)) > MAX_NOTE_CONTENT_BYTES) {
          throw new ToolDomainError(tooLarge());
        }

        const row = await updateNote(context.userId, id, { title, body });
        if (!row) throw new ToolDomainError("Note not found");
        return { id: row.id, title: nextTitle, updated_at: row.updatedAt.toISOString() };
      });
    },
  );

  server.registerTool(
    "append_to_note",
    {
      description: "Append text to a note's body using the requested separator.",
      inputSchema: {
        id: z.string().describe("Note UUID"),
        text: z.string(),
        separator: z.enum(["newline", "blank_line", "space"]).optional().default("newline"),
      },
      annotations: UPDATE_ANNOTATIONS,
    },
    async ({ id, text, separator }) => {
      const denied = scopeError(context.scopes, "write", context.origin);
      if (denied) return errorResult(denied);
      const idError = validateId(id);
      if (idError) return errorResult(idError);

      return safeSuccess(async () => {
        const existing = await getNote(context.userId, id);
        if (!existing || existing.deleted) throw new ToolDomainError("Note not found");
        const { title, body } = splitNoteContent(existing.content);
        const separatorText = separator === "blank_line" ? "\n\n" : separator === "space" ? " " : "\n";
        const nextBody = body.length === 0 || text.length === 0 ? `${body}${text}` : `${body}${separatorText}${text}`;
        if (utf8ByteLength(joinNoteContent(title, nextBody)) > MAX_NOTE_CONTENT_BYTES) {
          throw new ToolDomainError(tooLarge());
        }

        const result = await appendToNote(context.userId, id, text, separator);
        if (!result) throw new ToolDomainError("Note not found");
        return {
          id: result.row.id,
          title,
          updated_at: result.row.updatedAt.toISOString(),
          appended_chars: result.appendedChars,
        };
      });
    },
  );

  server.registerTool(
    "delete_note",
    {
      description: "Soft-delete a note. Call restore_note with the returned id to undo.",
      inputSchema: { id: z.string().describe("Note UUID") },
      annotations: DELETE_ANNOTATIONS,
    },
    async ({ id }) => {
      const denied = scopeError(context.scopes, "write", context.origin);
      if (denied) return errorResult(denied);
      const idError = validateId(id);
      if (idError) return errorResult(idError);
      return safeSuccess(async () => {
        const deletedId = await deleteNote(context.userId, id);
        if (!deletedId) throw new ToolDomainError("Note not found");
        return { id: deletedId, deleted: true, undo: "call restore_note with this id" };
      });
    },
  );

  server.registerTool(
    "restore_note",
    {
      description: "Restore a soft-deleted note.",
      inputSchema: { id: z.string().describe("Note UUID") },
      annotations: RESTORE_ANNOTATIONS,
    },
    async ({ id }) => {
      const denied = scopeError(context.scopes, "write", context.origin);
      if (denied) return errorResult(denied);
      const idError = validateId(id);
      if (idError) return errorResult(idError);
      return safeSuccess(async () => {
        const restoredId = await restoreNote(context.userId, id);
        if (!restoredId) throw new ToolDomainError("Note not found");
        return { id: restoredId, deleted: false };
      });
    },
  );
}
