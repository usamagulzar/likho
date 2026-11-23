# Likho - context bundle: nested Folders feature

Read FOLDERS-PROGRESS.md first. The folder files listed there as done were lost, so they must be rebuilt. If they exist below, they are the recovered copies.


## FOLDERS-PROGRESS.md

```markdown
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

```

## AGENTS.md

```markdown
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

```

## package.json

```json
{
  "name": "likho",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@better-auth/drizzle-adapter": "^1.7.27",
    "@codemirror/commands": "^6.11.1",
    "@codemirror/lang-markdown": "^6.5.2",
    "@codemirror/language": "6.13.1",
    "@codemirror/language-data": "^6.5.2",
    "@codemirror/search": "^6.7.2",
    "@codemirror/state": "^6.7.6",
    "@codemirror/view": "^6.43.15",
    "@hugeicons/core-free-icons": "^4.4.0",
    "@hugeicons/react": "^1.1.10",
    "@lezer/common": "1.5.6",
    "@lezer/highlight": "^1.2.5",
    "@modelcontextprotocol/sdk": "^1.32.2",
    "@neondatabase/serverless": "1.2.1",
    "@uiw/react-codemirror": "^4.25.12",
    "@vercel/analytics": "^2.0.1",
    "better-auth": "^1.7.27",
    "class-variance-authority": "^0.7.1",
    "clsx": "2.1.1",
    "cmdk": "^1.1.1",
    "drizzle-orm": "0.45.4",
    "lucide-react": "^1.77.0",
    "mehr": "2.0.1",
    "motion": "^14.14.0",
    "next": "16.4.6",
    "next-themes": "^0.4.6",
    "nodemailer": "^10.6.1",
    "radix-ui": "^1.8.1",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-markdown": "10.1.0",
    "remark-gfm": "4.0.1",
    "sonner": "^2.0.8",
    "tailwind-merge": "^3.7.1",
    "turndown": "^7.2.5",
    "turndown-plugin-gfm": "^1.0.2",
    "tw-animate-css": "^1.4.0",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@tailwindcss/turbopack": "4.3.3",
    "@types/node": "^20",
    "@types/nodemailer": "^8.0.2",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/turndown": "^5.0.6",
    "drizzle-kit": "0.31.11",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.6",
    "tailwindcss": "4.3.3",
    "typescript": "^5"
  },
  "packageManager": "pnpm@10.34.9"
}

```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

## drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});

```

## src/db/schema.ts

```typescript
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    scopes: text("scopes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [index("api_tokens_user_id_created_at_idx").on(table.userId, table.createdAt)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(user, {
    fields: [apiTokens.userId],
    references: [user.id],
  }),
}));

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Null = top level. The API moves children up before a folder is deleted, so set null is only a safety net.
    parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("folders_userId_idx").on(table.userId)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  },
  (table) => [
    index("notes_userId_updatedAt_idx").on(table.userId, table.updatedAt),
    index("notes_folderId_idx").on(table.folderId),
  ],
);

export const noteShares = pgTable(
  "note_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("note_shares_note_id_idx").on(table.noteId),
    uniqueIndex("note_shares_active_note_unique")
      .on(table.noteId)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiTokens: many(apiTokens),
  noteShares: many(noteShares),
  folders: many(folders),
}));

export const foldersRelations = relations(folders, ({ one }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  noteShares: many(noteShares),
}));

export const noteSharesRelations = relations(noteShares, ({ one }) => ({
  note: one(notes, {
    fields: [noteShares.noteId],
    references: [notes.id],
  }),
  user: one(user, {
    fields: [noteShares.userId],
    references: [user.id],
  }),
}));


```

## src/db/index.ts

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDatabase(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;

export function getDb(): Database | null {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  database = createDatabase(databaseUrl);
  return database;
}

```

## src/lib/folders/api.ts

```typescript
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

```

## src/lib/folders/tree.ts

```typescript
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

```

## src/lib/folders/types.ts

```typescript
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

```

## src/lib/folders/useFolders.ts

```typescript
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { createClientId } from "@/lib/store/logic";
import type { NoteSummary } from "@/lib/types";

import { deleteFolderRemote, fetchFolderData, placeNote, saveFolder } from "./api";
import {
  EMPTY_FOLDER_DATA,
  cleanFolderName,
  folderNameOrDefault,
  sanitizeFolderData,
  subtreeIds,
} from "./tree";
import type { Assignments, Folder, FolderData } from "./types";

const GUEST_KEY = "likho:folders:v1";
const pendingKey = (userId: string) => `likho:folders:pending:${userId}`;
const MAX_PENDING = 500;

/** noteId -> folder id, or null for "move to the top level". Waits for the note to be saved to the database. */
type Pending = Record<string, string | null>;

export interface FolderModel {
  folders: Folder[];
  assignments: Assignments;
  /** False until the folders have been read (storage for guests, the server for accounts). */
  loaded: boolean;
  folderOf: (noteId: string) => string | null;
  /** Returns the new folder's id. */
  createFolder: (name: string, parentId: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  /** Returns false when the move is not allowed (into itself or one of its own sub-folders). */
  moveFolder: (id: string, parentId: string | null) => boolean;
  /** Deletes the folder only. Its notes and sub-folders move up one level. */
  deleteFolder: (id: string) => void;
  assignNote: (noteId: string, folderId: string | null) => void;
}

interface State {
  scope: string;
  data: FolderData;
  loaded: boolean;
}

function readGuest(): FolderData {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? sanitizeFolderData(JSON.parse(raw)) : EMPTY_FOLDER_DATA;
  } catch {
    return EMPTY_FOLDER_DATA;
  }
}

function writeGuest(data: FolderData): void {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(data));
  } catch {
    toast.error("Couldn't save folders on this device.");
  }
}

function readPending(userId: string): Pending {
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Pending = {};
    for (const [noteId, folderId] of Object.entries(parsed)) {
      if (folderId === null || typeof folderId === "string") out[noteId] = folderId;
    }
    return out;
  } catch {
    return {};
  }
}

function writePending(userId: string, pending: Pending): void {
  try {
    const keys = Object.keys(pending);
    if (keys.length === 0) window.localStorage.removeItem(pendingKey(userId));
    else window.localStorage.setItem(pendingKey(userId), JSON.stringify(pending));
  } catch {
    // The pending list is a convenience. Losing it only means a note stays at the top level on the server.
  }
}

/** Layers not-yet-synced note moves over what the server returned. */
function withPending(data: FolderData, pending: Pending): FolderData {
  const keys = Object.keys(pending);
  if (keys.length === 0) return data;
  const ids = new Set(data.folders.map((folder) => folder.id));
  const assignments = { ...data.assignments };
  for (const noteId of keys) {
    const folderId = pending[noteId];
    if (folderId !== null && ids.has(folderId)) assignments[noteId] = folderId;
    else delete assignments[noteId];
  }
  return { folders: data.folders, assignments };
}

/**
 * Folder state, kept apart from the notes store.
 * Guest: localStorage. Account: the /api/folders routes, with optimistic updates and one request queue so a parent
 * folder always exists before its child. Note moves for notes that are not in the database yet wait in `pending`.
 */
export function useFolders(mode: "guest" | "account", notes: NoteSummary[]): FolderModel {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const accountUserId = mode === "account" ? userId : null;
  const scope = accountUserId ? `account:${accountUserId}` : "guest";

  const [state, setState] = useState<State>({ scope: "", data: EMPTY_FOLDER_DATA, loaded: false });

  const scopeRef = useRef(scope);
  const dataRef = useRef<FolderData>(EMPTY_FOLDER_DATA);
  const pendingRef = useRef<Pending>({});
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const flushingRef = useRef(new Set<string>());
  const notesRef = useRef(notes);
  const loadedRef = useRef(false);

  useEffect(() => {
    notesRef.current = notes;
  });

  const enqueue = useCallback((task: () => Promise<void>) => {
    const owner = scopeRef.current;
    queueRef.current = queueRef.current.then(async () => {
      if (scopeRef.current !== owner) return;
      try {
        await task();
      } catch {
        // Each task reports its own failure.
      }
    });
  }, []);

  const commit = useCallback((data: FolderData, loaded = true) => {
    dataRef.current = data;
    loadedRef.current = loaded;
    setState({ scope: scopeRef.current, data, loaded });
  }, []);

  // ---- load ----

  const loadRemote = useCallback(
    (owner: string, userKey: string) => {
      enqueue(async () => {
        try {
          const remote = await fetchFolderData();
          if (scopeRef.current !== owner) return;
          pendingRef.current = readPending(userKey);
          commit(withPending(remote, pendingRef.current));
        } catch {
          if (scopeRef.current !== owner) return;
          toast.error("Couldn't load your folders.");
          commit(dataRef.current, true);
        }
      });
    },
    [commit, enqueue],
  );

  useEffect(() => {
    scopeRef.current = scope;
    dataRef.current = EMPTY_FOLDER_DATA;
    loadedRef.current = false;
    pendingRef.current = {};
    flushingRef.current.clear();

    if (!accountUserId) {
      // Reading localStorage is an external-system sync, not derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      commit(readGuest());
      const onStorage = (event: StorageEvent) => {
        if (event.key === GUEST_KEY || event.key === null) commit(readGuest());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ scope, data: EMPTY_FOLDER_DATA, loaded: false });
    loadRemote(scope, accountUserId);
    const onOnline = () => loadRemote(scope, accountUserId);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [scope, accountUserId, commit, loadRemote]);

  const refetch = useCallback(() => {
    if (accountUserId) loadRemote(scopeRef.current, accountUserId);
  }, [accountUserId, loadRemote]);

  const fail = useCallback(
    (message: string) => {
      toast.error(message);
      refetch();
    },
    [refetch],
  );

  /** Applies a change locally, and to storage for guests. Account changes are sent by the caller. */
  const apply = useCallback(
    (next: FolderData) => {
      commit(next);
      if (scopeRef.current === "guest") writeGuest(next);
    },
    [commit],
  );

  // ---- pending note moves (account only) ----

  const flushPending = useCallback(() => {
    if (!accountUserId || !loadedRef.current) return;
    const owner = scopeRef.current;
    for (const noteId of Object.keys(pendingRef.current)) {
      const summary = notesRef.current.find((note) => note.id === noteId);
      if (!summary || summary.unsaved || flushingRef.current.has(noteId)) continue;
      const target = pendingRef.current[noteId];
      flushingRef.current.add(noteId);
      enqueue(async () => {
        try {
          await placeNote(noteId, target);
          if (scopeRef.current !== owner) return;
          if (pendingRef.current[noteId] === target) {
            delete pendingRef.current[noteId];
            writePending(accountUserId, pendingRef.current);
          }
        } catch {
          // Not saved yet (404) or offline: it stays pending and is tried again when the notes change.
        } finally {
          flushingRef.current.delete(noteId);
          if (scopeRef.current === owner && noteId in pendingRef.current && pendingRef.current[noteId] !== target) {
            flushPending();
          }
        }
      });
    }
  }, [accountUserId, enqueue]);

  useEffect(() => {
    flushPending();
  }, [notes, state.loaded, flushPending]);

  const setPending = useCallback(
    (noteId: string, folderId: string | null) => {
      if (!accountUserId) return;
      const next = { ...pendingRef.current, [noteId]: folderId };
      const keys = Object.keys(next);
      if (keys.length > MAX_PENDING) delete next[keys[0]];
      pendingRef.current = next;
      writePending(accountUserId, next);
    },
    [accountUserId],
  );

  // ---- actions ----

  const createFolder = useCallback(
    (name: string, parentId: string | null): string => {
      const id = createClientId();
      const now = Date.now();
      const current = dataRef.current;
      const parent = parentId !== null && current.folders.some((folder) => folder.id === parentId) ? parentId : null;
      const folder: Folder = { id, name: folderNameOrDefault(name), parentId: parent, createdAt: now, updatedAt: now };
      apply({ folders: [...current.folders, folder], assignments: current.assignments });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { name: folder.name, parentId: parent });
          } catch {
            fail("Couldn't create the folder.");
          }
        });
      }
      return id;
    },
    [accountUserId, apply, enqueue, fail],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const cleaned = cleanFolderName(name);
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder || !cleaned || cleaned === folder.name) return;
      apply({
        folders: current.folders.map((candidate) =>
          candidate.id === id ? { ...candidate, name: cleaned, updatedAt: Date.now() } : candidate,
        ),
        assignments: current.assignments,
      });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { name: cleaned });
          } catch {
            fail("Couldn't rename the folder.");
          }
        });
      }
    },
    [accountUserId, apply, enqueue, fail],
  );

  const moveFolder = useCallback(
    (id: string, parentId: string | null): boolean => {
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder) return false;
      if (parentId !== null) {
        if (!current.folders.some((candidate) => candidate.id === parentId)) return false;
        if (subtreeIds(current.folders, id).has(parentId)) return false;
      }
      if (folder.parentId === parentId) return true;
      apply({
        folders: current.folders.map((candidate) =>
          candidate.id === id ? { ...candidate, parentId, updatedAt: Date.now() } : candidate,
        ),
        assignments: current.assignments,
      });
      if (accountUserId) {
        enqueue(async () => {
          try {
            await saveFolder(id, { parentId });
          } catch {
            fail("Couldn't move the folder.");
          }
        });
      }
      return true;
    },
    [accountUserId, apply, enqueue, fail],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      const current = dataRef.current;
      const folder = current.folders.find((candidate) => candidate.id === id);
      if (!folder) return;
      const up = folder.parentId;

      const assignments: Assignments = {};
      for (const [noteId, folderId] of Object.entries(current.assignments)) {
        if (folderId !== id) assignments[noteId] = folderId;
        else if (up !== null) assignments[noteId] = up;
      }
      apply({
        folders: current.folders
          .filter((candidate) => candidate.id !== id)
          .map((candidate) => (candidate.parentId === id ? { ...candidate, parentId: up } : candidate)),
        assignments,
      });

      if (accountUserId) {
        // Pending moves into the deleted folder follow its contents up one level.
        const pending = { ...pendingRef.current };
        let changed = false;
        for (const noteId of Object.keys(pending)) {
          if (pending[noteId] === id) {
            pending[noteId] = up;
            changed = true;
          }
        }
        if (changed) {
          pendingRef.current = pending;
          writePending(accountUserId, pending);
        }
        enqueue(async () => {
          try {
            await deleteFolderRemote(id);
          } catch {
            fail("Couldn't delete the folder.");
          }
        });
        flushPending();
      }
    },
    [accountUserId, apply, enqueue, fail, flushPending],
  );

  const assignNote = useCallback(
    (noteId: string, folderId: string | null) => {
      const current = dataRef.current;
      const target = folderId !== null && current.folders.some((folder) => folder.id === folderId) ? folderId : null;
      if ((current.assignments[noteId] ?? null) === target && !(noteId in pendingRef.current)) return;

      const assignments = { ...current.assignments };
      if (target === null) delete assignments[noteId];
      else assignments[noteId] = target;
      apply({ folders: current.folders, assignments });

      if (accountUserId) {
        setPending(noteId, target);
        flushPending();
      }
    },
    [accountUserId, apply, flushPending, setPending],
  );

  // ---- derived ----

  const current = state.scope === scope ? state : null;
  const data = current?.data ?? EMPTY_FOLDER_DATA;
  const loaded = current?.loaded ?? false;

  return useMemo<FolderModel>(() => {
    const ids = new Set(data.folders.map((folder) => folder.id));
    return {
      folders: data.folders,
      assignments: data.assignments,
      loaded,
      folderOf: (noteId) => {
        const folderId = data.assignments[noteId];
        return folderId !== undefined && ids.has(folderId) ? folderId : null;
      },
      createFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
      assignNote,
    };
  }, [data, loaded, createFolder, renameFolder, moveFolder, deleteFolder, assignNote]);
}

```

## src/app/api/folders/_shared.ts

```typescript
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

```

## src/app/api/folders/route.ts

```typescript
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, notes } from "@/db/schema";

import { apiError, getSessionUserId, jsonResponse, serviceUnavailable, toApiFolder } from "./_shared";

export async function GET(): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [folderRows, noteRows] = await Promise.all([
      database.select().from(folders).where(eq(folders.userId, userId)).orderBy(asc(folders.createdAt)),
      database
        .select({ id: notes.id, folderId: notes.folderId })
        .from(notes)
        .where(and(eq(notes.userId, userId), isNull(notes.deletedAt), isNotNull(notes.folderId))),
    ]);

    const assignments: Record<string, string> = {};
    for (const row of noteRows) {
      if (row.folderId) assignments[row.id] = row.folderId;
    }

    return jsonResponse({ folders: folderRows.map(toApiFolder), assignments });
  } catch {
    return serviceUnavailable();
  }
}

```

## src/app/api/folders/[id]/route.ts

```typescript
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { folders, notes } from "@/db/schema";

import {
  apiError,
  folderBodySchema,
  folderIdSchema,
  getSessionUserId,
  jsonResponse,
  ownsFolder,
  readSmallJson,
  serviceUnavailable,
  toApiFolder,
  wouldCreateLoop,
} from "../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/** Creates the folder when the id is new, otherwise renames and/or moves it. Safe to retry. */
export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!folderIdSchema.safeParse(id).success) return apiError(400, "Invalid folder id.");

    const parsed = await readSmallJson(request, folderBodySchema);
    if (!parsed.ok) return parsed.response;
    const { name, parentId } = parsed.data;

    const database = getDb();
    if (!database) return serviceUnavailable();

    if (parentId) {
      if (!(await ownsFolder(database, userId, parentId))) return apiError(404, "Folder not found.");
    }

    const [existing] = await database.select().from(folders).where(eq(folders.id, id)).limit(1);
    // Another user's folder id looks the same as a missing one.
    if (existing && existing.userId !== userId) return apiError(404, "Folder not found.");

    if (!existing) {
      if (name === undefined) return apiError(400, "A folder name is required.");
      const [created] = await database
        .insert(folders)
        .values({ id, userId, name, parentId: parentId ?? null })
        .onConflictDoNothing({ target: folders.id })
        .returning();
      if (created) return jsonResponse(toApiFolder(created), 201);

      const [concurrent] = await database
        .select()
        .from(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, userId)))
        .limit(1);
      return concurrent ? jsonResponse(toApiFolder(concurrent)) : apiError(404, "Folder not found.");
    }

    if (parentId !== undefined && (await wouldCreateLoop(database, userId, id, parentId))) {
      return apiError(400, "A folder cannot be moved into itself.");
    }

    const [updated] = await database
      .update(folders)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();

    return updated ? jsonResponse(toApiFolder(updated)) : apiError(404, "Folder not found.");
  } catch {
    return serviceUnavailable();
  }
}

/** Deletes the folder only. Its notes and sub-folders move up one level. */
export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!folderIdSchema.safeParse(id).success) return apiError(400, "Invalid folder id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [existing] = await database
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .limit(1);
    if (!existing) return noContent();

    const newParent = existing.parentId;
    await database
      .update(folders)
      .set({ parentId: newParent, updatedAt: new Date() })
      .where(and(eq(folders.parentId, id), eq(folders.userId, userId)));
    await database
      .update(notes)
      .set({ folderId: newParent })
      .where(and(eq(notes.folderId, id), eq(notes.userId, userId)));
    await database.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));

    return noContent();
  } catch {
    return serviceUnavailable();
  }
}

```

## src/app/api/notes/[id]/folder/route.ts

```typescript
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { notes } from "@/db/schema";

import { ownsFolder, readSmallJson, noteFolderBodySchema } from "../../../folders/_shared";
import { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "../../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noteIdSchema = z.string().uuid();

/** Moves a note into a folder (or back to the top level with null). Does not touch updated_at. */
export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const parsed = await readSmallJson(request, noteFolderBodySchema);
    if (!parsed.ok) return parsed.response;
    const { folderId } = parsed.data;

    const database = getDb();
    if (!database) return serviceUnavailable();

    if (folderId && !(await ownsFolder(database, userId, folderId))) {
      return apiError(404, "Folder not found.");
    }

    const [updated] = await database
      .update(notes)
      .set({ folderId })
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .returning({ id: notes.id });

    // 404 also covers a note that has not been saved to the database yet. The client keeps it pending.
    return updated ? jsonResponse({ id: updated.id, folderId }) : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}

```

## src/components/folders/DeleteFolderDialog.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteFolderDialogProps {
  /** The folder waiting for an answer, or null when the dialog is closed. */
  folder: { id: string; name: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/** Deleting a folder deletes nothing else: its notes and sub-folders move up one level. */
export function DeleteFolderDialog({ folder, onCancel, onConfirm }: DeleteFolderDialogProps) {
  return (
    <Dialog open={folder !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Delete this folder?</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-foreground">
            <span className="font-medium text-foreground break-words">“{folder?.name}”</span> will be removed. Its notes
            and sub-folders are kept and move up one level.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 sm:h-9"
            onClick={() => folder && onConfirm(folder.id)}
          >
            Delete folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

## src/components/folders/FolderContents.tsx

```tsx
"use client";

import { useMemo } from "react";

import { ChevronIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "@/components/folders/FolderIcons";
import { relativeTime } from "@/components/format";
import { useNow } from "@/components/useNow";
import { Button } from "@/components/ui/button";
import { childFolders, folderPath, subtreeIds } from "@/lib/folders/tree";
import type { Assignments, Folder } from "@/lib/folders/types";
import type { NoteSummary } from "@/lib/types";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import { cn } from "@/lib/utils";

interface FolderContentsProps {
  folderId: string;
  folders: Folder[];
  assignments: Assignments;
  notes: NoteSummary[];
  onOpenFolder: (id: string) => void;
  onOpenNote: (id: string) => void;
  onNewNote: (folderId: string) => void;
  onNewSubfolder: (folderId: string) => void;
  /** Leaves the folder view and returns to the note that was open. */
  onClose: () => void;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const rowClass =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-start outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The folder's "Contents" page. Nothing is stored: it is built from the folder's current notes and sub-folders,
 * so it is always up to date. Read-only.
 */
export function FolderContents({
  folderId,
  folders,
  assignments,
  notes,
  onOpenFolder,
  onOpenNote,
  onNewNote,
  onNewSubfolder,
  onClose,
}: FolderContentsProps) {
  const now = useNow();

  const path = useMemo(() => folderPath(folders, folderId), [folders, folderId]);
  const folder = path[path.length - 1];
  const subfolders = useMemo(() => childFolders(folders, folderId), [folders, folderId]);
  const folderNotes = useMemo(
    () => notes.filter((note) => assignments[note.id] === folderId),
    [notes, assignments, folderId],
  );

  // Note count per sub-folder, including everything below it.
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const sub of subfolders) {
      const ids = subtreeIds(folders, sub.id);
      result.set(sub.id, notes.filter((note) => ids.has(assignments[note.id] ?? "")).length);
    }
    return result;
  }, [subfolders, folders, notes, assignments]);

  if (!folder) return null;

  const empty = subfolders.length === 0 && folderNotes.length === 0;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-pad">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <nav aria-label="Folder path" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <button type="button" onClick={onClose} className="rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              Notes
            </button>
            {path.map((part, index) => {
              const last = index === path.length - 1;
              return (
                <span key={part.id} className="flex min-w-0 items-center gap-1">
                  <ChevronIcon className="size-3.5" />
                  {last ? (
                    <span dir="auto" className="truncate text-foreground">
                      {part.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenFolder(part.id)}
                      dir="auto"
                      className="truncate rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {part.name}
                    </button>
                  )}
                </span>
              );
            })}
          </nav>

          <h1
            dir="auto"
            lang={ARABIC_SCRIPT.test(folder.name) ? "ur" : undefined}
            className={cn(
              "text-2xl font-semibold tracking-tight break-words text-foreground",
              ARABIC_SCRIPT.test(folder.name) && "urdu-row",
            )}
          >
            {folder.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contents · {plural(folderNotes.length, "note", "notes")}, {plural(subfolders.length, "folder", "folders")}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" className="h-10 sm:h-9" onClick={() => onNewNote(folderId)}>
              <PlusIcon /> New note here
            </Button>
            <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={() => onNewSubfolder(folderId)}>
              <FolderPlusIcon /> New subfolder
            </Button>
          </div>

          {empty && (
            <p className="mt-10 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
              This folder is empty. Add a note or a subfolder, or move notes here from the sidebar.
            </p>
          )}

          {subfolders.length > 0 && (
            <section className="mt-8" aria-label="Folders">
              <h2 className="mb-2 px-3 text-xs font-medium text-muted-foreground">Folders</h2>
              <ul className="flex flex-col gap-1">
                {subfolders.map((sub) => (
                  <li key={sub.id}>
                    <button type="button" onClick={() => onOpenFolder(sub.id)} className={rowClass}>
                      <FolderIcon className="text-muted-foreground" />
                      <span dir="auto" className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {sub.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {plural(counts.get(sub.id) ?? 0, "note", "notes")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {folderNotes.length > 0 && (
            <section className="mt-8" aria-label="Notes">
              <h2 className="mb-2 px-3 text-xs font-medium text-muted-foreground">Notes</h2>
              <ul className="flex flex-col gap-1">
                {folderNotes.map((note) => (
                  <li key={note.id}>
                    <button type="button" onClick={() => onOpenNote(note.id)} className={rowClass}>
                      <span
                        dir="auto"
                        lang={ARABIC_SCRIPT.test(note.title) ? "ur" : undefined}
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm text-foreground",
                          ARABIC_SCRIPT.test(note.title) && "urdu-row",
                        )}
                      >
                        {note.title}
                      </span>
                      {note.unsaved && <span aria-label="Unsaved changes" className="size-2 shrink-0 rounded-full bg-brand" />}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {now > 0 ? relativeTime(note.updatedAt, now) : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

```

## src/components/folders/FolderIcons.tsx

```tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

/** Inline SVG icons that match the Hugeicons look (18px, 1.5 stroke, rounded). No icon-name guessing. */
function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FolderIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.4a2 2 0 0 1 1.5.7l1 1.1c.2.2.4.2.6.2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
    </Svg>
  );
}

export function FolderPlusIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.4a2 2 0 0 1 1.5.7l1 1.1c.2.2.4.2.6.2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
      <path d="M12 11.5v5M9.5 14h5" />
    </Svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function DotsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="5.5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1" fill="currentColor" />
    </Svg>
  );
}

export function MoveIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 12h13M13 7l5 5-5 5" />
    </Svg>
  );
}

export function ContentsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="0.6" fill="currentColor" />
      <circle cx="4" cy="12" r="0.6" fill="currentColor" />
      <circle cx="4" cy="18" r="0.6" fill="currentColor" />
    </Svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    </Svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  );
}

```

## src/components/folders/FolderTree.tsx

```tsx
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

```

## src/components/folders/MoveDialog.tsx

```tsx
"use client";

import { useMemo, useState } from "react";

import { FolderIcon } from "@/components/folders/FolderIcons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickerEntries, subtreeIds } from "@/lib/folders/tree";
import type { Folder } from "@/lib/folders/types";
import { cn } from "@/lib/utils";

export interface MoveTarget {
  kind: "note" | "folder";
  id: string;
  title: string;
  /** Where it sits now: a folder id, or null for the top level. */
  currentParentId: string | null;
}

interface MoveDialogProps {
  target: MoveTarget | null;
  folders: Folder[];
  onCancel: () => void;
  onConfirm: (target: MoveTarget, parentId: string | null) => void;
}

function MoveBody({ target, folders, onCancel, onConfirm }: Omit<MoveDialogProps, "target"> & { target: MoveTarget }) {
  const [choice, setChoice] = useState<string | null>(target.currentParentId);

  // A folder cannot go into itself or into one of its own sub-folders.
  const entries = useMemo(
    () => pickerEntries(folders, target.kind === "folder" ? subtreeIds(folders, target.id) : undefined),
    [folders, target],
  );

  const optionClass = (selected: boolean) =>
    cn(
      "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-start text-sm outline-none transition-colors duration-150 pointer-coarse:h-11 focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "bg-selected text-foreground" : "text-secondary-foreground hover:bg-hover",
    );

  return (
    <>
      <DialogHeader className="gap-1.5 text-left">
        <DialogTitle className="text-lg font-semibold tracking-tight">Move to…</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-secondary-foreground">
          Choose where <span className="font-medium text-foreground break-words">“{target.title}”</span> should go.
        </DialogDescription>
      </DialogHeader>

      <div role="radiogroup" aria-label="Destination folder" className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          role="radio"
          aria-checked={choice === null}
          onClick={() => setChoice(null)}
          className={optionClass(choice === null)}
        >
          <FolderIcon className="text-muted-foreground" />
          <span className="truncate">No folder (top level)</span>
        </button>
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={choice === entry.id}
            onClick={() => setChoice(entry.id)}
            style={{ paddingInlineStart: `${0.625 + entry.depth * 1.1}rem` }}
            className={optionClass(choice === entry.id)}
          >
            <FolderIcon className="text-muted-foreground" />
            <span dir="auto" className="truncate">
              {entry.name}
            </span>
          </button>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          className="h-10 sm:h-9"
          disabled={choice === target.currentParentId}
          onClick={() => onConfirm(target, choice)}
        >
          Move
        </Button>
      </DialogFooter>
    </>
  );
}

/** Pick a folder for a note or a folder. The list leaves out destinations that would be invalid. */
export function MoveDialog({ target, folders, onCancel, onConfirm }: MoveDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        {target && (
          <MoveBody
            key={`${target.kind}:${target.id}`}
            target={target}
            folders={folders}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

```

## src/app/api/notes/_shared.ts

```typescript
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";

export const MAX_NOTE_CONTENT_BYTES = 1_048_576;
const MAX_JSON_BODY_BYTES = MAX_NOTE_CONTENT_BYTES * 6 + 2_048;

const noStoreHeaders = { "Cache-Control": "no-store" };

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: noStoreHeaders });
}

export function apiError(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}

export function serviceUnavailable(): Response {
  return apiError(503, "The notes service is temporarily unavailable.");
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

const notePayloadSchema = z.object({
  content: z.string().refine(
    (content) => new TextEncoder().encode(content).byteLength <= MAX_NOTE_CONTENT_BYTES,
    "Content must be at most 1 MiB.",
  ),
  updatedAt: z.number().int().min(0).max(8_640_000_000_000_000),
});

export type NotePayload = z.infer<typeof notePayloadSchema>;

export type NotePayloadResult =
  | { ok: true; payload: NotePayload }
  | { ok: false; response: Response };

export async function readNotePayload(request: Request): Promise<NotePayloadResult> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { ok: false, response: apiError(415, "Content-Type must be application/json.") };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { ok: false, response: apiError(400, "Invalid Content-Length header.") };
    }
    if (declaredLength > MAX_JSON_BODY_BYTES) {
      return { ok: false, response: apiError(413, "Request body is too large.") };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, response: apiError(400, "A JSON request body is required.") };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      void reader.cancel();
      return { ok: false, response: apiError(413, "Request body is too large.") };
    }
    chunks.push(value);
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes));
  } catch {
    return { ok: false, response: apiError(400, "Request body must contain valid JSON.") };
  }

  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "content" in decoded &&
    typeof decoded.content === "string" &&
    new TextEncoder().encode(decoded.content).byteLength > MAX_NOTE_CONTENT_BYTES
  ) {
    return { ok: false, response: apiError(413, "Note content must be at most 1 MiB.") };
  }

  const validation = notePayloadSchema.safeParse(decoded);
  if (!validation.success) {
    return { ok: false, response: apiError(400, "Invalid note payload.") };
  }

  return { ok: true, payload: validation.data };
}

```

## src/app/api/notes/route.ts

```typescript
import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { deriveTitle } from "@/lib/types";

import { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "./_shared";

export async function GET(): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const rows = await database
      .select({ id: notes.id, content: notes.content, updatedAt: notes.updatedAt })
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .orderBy(desc(notes.updatedAt));

    return jsonResponse(
      rows.map((note) => ({
        id: note.id,
        title: deriveTitle(note.content),
        updatedAt: note.updatedAt.getTime(),
      })),
    );
  } catch {
    return serviceUnavailable();
  }
}

```

## src/app/api/notes/[id]/route.ts

```typescript
import { and, eq, isNull, lt, lte } from "drizzle-orm";
import { z } from "zod";

import { getDb, type Database } from "@/db";
import { notes } from "@/db/schema";
import type { Note } from "@/lib/types";

import {
  apiError,
  getSessionUserId,
  jsonResponse,
  readNotePayload,
  serviceUnavailable,
} from "../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noteIdSchema = z.string().uuid();

function toApiNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

async function updateIfNewer(
  database: Database,
  userId: string,
  id: string,
  content: string,
  updatedAt: Date,
): Promise<Response> {
  const [updated] = await database
    .update(notes)
    .set({ content, updatedAt })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        isNull(notes.deletedAt),
        lt(notes.updatedAt, updatedAt),
      ),
    )
    .returning();

  if (updated) return jsonResponse(toApiNote(updated));

  const [current] = await database
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);

  return current ? jsonResponse(toApiNote(current)) : apiError(404, "Note not found.");
}

async function restoreDeletedNote(
  database: Database,
  userId: string,
  id: string,
  content: string,
  updatedAt: Date,
  deletedAt: Date,
): Promise<Response> {
  const [restored] = await database
    .update(notes)
    .set({ content, updatedAt, deletedAt: null })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        eq(notes.deletedAt, deletedAt),
        lte(notes.updatedAt, updatedAt),
      ),
    )
    .returning();

  if (restored) return jsonResponse(toApiNote(restored));

  const [current] = await database
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
    .limit(1);

  return current ? jsonResponse(toApiNote(current)) : apiError(404, "Note not found.");
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [note] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    return note ? jsonResponse(toApiNote(note)) : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const parsedBody = await readNotePayload(request);
    if (!parsedBody.ok) return parsedBody.response;

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [existing] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    if (existing) {
      if (existing.deletedAt) {
        return restoreDeletedNote(
          database,
          userId,
          id,
          parsedBody.payload.content,
          new Date(parsedBody.payload.updatedAt),
          existing.deletedAt,
        );
      }
      return updateIfNewer(
        database,
        userId,
        id,
        parsedBody.payload.content,
        new Date(parsedBody.payload.updatedAt),
      );
    }

    const updatedAt = new Date(parsedBody.payload.updatedAt);
    const [created] = await database
      .insert(notes)
      .values({
        id,
        userId,
        content: parsedBody.payload.content,
        updatedAt,
      })
      .onConflictDoNothing({ target: notes.id })
      .returning();

    if (created) return jsonResponse(toApiNote(created), 201);

    // A concurrent request may have created this user's id after the first read.
    // The scoped lookup keeps this path from revealing another user's note.
    const [concurrent] = await database
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    if (!concurrent) return apiError(404, "Note not found.");
    return updateIfNewer(
      database,
      userId,
      id,
      parsedBody.payload.content,
      updatedAt,
    );
  } catch {
    return serviceUnavailable();
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const { id } = await context.params;
    if (!noteIdSchema.safeParse(id).success) return apiError(400, "Invalid note id.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [deleted] = await database
      .update(notes)
      .set({ deletedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .returning({ id: notes.id });

    if (deleted) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

    const [existing] = await database
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    return existing
      ? new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } })
      : apiError(404, "Note not found.");
  } catch {
    return serviceUnavailable();
  }
}

```

## src/app/api/notes/[id]/share/route.ts

```typescript
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { getDeploymentOrigins } from "@/lib/deployment-origins";
import { createShareWithStatus, getActiveShare, revokeShare } from "@/lib/shares";

import { apiError, getSessionUserId, jsonResponse, serviceUnavailable } from "../../_shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const noteIdSchema = z.string().uuid();

function isTrustedOrigin(request: Request, trusted: readonly string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return trusted.includes(origin) ||
    (process.env.NODE_ENV === "development" && origin === new URL(request.url).origin);
}

function shareUrl(request: Request, slug: string, canonical: string | undefined): string {
  const useLocalOrigin =
    process.env.NODE_ENV === "development" &&
    !process.env.NEXT_PUBLIC_SITE_URL?.trim() &&
    !process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const origin = useLocalOrigin ? new URL(request.url).origin : canonical;
  if (!origin) throw new Error("A public origin must be configured to generate share links.");
  return `${origin}/s/${slug}`;
}

function parseNoteId(id: string): string | null {
  return noteIdSchema.safeParse(id).success ? id : null;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");

    const id = parseNoteId((await context.params).id);
    if (!id) return apiError(404, "Note not found.");

    const database = getDb();
    if (!database) return serviceUnavailable();

    const [note] = await database
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId), isNull(notes.deletedAt)))
      .limit(1);

    if (!note) return apiError(404, "Note not found.");

    const share = await getActiveShare(userId, id);
    if (!share) return jsonResponse({ shared: false });

    return jsonResponse({
      shared: true,
      slug: share.slug,
      url: shareUrl(request, share.slug, getDeploymentOrigins().canonical),
      createdAt: share.createdAt.toISOString(),
    });
  } catch {
    return serviceUnavailable();
  }
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");
    const { canonical, trusted } = getDeploymentOrigins();
    if (!isTrustedOrigin(request, trusted)) return apiError(403, "Cross-origin requests are not allowed.");

    const id = parseNoteId((await context.params).id);
    if (!id) return apiError(404, "Note not found.");

    const result = await createShareWithStatus(userId, id);
    if (!result.ok) {
      return result.reason === "not_found"
        ? apiError(404, "Note not found.")
        : serviceUnavailable();
    }

    return jsonResponse(
      {
        shared: true,
        slug: result.share.slug,
        url: shareUrl(request, result.share.slug, canonical),
        createdAt: result.share.createdAt.toISOString(),
      },
      result.created ? 201 : 200,
    );
  } catch {
    return serviceUnavailable();
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return apiError(401, "Authentication is required.");
    if (!isTrustedOrigin(request, getDeploymentOrigins().trusted)) {
      return apiError(403, "Cross-origin requests are not allowed.");
    }

    const id = parseNoteId((await context.params).id);
    if (!id) return apiError(404, "Note not found.");

    const result = await revokeShare(userId, id);
    if (result === "not_found") return apiError(404, "Note not found.");
    return jsonResponse({ shared: false });
  } catch {
    return serviceUnavailable();
  }
}

```

## src/lib/store/cloudCache.ts

```typescript
// Storage I/O for the per-user cloud cache. One localStorage key per user id, so one account's
// notes are never read while another account is signed in. A separate key remembers which user
// this device last signed in as, so the sign-out warning and the sign-out clear know whose notes
// they are dealing with.

import { parseCloudCache, countUnsavedInNotes, type CloudCache } from "@/lib/store/cloudState";

export const CLOUD_CACHE_PREFIX = "notes:cloud:v1:";
export const CLOUD_CURRENT_USER_KEY = "notes:cloud:current:v1";

export function cloudCacheKey(userId: string): string {
  return CLOUD_CACHE_PREFIX + userId;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads a user's cache. Returns null when there is none, it is invalid, or storage is blocked. */
export function readCloudCache(userId: string): CloudCache | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return parseCloudCache(storage.getItem(cloudCacheKey(userId)));
  } catch {
    return null;
  }
}

/** Writes a user's cache. Returns false when storage is blocked or full; the caller keeps its copy. */
export function writeCloudCache(userId: string, cache: CloudCache): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(cloudCacheKey(userId), JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

/** Remembers the signed-in user whose notes this device is holding. */
export function setCurrentCloudUser(userId: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(CLOUD_CURRENT_USER_KEY, userId);
  } catch {
    // Without it the sign-out warning reads 0; the notes themselves are still cached.
  }
}

/** The user id recorded by setCurrentCloudUser, or null when none is known. */
export function getCurrentCloudUser(): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(CLOUD_CURRENT_USER_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Number of the current user's cached notes with edits that are not in the database. Other
 * accounts' leftovers on this device are not counted. 0 when no user is known or storage is blocked.
 */
export function countUnsavedCloudNotes(): number {
  const userId = getCurrentCloudUser();
  if (userId === null) return 0;
  const cache = readCloudCache(userId);
  return cache ? countUnsavedInNotes(cache.notes) : 0;
}

/** Sessions created in this page, so clearing can stop them from writing again. */
export interface DiscardableSession {
  readonly userId: string;
  discard(): void;
}

const liveSessions = new Set<DiscardableSession>();

export function registerLiveSession(session: DiscardableSession): void {
  liveSessions.add(session);
}

/**
 * Removes the current user's cached notes and forgets the current user. Only the explicit Sign out
 * action calls this: on session expiry or tab close the cache is kept, so unsaved work comes back
 * after signing in again. Safe to call when nothing is cached.
 */
export function clearCurrentUserCloudCache(): void {
  const userId = getCurrentCloudUser();
  const storage = getLocalStorage();
  if (storage) {
    try {
      if (userId !== null) storage.removeItem(cloudCacheKey(userId));
      storage.removeItem(CLOUD_CURRENT_USER_KEY);
    } catch {
      // Storage blocked: nothing was written, so nothing to remove.
    }
  }

  for (const session of Array.from(liveSessions)) {
    if (userId === null || session.userId !== userId) continue;
    liveSessions.delete(session);
    try {
      session.discard();
    } catch {
      // A stale subscriber must not prevent cache cleanup or retain other live sessions.
    }
  }
}

```

## src/lib/store/cloudSession.ts

```typescript
// Account-mode notes for one signed-in user. Edits only touch the per-user localStorage cache.
// The database is written only by save() (one PUT for the active note), delete and undo, and
// read by the list fetch on load and by per-note fetches when a note is opened.
//
// Plain class, no React: the hook subscribes to it, and tests drive it with fake storage and API.

import { NotesApiError, deleteNote, fetchNote, fetchNotes, saveNote } from "@/lib/sync/client";
import {
  readCloudCache,
  registerLiveSession,
  setCurrentCloudUser,
  writeCloudCache,
} from "@/lib/store/cloudCache";
import {
  hasUnsavedEdits,
  listCloudNotes,
  mergeWithServer,
  pruneGhostNotes,
  reconcileSave,
  reconcileWithStorage,
  type CloudCache,
  type CloudNote,
  type SaveAttempt,
} from "@/lib/store/cloudState";
import { createClientId, isBlankContent, nextUpdatedAt } from "@/lib/store/logic";
import { deriveTitle, type Note, type NoteSummary, type SaveResult, type SaveState } from "@/lib/types";

const PERSIST_DELAY_MS = 300;
const RECENT_DELETE_LIMIT = 20;
const SESSION_ENDED_MESSAGE = "Your session has ended. Sign in again to save.";
const SAVE_FAILED_MESSAGE = "Couldn't save this note. Try again.";

export interface CloudApi {
  fetchNotes(): Promise<NoteSummary[]>;
  fetchNote(id: string): Promise<Note>;
  saveNote(note: SaveAttempt): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export interface CloudStorage {
  read(): CloudCache | null;
  write(cache: CloudCache): boolean;
}

export interface CloudEnvironment {
  storage: CloudStorage;
  api: CloudApi;
  isOffline(): boolean;
  now(): number;
  newId(): string;
}

export interface CloudSnapshot {
  notes: NoteSummary[];
  activeNote: Note | null;
  activeNotePersisted?: boolean;
  saveState: SaveState;
  dirty: boolean;
  ready: boolean;
}

export const EMPTY_CLOUD_SNAPSHOT: CloudSnapshot = {
  notes: [],
  activeNote: null,
  activeNotePersisted: false,
  saveState: "idle",
  dirty: false,
  ready: false,
};

type FailureKind = "offline" | "signed-out" | "not-found" | "error";

interface Failure {
  /** The note the failure belongs to, or null for list and delete failures. */
  noteId: string | null;
  state: "offline" | "error";
  message?: string;
}

function failureKindOf(error: unknown): FailureKind {
  if (error instanceof NotesApiError) {
    if (error.kind === "offline") return "offline";
    if (error.kind === "unauthorized") return "signed-out";
    if (error.kind === "not-found") return "not-found";
    return "error";
  }
  return error instanceof TypeError ? "offline" : "error";
}

export class CloudSession {
  readonly userId: string;

  private readonly env: CloudEnvironment;
  private notes: CloudNote[];
  private activeId: string | undefined;
  private syncedAt: number | undefined;
  private readonly server = new Map<string, NoteSummary>();
  private serverSettled = false;
  /** Server notes removed in this tab whose content is still being fetched for the undo record. */
  private readonly hidden = new Set<string>();
  /** Ids this tab changed since its last write. Other ids follow whatever another tab stored. */
  private readonly touched = new Set<string>();
  /** Last content known to be in the database, per note. Used to detect revert-to-saved. */
  private readonly saved = new Map<string, string>();
  /** Notes deleted in this session, kept so an undo can restore their text. */
  private readonly recentlyDeleted = new Map<string, CloudNote>();
  private readonly saving = new Map<string, Promise<SaveResult>>();
  private readonly deleting = new Map<string, Promise<void>>();
  private readonly loading = new Map<string, Promise<void>>();
  private listing: Promise<void> | null = null;
  private failure: Failure | null = null;
  private persistFailed = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: CloudSnapshot = EMPTY_CLOUD_SNAPSHOT;
  /** Set by discard() on sign-out. A discarded session never writes or loads again. */
  private discarded = false;
  private readonly listeners = new Set<() => void>();

  constructor(userId: string, env: CloudEnvironment) {
    this.userId = userId;
    this.env = env;
    const cache = env.storage.read();
    this.notes = cache?.notes ?? [];
    this.activeId = cache?.activeId;
    this.syncedAt = cache?.syncedAt;
    for (const note of this.notes) {
      if (note.deletedAt === undefined && note.baseUpdatedAt !== null && !note.dirty) {
        this.saved.set(note.id, note.content);
      }
    }
    this.snapshot = this.computeSnapshot();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): CloudSnapshot => this.snapshot;

  /** Starts the first server sync: list the notes, then finish any deletes that did not reach the server. */
  start(): void {
    void this.refresh();
    this.retryDeletes();
  }

  /** Fetches the note list and merges it into the cache. Concurrent calls share one request. */
  refresh(): Promise<void> {
    if (this.discarded) return Promise.resolve();
    if (this.listing) return this.listing;
    if (this.env.isOffline()) {
      this.serverSettled = true;
      this.failure = { noteId: null, state: "offline" };
      this.emit();
      return Promise.resolve();
    }

    const operation = (async () => {
      try {
        const list = await this.env.api.fetchNotes();
        if (this.discarded) return;
        this.applyServerList(list);
        this.serverSettled = true;
        if (this.failure?.noteId === null) this.failure = null;
        this.syncedAt = this.env.now();
        this.ensureActive();
        this.persistSoon();
      } catch (error) {
        if (this.discarded) return;
        this.serverSettled = true;
        const kind = failureKindOf(error);
        this.failure = {
          noteId: null,
          state: kind === "offline" || this.env.isOffline() ? "offline" : "error",
          message: SAVE_FAILED_MESSAGE,
        };
      } finally {
        this.listing = null;
        this.emit();
      }
    })();
    this.listing = operation;
    return operation;
  }

  /** Writes the cache now, merged with what other tabs stored. Call on pagehide and when hidden. */
  flush(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null || this.touched.size > 0) {
      this.persistNow();
      this.emit();
    }
  }

  /** Forgets everything this session holds and stops it writing. Used by the explicit Sign out. */
  discard(): void {
    this.discarded = true;
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.notes = [];
    this.server.clear();
    this.hidden.clear();
    this.activeId = undefined;
    this.syncedAt = undefined;
    this.serverSettled = false;
    this.listing = null;
    this.failure = null;
    this.persistFailed = false;
    this.touched.clear();
    this.saved.clear();
    this.recentlyDeleted.clear();
    this.saving.clear();
    this.deleting.clear();
    this.loading.clear();
    this.snapshot = EMPTY_CLOUD_SNAPSHOT;
    for (const listener of Array.from(this.listeners)) listener();
  }

  /** Writes pending edits and cancels the debounce timer. Safe to call more than once. */
  dispose(): void {
    this.flush();
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = null;
  }

  /** Another tab wrote this user's cache. Adopt its changes for ids this tab has not touched. */
  handleExternalChange(): void {
    if (this.discarded) return;
    const stored = this.env.storage.read();
    if (!stored) return;
    this.notes = reconcileWithStorage(stored.notes, this.notes, this.touched);
    this.ensureActive();
    this.emit();
  }

  /** Retries deletes that have not reached the server, e.g. after going back online. */
  retryDeletes(): void {
    if (this.discarded) return;
    for (const note of this.notes) {
      if (note.deletedAt !== undefined && note.baseUpdatedAt !== null) void this.syncDelete(note.id);
    }
  }

  select(id: string): void {
    if (this.discarded) return;
    const visible = listCloudNotes(this.listInput());
    if (!visible.some((summary) => summary.id === id)) return;

    this.activeId = id;
    this.pruneGhosts(id);
    this.persistSoon();
    if (!this.isLoaded(id)) this.loadContent(id);
    this.emit();
  }

  create(): void {
    if (this.discarded) return;
    const now = this.env.now();
    const id = this.env.newId();
    this.pruneGhosts(id);
    this.notes = [
      ...this.notes,
      { id, content: "", createdAt: now, updatedAt: now, baseUpdatedAt: null, dirty: true },
    ];
    this.touched.add(id);
    this.activeId = id;
    this.persistNow();
    this.emit();
  }

  update(content: string): void {
    if (this.discarded) return;
    const note = this.activeCloud();
    if (!note || note.content === content) return;

    // Clean again when the text is back to what the database holds.
    const saved = this.saved.get(note.id);
    const dirty = note.baseUpdatedAt === null || saved === undefined || content !== saved;
    const next: CloudNote = {
      ...note,
      content,
      updatedAt: nextUpdatedAt(note.updatedAt, this.env.now()),
      dirty,
    };
    this.notes = this.notes.map((candidate) => (candidate.id === note.id ? next : candidate));
    this.touched.add(note.id);
    this.persistSoon();
    this.emit();
  }

  remove(id: string): void {
    if (this.discarded) return;
    const local = this.notes.find((note) => note.id === id && note.deletedAt === undefined);
    if (!local) {
      if (this.server.has(id) && !this.hidden.has(id)) void this.removeUnloaded(id);
      return;
    }

    const wasActive = this.activeId === id;
    const savingNow = this.saving.has(id);
    this.touched.add(id);
    this.server.delete(id);

    if (local.baseUpdatedAt === null && !savingNow) {
      // Never reached the database: nothing to delete there.
      this.rememberDeleted(local);
      this.notes = this.notes.filter((note) => note.id !== id);
    } else {
      const deletedAt = this.env.now();
      this.notes = this.notes.map((note) => (note.id === id ? { ...note, deletedAt } : note));
    }

    if (wasActive) {
      this.activeId = undefined;
      const next = listCloudNotes(this.listInput())[0];
      if (next) this.select(next.id);
    }
    this.persistNow();
    // A save in flight finishes first; syncDelete waits for it, so the delete is not undone by it.
    if (local.baseUpdatedAt !== null) void this.syncDelete(id);
    this.emit();
  }

  restore(id: string): void {
    if (this.discarded) return;
    void this.restoreNote(id);
  }

  /** Saves the active note to the database. Never throws. */
  save(): Promise<SaveResult> {
    if (this.discarded) return Promise.resolve({ ok: false, reason: "signed-out" });
    if (this.activeId === undefined) return Promise.resolve({ ok: false, reason: "empty" });
    return this.saveById(this.activeId);
  }

  // ---- internals -------------------------------------------------------------------------

  private emit(): void {
    this.snapshot = this.computeSnapshot();
    for (const listener of Array.from(this.listeners)) listener();
  }

  private computeSnapshot(): CloudSnapshot {
    const notes = listCloudNotes(this.listInput());
    const active = this.activeCloud();
    const activeNote: Note | null = active
      ? { id: active.id, content: active.content, createdAt: active.createdAt, updatedAt: active.updatedAt }
      : null;
    return {
      notes,
      activeNote,
      activeNotePersisted: active !== undefined && active.baseUpdatedAt !== null,
      saveState: this.deriveSaveState(active),
      dirty: active ? hasUnsavedEdits(active) : false,
      ready: this.serverSettled || notes.length > 0,
    };
  }

  private deriveSaveState(note: CloudNote | undefined): SaveState {
    if (this.persistFailed) return "error";
    if (!note) return "idle";
    if (this.saving.has(note.id)) return "saving";
    if (!hasUnsavedEdits(note)) return note.baseUpdatedAt === null ? "idle" : "saved";
    if (this.failure && (this.failure.noteId === null || this.failure.noteId === note.id)) {
      return this.failure.state;
    }
    return "unsaved";
  }

  private listInput() {
    return { notes: this.notes, server: this.server, hidden: this.hidden, activeId: this.activeId };
  }

  private activeCloud(): CloudNote | undefined {
    return this.notes.find((note) => note.id === this.activeId && note.deletedAt === undefined);
  }

  private isLoaded(id: string): boolean {
    return this.notes.some((note) => note.id === id && note.deletedAt === undefined);
  }

  private pruneGhosts(keepId: string | undefined): void {
    const next = pruneGhostNotes(this.notes, keepId);
    if (next.length === this.notes.length) return;
    const kept = new Set(next.map((note) => note.id));
    for (const note of this.notes) if (!kept.has(note.id)) this.touched.add(note.id);
    this.notes = next;
  }

  private rememberDeleted(note: CloudNote): void {
    this.recentlyDeleted.delete(note.id);
    this.recentlyDeleted.set(note.id, note);
    if (this.recentlyDeleted.size > RECENT_DELETE_LIMIT) {
      const oldest = this.recentlyDeleted.keys().next().value;
      if (oldest !== undefined) this.recentlyDeleted.delete(oldest);
    }
  }

  private persistSoon(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistNow();
      this.emit();
    }, PERSIST_DELAY_MS);
  }

  private persistNow(): void {
    if (this.discarded) return;
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    const stored = this.env.storage.read();
    const merged = pruneGhostNotes(
      reconcileWithStorage(stored?.notes ?? [], this.notes, this.touched),
      this.activeId,
    );
    const written = this.env.storage.write({
      version: 1,
      notes: merged,
      activeId: this.activeId,
      syncedAt: this.syncedAt,
    });
    this.persistFailed = !written;
    if (written) {
      this.touched.clear();
      this.notes = merged;
    }
  }

  private applyServerList(list: NoteSummary[]): void {
    if (this.discarded) return;
    const before = this.notes.map((note) => note.id);
    this.server.clear();
    for (const summary of list) {
      if (!this.hidden.has(summary.id)) this.server.set(summary.id, summary);
    }
    // A note whose save is in flight is left alone: the save's own response decides its state.
    this.notes = mergeWithServer(this.notes, this.server, this.activeId, this.saving.keys(), this.env.newId);
    for (const id of before) this.touched.add(id);
    for (const note of this.notes) this.touched.add(note.id);
  }

  /** Makes sure the active note is set and its content is loaded. */
  private ensureActive(): void {
    const visible = listCloudNotes(this.listInput());
    if (this.activeId !== undefined && visible.some((summary) => summary.id === this.activeId)) {
      if (!this.isLoaded(this.activeId)) this.loadContent(this.activeId);
      return;
    }
    const first = visible[0];
    if (first) {
      this.select(first.id);
    } else {
      this.activeId = undefined;
    }
  }

  private loadContent(id: string): void {
    if (this.discarded) return;
    if (this.loading.has(id)) return;
    if (this.env.isOffline()) {
      this.failure = { noteId: id, state: "offline" };
      this.emit();
      return;
    }

    const operation = (async () => {
      try {
        const note = await this.env.api.fetchNote(id);
        if (this.discarded) return;
        // Skip if the note appeared meanwhile, or was removed in this tab.
        if (!this.notes.some((candidate) => candidate.id === id) && !this.hidden.has(id)) {
          this.notes = [
            ...this.notes,
            {
              id,
              content: note.content,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              baseUpdatedAt: note.updatedAt,
              dirty: false,
            },
          ];
          this.saved.set(id, note.content);
          this.touched.add(id);
          this.persistSoon();
        }
        if (this.failure?.noteId === id) this.failure = null;
      } catch (error) {
        if (this.discarded) return;
        const kind = failureKindOf(error);
        if (kind === "not-found") {
          // Deleted on another device: the list no longer has it.
          this.server.delete(id);
          if (this.activeId === id) this.activeId = undefined;
          this.ensureActive();
        } else {
          this.failure = {
            noteId: id,
            state: kind === "offline" || this.env.isOffline() ? "offline" : "error",
            message: SAVE_FAILED_MESSAGE,
          };
        }
      } finally {
        this.loading.delete(id);
        this.emit();
      }
    })();
    this.loading.set(id, operation);
  }

  private async removeUnloaded(id: string): Promise<void> {
    if (this.discarded) return;
    // Undo needs the text, so a note this device never loaded is fetched before it is deleted.
    this.hidden.add(id);
    this.emit();

    let note: Note;
    try {
      note = await this.env.api.fetchNote(id);
    } catch (error) {
      if (this.discarded) return;
      this.hidden.delete(id);
      const kind = failureKindOf(error);
      if (kind === "not-found") {
        this.server.delete(id);
      } else {
        this.failure = { noteId: null, state: kind === "offline" ? "offline" : "error", message: SAVE_FAILED_MESSAGE };
      }
      this.emit();
      return;
    }
    if (this.discarded) return;
    this.hidden.delete(id);
    if (this.isLoaded(id)) {
      this.remove(id);
      return;
    }

    const tombstone: CloudNote = {
      id,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      baseUpdatedAt: note.updatedAt,
      dirty: false,
      deletedAt: this.env.now(),
    };
    this.notes = [...this.notes.filter((candidate) => candidate.id !== id), tombstone];
    this.server.delete(id);
    this.touched.add(id);
    if (this.activeId === id) {
      this.activeId = undefined;
      this.ensureActive();
    }
    this.persistSoon();
    void this.syncDelete(id);
    this.emit();
  }

  private syncDelete(id: string): Promise<void> {
    if (this.discarded) return Promise.resolve();
    const existing = this.deleting.get(id);
    if (existing) return existing;
    // Offline: nothing is registered, so the tombstone is retried by the next retryDeletes().
    if (this.env.isOffline()) {
      this.failure = { noteId: null, state: "offline" };
      this.emit();
      return Promise.resolve();
    }

    const operation = (async () => {
      const pendingSave = this.saving.get(id);
      if (pendingSave) await pendingSave;
      if (this.discarded) return;
      try {
        await this.env.api.deleteNote(id);
      } catch (error) {
        if (this.discarded) return;
        const kind = failureKindOf(error);
        if (kind !== "not-found") {
          this.failure = {
            noteId: null,
            state: kind === "offline" ? "offline" : "error",
            message: SAVE_FAILED_MESSAGE,
          };
          return;
        }
      }
      if (this.discarded) return;

      // Only drop the tombstone if the note was not restored while the delete was in flight.
      const tombstone = this.notes.find((note) => note.id === id && note.deletedAt !== undefined);
      if (tombstone) {
        this.notes = this.notes.filter((note) => note !== tombstone);
        this.rememberDeleted(tombstone);
        this.touched.add(id);
        this.persistSoon();
      }
      if (this.failure?.noteId === null) this.failure = null;
    })().finally(() => {
      this.deleting.delete(id);
      this.emit();
    });

    this.deleting.set(id, operation);
    return operation;
  }

  private async restoreNote(id: string): Promise<void> {
    if (this.discarded) return;
    const pending = this.deleting.get(id);
    if (pending) await pending;
    if (this.discarded) return;

    const current = this.notes.find((note) => note.id === id);
    if (current && current.deletedAt === undefined) return;
    const base = current ?? this.recentlyDeleted.get(id);
    if (!base) return;

    const restored: CloudNote = {
      id,
      content: base.content,
      createdAt: base.createdAt,
      updatedAt: nextUpdatedAt(base.updatedAt, this.env.now()),
      baseUpdatedAt: null,
      dirty: true,
    };
    this.notes = [...this.notes.filter((note) => note.id !== id), restored];
    this.recentlyDeleted.delete(id);
    this.touched.add(id);
    this.activeId = id;
    this.persistNow();
    this.emit();
    await this.saveById(id);
  }

  private saveById(id: string): Promise<SaveResult> {
    if (this.discarded) return Promise.resolve({ ok: false, reason: "signed-out" });
    const existing = this.saving.get(id);
    if (existing) return existing;

    const note = this.notes.find((candidate) => candidate.id === id && candidate.deletedAt === undefined);
    if (!note || isBlankContent(note.content)) return Promise.resolve({ ok: false, reason: "empty" });
    if (!hasUnsavedEdits(note)) return Promise.resolve({ ok: true });

    if (this.env.isOffline()) {
      this.failure = { noteId: id, state: "offline" };
      this.emit();
      return Promise.resolve({ ok: false, reason: "offline" });
    }

    if (this.failure?.noteId === id) this.failure = null;
    const attempt: SaveAttempt = { id, content: note.content, updatedAt: note.updatedAt };
    const operation = this.send(attempt).finally(() => {
      this.saving.delete(id);
      // A delete asked for while this save was in flight runs now, after the PUT.
      if (this.notes.some((candidate) => candidate.id === id && candidate.deletedAt !== undefined)) {
        void this.syncDelete(id);
      }
      this.emit();
    });
    this.saving.set(id, operation);
    this.emit();
    return operation;
  }

  private async send(attempt: SaveAttempt): Promise<SaveResult> {
    try {
      const response = await this.env.api.saveNote(attempt);
      if (this.discarded) return { ok: false, reason: "signed-out" };
      this.applySaved(attempt, response);
      if (this.failure?.noteId === attempt.id) this.failure = null;
      this.persistSoon();
      return { ok: true };
    } catch (error) {
      if (this.discarded) return { ok: false, reason: "signed-out" };
      const kind = this.env.isOffline() ? "offline" : failureKindOf(error);
      if (kind === "offline") {
        this.failure = { noteId: attempt.id, state: "offline" };
        return { ok: false, reason: "offline" };
      }
      if (kind === "signed-out") {
        this.failure = { noteId: attempt.id, state: "error", message: SESSION_ENDED_MESSAGE };
        return { ok: false, reason: "signed-out", message: SESSION_ENDED_MESSAGE };
      }
      this.failure = { noteId: attempt.id, state: "error", message: SAVE_FAILED_MESSAGE };
      return { ok: false, reason: "error", message: SAVE_FAILED_MESSAGE };
    }
  }

  private applySaved(attempt: SaveAttempt, response: Note): void {
    if (this.discarded) return;
    this.server.set(attempt.id, {
      id: attempt.id,
      title: deriveTitle(response.content),
      updatedAt: response.updatedAt,
    });
    this.saved.set(attempt.id, response.content);

    const local = this.notes.find((note) => note.id === attempt.id);
    if (!local) return;
    this.touched.add(attempt.id);

    if (local.deletedAt !== undefined) {
      // Deleted while the save was in flight: keep the tombstone, the delete runs after this.
      this.notes = this.notes.map((note) =>
        note.id === attempt.id ? { ...note, baseUpdatedAt: response.updatedAt } : note,
      );
      return;
    }

    const { note, copy } = reconcileSave(local, attempt, response, this.env.newId());
    this.notes = this.notes.map((candidate) => (candidate.id === attempt.id ? note : candidate));
    if (copy) {
      this.notes = [...this.notes, copy];
      this.touched.add(copy.id);
    }
  }
}

/** Real environment: the browser's localStorage and the notes API. */
export function createCloudSession(userId: string): CloudSession {
  setCurrentCloudUser(userId);
  const session = new CloudSession(userId, {
    storage: {
      read: () => readCloudCache(userId),
      write: (cache) => writeCloudCache(userId, cache),
    },
    api: { fetchNotes, fetchNote, saveNote, deleteNote },
    isOffline: () => typeof navigator !== "undefined" && navigator.onLine === false,
    now: () => Date.now(),
    newId: createClientId,
  });
  registerLiveSession(session);
  return session;
}

```

## src/lib/store/cloudState.ts

```typescript
// Pure helpers for signed-in notes. No React, no storage, no network: every rule that decides
// what a note's content is, what counts as unsaved, and how the cache and the server are merged
// lives here so it can be tested directly.

import { z } from "zod";

import { deriveTitle, type Note, type NoteSummary } from "@/lib/types";
import { isBlankContent } from "@/lib/store/logic";

export const CLOUD_CACHE_VERSION = 1;

/** A note as kept in the per-user localStorage cache. */
export interface CloudNote {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  /** Server updatedAt this edit was based on. null = never saved to the database. */
  baseUpdatedAt: number | null;
  /** Local edits that are not in the database yet. */
  dirty: boolean;
  /** Set when the note was deleted locally and the delete has not reached the database yet. */
  deletedAt?: number;
}

export interface CloudCache {
  version: 1;
  notes: CloudNote[];
  activeId?: string;
  syncedAt?: number;
}

/** The server's view of a note, as far as merging needs it. */
export type ServerVersions = ReadonlyMap<string, { updatedAt: number }>;

const timestamp = z.number().int().nonnegative();

const cloudNoteSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
  baseUpdatedAt: timestamp.nullable(),
  dirty: z.boolean(),
  deletedAt: timestamp.optional(),
});

const cloudCacheSchema = z.object({
  version: z.literal(CLOUD_CACHE_VERSION),
  notes: z.array(z.unknown()),
  activeId: z.uuid().optional(),
  syncedAt: timestamp.optional(),
});

/**
 * Parses a stored cache. Anything malformed is dropped rather than trusted: an invalid note is
 * skipped, a duplicate id keeps its first copy, and a note with no base is always dirty.
 */
export function parseCloudCache(raw: string | null): CloudCache | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const header = cloudCacheSchema.safeParse(value);
  if (!header.success) return null;

  const seen = new Set<string>();
  const notes: CloudNote[] = [];
  for (const item of header.data.notes) {
    const parsed = cloudNoteSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    const note = parsed.data;
    notes.push({
      ...note,
      dirty: note.baseUpdatedAt === null ? true : note.dirty,
    });
  }

  const cache: CloudCache = { version: CLOUD_CACHE_VERSION, notes };
  if (header.data.activeId !== undefined) cache.activeId = header.data.activeId;
  if (header.data.syncedAt !== undefined) cache.syncedAt = header.data.syncedAt;
  return cache;
}

/** A note that has never reached the database and has no text: nothing to save or keep. */
export function isGhostNote(note: CloudNote, activeId: string | undefined): boolean {
  return (
    note.baseUpdatedAt === null &&
    isBlankContent(note.content) &&
    note.deletedAt === undefined &&
    note.id !== activeId
  );
}

/** True when the note has text the database does not have. Blank new notes have nothing to save. */
export function hasUnsavedEdits(note: CloudNote): boolean {
  if (note.deletedAt !== undefined) return false;
  if (note.baseUpdatedAt === null) return !isBlankContent(note.content);
  return note.dirty;
}

/** Ids that should still be in the cache after a write. Ghosts are dropped, tombstones kept. */
export function pruneGhostNotes(notes: readonly CloudNote[], activeId: string | undefined): CloudNote[] {
  return notes.filter((note) => !isGhostNote(note, activeId));
}

/** Text for the copy kept when an edit conflicts with a newer server version. */
export function conflictCopyContent(content: string): string {
  const newline = content.search(/\r?\n/);
  const firstLine = newline === -1 ? content : content.slice(0, newline);
  const rest = newline === -1 ? "" : content.slice(newline);
  const title = firstLine.trim() || "Untitled note";
  return `${title} (unsaved copy)${rest}`;
}

/**
 * Merges the local cache with the server's list of notes. Server content is not part of the list,
 * so a clean note whose server version moved on is dropped here and fetched when it is opened.
 *
 * - Clean note, same server version: kept.
 * - Clean note, server changed or gone: dropped (refetched on demand, or simply gone).
 * - Dirty note, server unchanged since its base: kept, so its edits can be saved.
 * - Dirty note, server deleted it: kept as a never-saved note, so no text is lost.
 * - Dirty note, server changed since its base (edited on two devices): the local text becomes a
 *   separate "(unsaved copy)" note and the server version wins for the original id.
 * - Pending delete: kept until the delete reaches the server.
 * - Save in flight: kept as it is, because the save's response decides the note's state.
 */
export function mergeWithServer(
  local: readonly CloudNote[],
  server: ServerVersions,
  activeId: string | undefined,
  saving: Iterable<string>,
  newId: () => string,
): CloudNote[] {
  const inFlight = new Set(saving);
  const out: CloudNote[] = [];
  for (const note of local) {
    if (inFlight.has(note.id)) {
      out.push(note);
      continue;
    }
    if (note.deletedAt !== undefined) {
      if (note.baseUpdatedAt !== null) out.push(note);
      continue;
    }

    const remote = server.get(note.id);
    if (note.baseUpdatedAt === null) {
      if (!remote) {
        if (!isGhostNote(note, activeId)) out.push(note);
        continue;
      }
      // Same id exists on the server but this copy was never saved: keep its text as a copy.
      if (!isBlankContent(note.content)) out.push(unsavedCopy(note, newId));
      continue;
    }

    if (!note.dirty) {
      if (remote && remote.updatedAt === note.baseUpdatedAt) out.push(note);
      continue;
    }

    if (!remote) {
      out.push({ ...note, baseUpdatedAt: null });
      continue;
    }
    if (remote.updatedAt === note.baseUpdatedAt) {
      out.push(note);
      continue;
    }
    out.push(unsavedCopy(note, newId));
  }
  return out;
}

function unsavedCopy(note: CloudNote, newId: () => string): CloudNote {
  return {
    id: newId(),
    content: conflictCopyContent(note.content),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    baseUpdatedAt: null,
    dirty: true,
  };
}

export interface SaveAttempt {
  id: string;
  content: string;
  updatedAt: number;
}

export interface SaveReconciliation {
  /** The note as it should be stored after the response. */
  note: CloudNote;
  /** A copy holding local text the server did not accept, when there was a conflict. */
  copy: CloudNote | null;
}

/**
 * Applies a successful PUT to the local note. The note is clean only if what the user has now
 * equals what the server holds. Edits made while the request was in flight stay dirty.
 */
export function reconcileSave(
  local: CloudNote,
  sent: SaveAttempt,
  response: Note,
  copyId: string,
): SaveReconciliation {
  if (local.content === response.content) {
    return {
      note: { ...local, baseUpdatedAt: response.updatedAt, dirty: false },
      copy: null,
    };
  }

  const accepted = response.updatedAt === sent.updatedAt && response.content === sent.content;
  if (accepted) {
    // The server took our version; the user has typed more since.
    return { note: { ...local, baseUpdatedAt: response.updatedAt, dirty: true }, copy: null };
  }

  // The server kept a newer version. Take it for the original id; keep our text as a copy.
  return {
    note: {
      id: local.id,
      content: response.content,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      baseUpdatedAt: response.updatedAt,
      dirty: false,
    },
    copy: {
      id: copyId,
      content: conflictCopyContent(local.content),
      createdAt: local.createdAt,
      updatedAt: local.updatedAt,
      baseUpdatedAt: null,
      dirty: true,
    },
  };
}

/**
 * Combines the notes stored by another tab with this tab's notes. Ids this tab changed since its
 * last write are taken from memory; every other id takes the stored copy, so another tab's edits
 * are not overwritten by writing a stale view back.
 */
export function reconcileWithStorage(
  stored: readonly CloudNote[],
  memory: readonly CloudNote[],
  touched: ReadonlySet<string>,
): CloudNote[] {
  const storedById = new Map(stored.map((note) => [note.id, note]));
  const memoryById = new Map(memory.map((note) => [note.id, note]));
  const ids = new Set([...memoryById.keys(), ...storedById.keys()]);

  const out: CloudNote[] = [];
  for (const id of ids) {
    const picked = touched.has(id)
      ? memoryById.get(id)
      : (storedById.get(id) ?? memoryById.get(id));
    if (picked) out.push(picked);
  }
  return out;
}

export interface CloudListInput {
  notes: readonly CloudNote[];
  server: ReadonlyMap<string, NoteSummary>;
  /** Ids removed in this tab whose content is still being fetched. Hidden from the list. */
  hidden: ReadonlySet<string>;
  activeId: string | undefined;
}

/** The list the sidebar shows: local notes first, then server notes this device has not loaded. */
export function listCloudNotes(input: CloudListInput): NoteSummary[] {
  const byId = new Map<string, NoteSummary>();
  const localIds = new Set(input.notes.map((note) => note.id));

  for (const summary of input.server.values()) {
    if (input.hidden.has(summary.id) || localIds.has(summary.id)) continue;
    byId.set(summary.id, { id: summary.id, title: summary.title, updatedAt: summary.updatedAt });
  }

  for (const note of input.notes) {
    if (note.deletedAt !== undefined || input.hidden.has(note.id)) continue;
    if (isGhostNote(note, input.activeId)) continue;
    const summary: NoteSummary = {
      id: note.id,
      title: deriveTitle(note.content),
      updatedAt: note.updatedAt,
    };
    if (hasUnsavedEdits(note)) summary.unsaved = true;
    byId.set(note.id, summary);
  }

  return Array.from(byId.values()).sort((left, right) => right.updatedAt - left.updatedAt);
}

/** Number of notes with edits that are not in the database, across the given caches. */
export function countUnsavedInNotes(notes: readonly CloudNote[]): number {
  return notes.filter((note) => note.deletedAt === undefined && hasUnsavedEdits(note)).length;
}

```

## src/lib/store/guest.ts

```typescript
import { z } from "zod";

import {
  EMPTY_GUEST_STATE,
  purgeExpiredNotes,
  type GuestNoteRecord,
  type GuestState,
} from "@/lib/store/guestState";
import { createClientId, isBlankContent } from "@/lib/store/logic";

export const GUEST_STORAGE_KEY = "notes:guest:v2";
export const GUEST_LEGACY_STORAGE_KEY = "notes:guest:v1";
export const GUEST_STORAGE_VERSION = 2;

const uuidSchema = z.uuid();

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validUuid(value: unknown): string | undefined {
  return typeof value === "string" && uuidSchema.safeParse(value).success ? value : undefined;
}

interface ParsedNote {
  record: GuestNoteRecord;
  /** True when the stored id was not a UUID and had to be replaced. */
  repaired: boolean;
}

// The account API only accepts UUID ids, so an invalid id is replaced once and the
// repair is written back by readGuestState (otherwise every read would mint a new id).
function parseNote(value: unknown): ParsedNote | null {
  if (!isObject(value)) return null;
  const { id, content, createdAt, updatedAt, deletedAt } = value;
  if (typeof content !== "string" || !isTimestamp(updatedAt)) return null;

  const validId = validUuid(id);
  const record: GuestNoteRecord = {
    id: validId ?? createClientId(),
    content,
    createdAt: isTimestamp(createdAt) ? createdAt : updatedAt,
    updatedAt,
  };
  if (isTimestamp(deletedAt)) record.deletedAt = deletedAt;
  return { record, repaired: validId === undefined };
}

function parseStoredState(raw: string | null): { state: GuestState; repaired: boolean } | null {
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || value.version !== GUEST_STORAGE_VERSION || !Array.isArray(value.notes)) {
    return null;
  }

  let repaired = false;
  const notes: GuestNoteRecord[] = [];
  for (const item of value.notes) {
    const parsed = parseNote(item);
    if (!parsed) {
      repaired = true;
      continue;
    }
    if (parsed.repaired) repaired = true;
    notes.push(parsed.record);
  }

  const activeId = typeof value.activeId === "string" ? value.activeId : undefined;
  return { state: { notes, activeId }, repaired };
}

/** The single-note v1 format: `{ content, updatedAt, id?, migrationId? }`. */
function parseLegacyNote(raw: string): GuestNoteRecord | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || typeof value.content !== "string" || !isTimestamp(value.updatedAt)) {
    return null;
  }

  // migrationId was the id the old migration sent to the account, so it is preferred.
  const id = validUuid(value.migrationId) ?? validUuid(value.id) ?? createClientId();
  return {
    id,
    content: value.content,
    createdAt: value.updatedAt,
    updatedAt: value.updatedAt,
  };
}

function removeKey(key: string): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Reads guest notes. Folds in a v1 note, purges expired deletions, and writes back changes. */
export function readGuestState(now = Date.now()): GuestState {
  const storage = getLocalStorage();
  if (!storage) return EMPTY_GUEST_STATE;

  try {
    const stored = parseStoredState(storage.getItem(GUEST_STORAGE_KEY));
    const legacyRaw = storage.getItem(GUEST_LEGACY_STORAGE_KEY);
    const legacy = legacyRaw === null ? null : parseLegacyNote(legacyRaw);

    let state: GuestState = stored?.state ?? EMPTY_GUEST_STATE;
    const legacyIsNew =
      legacy !== null &&
      !isBlankContent(legacy.content) &&
      !state.notes.some((note) => note.id === legacy.id);
    if (legacy && legacyIsNew) state = { ...state, notes: [...state.notes, legacy] };
    const purged = purgeExpiredNotes(state, now);

    if (legacyRaw !== null) {
      // Remove the v1 key only after v2 has been written, so a failed write loses nothing.
      if (persistOrClear(purged)) removeKey(GUEST_LEGACY_STORAGE_KEY);
    } else {
      const storedCount = stored?.state.notes.length ?? 0;
      const changed = stored?.repaired === true || purged.notes.length !== storedCount;
      if (changed) persistOrClear(purged);
    }
    return purged;
  } catch {
    return EMPTY_GUEST_STATE;
  }
}

/** Writes guest notes as v2. Returns false if storage is unavailable or full. */
export function writeGuestState(state: GuestState): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    const value = { version: GUEST_STORAGE_VERSION, notes: state.notes, activeId: state.activeId };
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function persistOrClear(state: GuestState): boolean {
  return state.notes.length === 0 ? removeKey(GUEST_STORAGE_KEY) : writeGuestState(state);
}

/** Removes both guest keys. Other keys (prefs, last opened note) are left alone. */
export function clearGuestState(): boolean {
  const removedV2 = removeKey(GUEST_STORAGE_KEY);
  const removedV1 = removeKey(GUEST_LEGACY_STORAGE_KEY);
  return removedV2 && removedV1;
}

/**
 * After a migration, drops the notes that were sent to the account. A note is only dropped
 * if it is unchanged since it was sent (same updatedAt), so an edit made meanwhile survives.
 * Once no unsynced note is left, the guest keys are cleared entirely.
 */
export function dropSyncedGuestNotes(synced: ReadonlyMap<string, number>): boolean {
  const current = readGuestState();
  const remaining = current.notes.filter((note) => synced.get(note.id) !== note.updatedAt);
  const hasUnsynced = remaining.some(
    (note) => note.deletedAt === undefined && !isBlankContent(note.content),
  );
  if (!hasUnsynced) return clearGuestState();
  return writeGuestState({ notes: remaining, activeId: current.activeId });
}

```

## src/lib/store/guestState.ts

```typescript
import {
  createClientId,
  isBlankContent,
  nextUpdatedAt,
  sortNoteSummaries,
  summarizeNote,
} from "@/lib/store/logic";
import type { Note, NoteSummary } from "@/lib/types";

/** Soft-deleted guest notes are kept this long, then dropped on the next storage read. */
export const GUEST_PURGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** A guest note as stored. `deletedAt` marks a soft delete. */
export interface GuestNoteRecord {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface GuestState {
  notes: GuestNoteRecord[];
  activeId?: string;
}

export const EMPTY_GUEST_STATE: GuestState = { notes: [] };

function isLive(note: GuestNoteRecord): boolean {
  return note.deletedAt === undefined;
}

function findLive(state: GuestState, id: string | undefined): GuestNoteRecord | undefined {
  if (id === undefined) return undefined;
  return state.notes.find((note) => note.id === id && isLive(note));
}

function replaceNote(notes: GuestNoteRecord[], next: GuestNoteRecord): GuestNoteRecord[] {
  return notes.map((note) => (note.id === next.id ? next : note));
}

function blankNote(now: number): GuestNoteRecord {
  return { id: createClientId(), content: "", createdAt: now, updatedAt: now };
}

function tombstone(note: GuestNoteRecord, now: number): GuestNoteRecord {
  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: nextUpdatedAt(note.updatedAt, now),
    deletedAt: now,
  };
}

function byUpdatedDesc(left: GuestNoteRecord, right: GuestNoteRecord): number {
  return right.updatedAt - left.updatedAt;
}

/** Drops soft-deleted notes whose deletion is older than the purge window. */
export function purgeExpiredNotes(state: GuestState, now: number): GuestState {
  const cutoff = now - GUEST_PURGE_AFTER_MS;
  const notes = state.notes.filter(
    (note) => note.deletedAt === undefined || note.deletedAt > cutoff,
  );
  return notes.length === state.notes.length ? state : { ...state, notes };
}

/**
 * Keeps the state usable: purges expired notes, points the active id at a live note,
 * and makes sure at least one live note exists (a blank one if needed).
 */
export function normalizeGuestState(state: GuestState, now: number): GuestState {
  const purged = purgeExpiredNotes(state, now);
  if (findLive(purged, purged.activeId)) return purged;

  const live = purged.notes.filter(isLive).sort(byUpdatedDesc);
  const fallback = live.find((note) => !isBlankContent(note.content)) ?? live[0];
  if (fallback) return { ...purged, activeId: fallback.id };

  const blank = blankNote(now);
  return { notes: [...purged.notes, blank], activeId: blank.id };
}

/** A blank note being left never had content, so it is dropped rather than kept around. */
function notesWithoutBlankActive(state: GuestState, now: number): GuestNoteRecord[] {
  const previous = findLive(state, state.activeId);
  if (!previous || !isBlankContent(previous.content)) return state.notes;
  return replaceNote(state.notes, tombstone(previous, now));
}

export function selectNote(state: GuestState, id: string, now: number): GuestState {
  if (state.activeId === id || !findLive(state, id)) return state;
  return { notes: notesWithoutBlankActive(state, now), activeId: id };
}

export function createBlankNote(state: GuestState, now: number): GuestState {
  const blank = blankNote(now);
  return { notes: [...notesWithoutBlankActive(state, now), blank], activeId: blank.id };
}

export function updateActiveContent(state: GuestState, content: string, now: number): GuestState {
  const active = findLive(state, state.activeId);
  if (!active || active.content === content) return state;
  const next = { ...active, content, updatedAt: nextUpdatedAt(active.updatedAt, now) };
  return { ...state, notes: replaceNote(state.notes, next) };
}

export function removeNote(state: GuestState, id: string, now: number): GuestState {
  const target = findLive(state, id);
  if (!target) return state;
  const notes = replaceNote(state.notes, tombstone(target, now));
  const activeId = state.activeId === id ? undefined : state.activeId;
  return normalizeGuestState({ notes, activeId }, now);
}

export function restoreNote(state: GuestState, id: string, now: number): GuestState {
  const target = state.notes.find((note) => note.id === id);
  if (!target || isLive(target)) return state;
  const restored: GuestNoteRecord = {
    id: target.id,
    content: target.content,
    createdAt: target.createdAt,
    updatedAt: nextUpdatedAt(target.updatedAt, now),
  };
  return { notes: replaceNote(notesWithoutBlankActive(state, now), restored), activeId: id };
}

/** The list the UI shows: live notes, with blank notes only while they are active. */
export function visibleGuestNotes(state: GuestState): NoteSummary[] {
  return sortNoteSummaries(
    state.notes
      .filter(
        (note) => isLive(note) && (!isBlankContent(note.content) || note.id === state.activeId),
      )
      .map((note) => summarizeNote(note)),
  );
}

export function activeGuestNote(state: GuestState): Note | null {
  const active = findLive(state, state.activeId);
  if (!active) return null;
  return {
    id: active.id,
    content: active.content,
    createdAt: active.createdAt,
    updatedAt: active.updatedAt,
  };
}

/** Ids whose record changed between two states. Records are replaced, never mutated. */
export function changedNoteIds(previous: GuestState, next: GuestState): string[] {
  const before = new Map(previous.notes.map((note) => [note.id, note]));
  return next.notes.filter((note) => before.get(note.id) !== note).map((note) => note.id);
}

function newerOf(
  local: GuestNoteRecord | undefined,
  stored: GuestNoteRecord | undefined,
): GuestNoteRecord | undefined {
  if (!local) return stored;
  if (!stored) return local;
  return local.updatedAt >= stored.updatedAt ? local : stored;
}

/**
 * Combines storage with this tab's in-memory state. Storage is the source of truth, except
 * for notes this tab changed and has not written yet (`dirty`). For those, the newer copy
 * wins. This keeps edits from other tabs, and a sign-in migration, from being overwritten.
 */
export function mergeGuestState(
  storage: GuestState,
  memory: GuestState,
  dirty: ReadonlySet<string>,
): GuestState {
  const stored = new Map(storage.notes.map((note) => [note.id, note]));
  const local = new Map(memory.notes.map((note) => [note.id, note]));
  const ids = new Set([...Array.from(stored.keys()), ...Array.from(dirty)]);

  const notes: GuestNoteRecord[] = [];
  ids.forEach((id) => {
    const picked = newerOf(dirty.has(id) ? local.get(id) : undefined, stored.get(id));
    if (picked) notes.push(picked);
  });

  const activeId = findLive({ notes }, memory.activeId) ? memory.activeId : undefined;
  return { notes, activeId };
}

```

## src/lib/store/logic.ts

```typescript
import { deriveTitle, type Note, type NoteSummary } from "@/lib/types";

export function deriveNoteTitle(content: string): string {
  return deriveTitle(content);
}

export function summarizeNote(note: Pick<Note, "id" | "content" | "updatedAt">): NoteSummary {
  return {
    id: note.id,
    title: deriveNoteTitle(note.content),
    updatedAt: note.updatedAt,
  };
}

export function sortNoteSummaries(notes: readonly NoteSummary[]): NoteSummary[] {
  return [...notes].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function isBlankContent(content: string): boolean {
  return content.trim().length === 0;
}

export function nextUpdatedAt(previous: number, now = Date.now()): number {
  return Math.max(now, previous + 1);
}

export function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Older browsers may not expose randomUUID even when crypto itself is available.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

```

## src/lib/store/prefs.ts

```typescript
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { UiPrefs } from "@/lib/types";

export const UI_PREFS_STORAGE_KEY = "notes:ui:v1";
export const UI_PREFS_SCHEMA_VERSION = 1;

export const defaultUiPrefs: UiPrefs = {
  previewOpen: false,
  sidebarOpen: true,
  // The app is light until the visitor picks dark with the theme toggle. The OS colour scheme is never read.
  theme: "light",
  font: "hand",
  size: "medium",
};

const FONT_OPTIONS: readonly UiPrefs["font"][] = ["hand", "sans", "serif", "mono"];
const SIZE_OPTIONS: readonly UiPrefs["size"][] = ["small", "medium", "large", "xlarge"];

function isSize(value: unknown): value is UiPrefs["size"] {
  return SIZE_OPTIONS.some((option) => option === value);
}

function isFont(value: unknown): value is UiPrefs["font"] {
  return FONT_OPTIONS.some((option) => option === value);
}

function isTheme(value: unknown): value is UiPrefs["theme"] {
  return value === "light" || value === "dark";
}

/** Prefs for a visitor with nothing stored yet. A missing, invalid or legacy "system" theme is light. */
function unsetPrefs(): UiPrefs {
  return { ...defaultUiPrefs };
}

const subscribers = new Set<() => void>();
let cachedSnapshot: UiPrefs | null = null;

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseUiPrefs(raw: string | null): UiPrefs {
  if (!raw) return unsetPrefs();

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return unsetPrefs();

    const candidate = value as Record<string, unknown>;
    return {
      previewOpen:
        typeof candidate.previewOpen === "boolean"
          ? candidate.previewOpen
          : defaultUiPrefs.previewOpen,
      sidebarOpen:
        typeof candidate.sidebarOpen === "boolean"
          ? candidate.sidebarOpen
          : defaultUiPrefs.sidebarOpen,
      theme: isTheme(candidate.theme) ? candidate.theme : defaultUiPrefs.theme,
      font: isFont(candidate.font) ? candidate.font : defaultUiPrefs.font,
      size: isSize(candidate.size) ? candidate.size : defaultUiPrefs.size,
    };
  } catch {
    return unsetPrefs();
  }
}

export function readUiPrefs(): UiPrefs {
  const storage = getLocalStorage();
  if (!storage) return unsetPrefs();

  try {
    return parseUiPrefs(storage.getItem(UI_PREFS_STORAGE_KEY));
  } catch {
    return unsetPrefs();
  }
}

function notifySubscribers(): void {
  for (const notify of subscribers) notify();
}

export function writeUiPrefs(prefs: UiPrefs): boolean {
  const next: UiPrefs = {
    previewOpen: Boolean(prefs.previewOpen),
    sidebarOpen: Boolean(prefs.sidebarOpen),
    theme: isTheme(prefs.theme) ? prefs.theme : defaultUiPrefs.theme,
    font: isFont(prefs.font) ? prefs.font : defaultUiPrefs.font,
    size: isSize(prefs.size) ? prefs.size : defaultUiPrefs.size,
  };
  cachedSnapshot = next;

  const storage = getLocalStorage();
  if (!storage) {
    notifySubscribers();
    return false;
  }

  let persisted = false;
  try {
    storage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(next));
    persisted = true;
  } catch {
    // Keep the in-memory preference so the current tab remains responsive.
  }
  notifySubscribers();
  return persisted;
}

export function updateUiPrefs(updates: Partial<UiPrefs>): boolean {
  return writeUiPrefs({ ...readSnapshot(), ...updates });
}

function readSnapshot(): UiPrefs {
  if (cachedSnapshot) return cachedSnapshot;
  cachedSnapshot = readUiPrefs();
  return cachedSnapshot;
}

function getSnapshot(): UiPrefs {
  if (typeof window === "undefined") return defaultUiPrefs;
  return readSnapshot();
}

function getServerSnapshot(): UiPrefs {
  return defaultUiPrefs;
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UI_PREFS_STORAGE_KEY && event.key !== null) return;
    cachedSnapshot = readUiPrefs();
    notify();
  };

  if (typeof window !== "undefined") {
    cachedSnapshot = readUiPrefs();
    window.addEventListener("storage", onStorage);
  }

  return () => {
    subscribers.delete(notify);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export interface PrefsStore {
  prefs: UiPrefs;
  setPrefs: (next: UiPrefs | ((current: UiPrefs) => UiPrefs)) => boolean;
  updatePrefs: (updates: Partial<UiPrefs>) => boolean;
}

export function usePrefs(): PrefsStore {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setPrefs = useCallback(
    (next: UiPrefs | ((current: UiPrefs) => UiPrefs)) =>
      writeUiPrefs(typeof next === "function" ? next(readSnapshot()) : next),
    [],
  );
  const updatePrefs = useCallback((updates: Partial<UiPrefs>) => updateUiPrefs(updates), []);

  return { prefs, setPrefs, updatePrefs };
}

```

## src/lib/store/useNoteStore.ts

```typescript
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NoteStore, SaveResult } from "@/lib/types";
import { useSession } from "@/lib/auth-client";
import { migrateGuestOnce, resetGuestMigration } from "@/lib/sync/migrateGuest";
import { cloudCacheKey } from "@/lib/store/cloudCache";
import { EMPTY_CLOUD_SNAPSHOT, createCloudSession, type CloudSession } from "@/lib/store/cloudSession";
import {
  GUEST_LEGACY_STORAGE_KEY,
  GUEST_STORAGE_KEY,
  readGuestState,
  writeGuestState,
} from "@/lib/store/guest";
import {
  EMPTY_GUEST_STATE,
  activeGuestNote,
  changedNoteIds,
  createBlankNote,
  mergeGuestState,
  normalizeGuestState,
  removeNote,
  restoreNote,
  selectNote,
  updateActiveContent,
  visibleGuestNotes,
  type GuestState,
} from "@/lib/store/guestState";
import { isBlankContent } from "@/lib/store/logic";

const GUEST_SAVE_DELAY = 300;

interface GuestModel {
  state: GuestState;
  /** Guest notes never leave the device, so the only failure is a storage write. */
  saveState: "idle" | "error";
  /** False until guest notes have been read from storage. */
  loaded: boolean;
}

const initialGuestModel: GuestModel = { state: EMPTY_GUEST_STATE, saveState: "idle", loaded: false };

export function useNoteStore(): NoteStore {
  const { data: session, isPending } = useSession();
  const accountUserId = session?.user?.id ?? null;
  const accountMode = Boolean(accountUserId);
  // better-auth sets isPending again on every refetch while signed out, so latch the first
  // settled session. Otherwise `ready` would drop mid-typing for guests.
  const [sessionSettled, setSessionSettled] = useState(false);
  if (!isPending && !sessionSettled) setSessionSettled(true);

  // ---- guest mode (localStorage v2, saved on every edit) ----

  const [guest, setGuest] = useState<GuestModel>(initialGuestModel);
  const guestRef = useRef<GuestModel>(initialGuestModel);
  const guestDirtyRef = useRef(new Set<string>());
  const guestPendingRef = useRef(false);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitGuest = useCallback((next: GuestModel) => {
    guestRef.current = next;
    setGuest(next);
  }, []);

  const cancelGuestTimer = useCallback(() => {
    if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    guestTimerRef.current = null;
  }, []);

  // Writes this tab's pending changes, merged with whatever other tabs have stored.
  const flushGuest = useCallback(() => {
    cancelGuestTimer();
    if (!guestPendingRef.current) return;

    const now = Date.now();
    const merged = normalizeGuestState(
      mergeGuestState(readGuestState(now), guestRef.current.state, guestDirtyRef.current),
      now,
    );
    const written = writeGuestState(merged);
    if (written) {
      guestDirtyRef.current.clear();
      guestPendingRef.current = false;
    }
    commitGuest({ ...guestRef.current, state: merged, saveState: written ? "idle" : "error" });
  }, [cancelGuestTimer, commitGuest]);

  // Structural changes (select, create, remove, restore) save at once. Typing is debounced.
  const applyGuest = useCallback(
    (next: GuestState, immediate: boolean) => {
      const previous = guestRef.current.state;
      if (next === previous) return;

      for (const id of changedNoteIds(previous, next)) guestDirtyRef.current.add(id);
      guestPendingRef.current = true;
      commitGuest({ ...guestRef.current, state: next, saveState: "idle" });

      cancelGuestTimer();
      if (immediate) flushGuest();
      else guestTimerRef.current = setTimeout(flushGuest, GUEST_SAVE_DELAY);
    },
    [cancelGuestTimer, commitGuest, flushGuest],
  );

  // Reloads guest notes from storage. Runs on mount and after sign-out, so notes that were
  // migrated to the account are not shown again from memory.
  const hydrateGuest = useCallback(() => {
    flushGuest();
    guestDirtyRef.current.clear();
    guestPendingRef.current = false;
    const now = Date.now();
    commitGuest({
      state: normalizeGuestState(readGuestState(now), now),
      saveState: "idle",
      loaded: true,
    });
  }, [commitGuest, flushGuest]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (
        event.key !== GUEST_STORAGE_KEY &&
        event.key !== GUEST_LEGACY_STORAGE_KEY &&
        event.key !== null
      ) {
        return;
      }
      const now = Date.now();
      const merged = normalizeGuestState(
        mergeGuestState(readGuestState(now), guestRef.current.state, guestDirtyRef.current),
        now,
      );
      commitGuest({ ...guestRef.current, state: merged });
    };
    const onPageHide = () => flushGuest();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushGuest();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      flushGuest();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [commitGuest, flushGuest]);

  // ---- account mode (per-user cache in localStorage, saved to the database on Save) ----

  // The session belongs to one user. Signing out or switching users makes it stop matching, so the
  // previous user's notes are never shown, even in the render before the effect swaps it.
  const [cloud, setCloud] = useState<CloudSession | null>(null);
  // Derived during render, so the session matches the signed-in user before anything commits.
  if (accountUserId === null ? cloud !== null : cloud?.userId !== accountUserId) {
    setCloud(accountUserId === null ? null : createCloudSession(accountUserId));
  }
  const activeCloud = cloud !== null && cloud.userId === accountUserId ? cloud : null;

  const subscribeCloud = useCallback(
    (listener: () => void) => (activeCloud ? activeCloud.subscribe(listener) : () => undefined),
    [activeCloud],
  );
  const cloudSnapshot = useSyncExternalStore(
    subscribeCloud,
    () => (activeCloud ? activeCloud.getSnapshot() : EMPTY_CLOUD_SNAPSHOT),
    () => EMPTY_CLOUD_SNAPSHOT,
  );

  // Sign-out and sign-in: guest memory is reset, pending guest edits are written first.
  useEffect(() => {
    if (!accountUserId) {
      resetGuestMigration();
      // Syncing guest state from localStorage on sign-out is an external-system sync, not derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      hydrateGuest();
      return;
    }
    // Guest memory is not used while signed in; the guest keys stay for the migration to read.
    flushGuest();
    commitGuest({ ...initialGuestModel, loaded: false });
  }, [accountUserId, commitGuest, flushGuest, hydrateGuest]);

  // Each session starts once the guest migration has run, so migrated notes are in the list.
  useEffect(() => {
    if (!cloud || cloud.userId !== accountUserId) return;
    const session = cloud;
    let active = true;
    void migrateGuestOnce(session.userId)
      .catch(() => undefined)
      .then(() => {
        if (active) session.start();
      });

    const onPageHide = () => session.flush();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") session.flush();
    };
    const onOnline = () => {
      void session.refresh();
      session.retryDeletes();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === cloudCacheKey(session.userId) || event.key === null) {
        session.handleExternalChange();
      }
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
      session.dispose();
    };
  }, [cloud, accountUserId]);

  // ---- store API ----

  const select = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.select(id);
        return;
      }
      applyGuest(selectNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const create = useCallback(() => {
    if (accountMode) {
      activeCloud?.create();
      return;
    }
    applyGuest(createBlankNote(guestRef.current.state, Date.now()), true);
  }, [accountMode, activeCloud, applyGuest]);

  const update = useCallback(
    (content: string) => {
      if (accountMode) {
        activeCloud?.update(content);
        return;
      }
      applyGuest(updateActiveContent(guestRef.current.state, content, Date.now()), false);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const remove = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.remove(id);
        return;
      }
      applyGuest(removeNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const restore = useCallback(
    (id: string) => {
      if (accountMode) {
        activeCloud?.restore(id);
        return;
      }
      applyGuest(restoreNote(guestRef.current.state, id, Date.now()), true);
    },
    [accountMode, activeCloud, applyGuest],
  );

  const save = useCallback(async (): Promise<SaveResult> => {
    if (accountMode) {
      return activeCloud ? activeCloud.save() : { ok: false, reason: "error" };
    }
    // Guest notes are only on this device: saving needs an account, and makes no request.
    const active = activeGuestNote(guestRef.current.state);
    if (!active || isBlankContent(active.content)) return { ok: false, reason: "empty" };
    return { ok: false, reason: "signed-out" };
  }, [accountMode, activeCloud]);

  const guestActive = useMemo(() => activeGuestNote(guest.state), [guest.state]);
  const guestNotes = useMemo(() => visibleGuestNotes(guest.state), [guest.state]);
  const guestHasContent = guestActive !== null && !isBlankContent(guestActive.content);

  if (accountMode) {
    return {
      mode: "account",
      notes: cloudSnapshot.notes,
      activeNote: cloudSnapshot.activeNote,
      activeNotePersisted: cloudSnapshot.activeNotePersisted === true,
      saveState: cloudSnapshot.saveState,
      ready: sessionSettled && cloudSnapshot.ready,
      dirty: cloudSnapshot.dirty,
      select,
      create,
      update,
      remove,
      restore,
      save,
    };
  }

  return {
    mode: "guest",
    notes: guestNotes,
    activeNote: guestActive,
    activeNotePersisted: false,
    saveState: guest.saveState === "error" ? "error" : guestHasContent ? "unsaved" : "idle",
    ready: sessionSettled && guest.loaded,
    dirty: guestHasContent,
    select,
    create,
    update,
    remove,
    restore,
    save,
  };
}

```

## src/lib/sync/client.ts

```typescript
import { z } from "zod";

import type { Note, NoteSummary } from "@/lib/types";

export type NotesApiErrorKind =
  | "offline"
  | "unauthorized"
  | "server"
  | "not-found"
  | "validation";

export class NotesApiError extends Error {
  readonly kind: NotesApiErrorKind;
  readonly status: number | undefined;

  constructor(kind: NotesApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "NotesApiError";
    this.kind = kind;
    this.status = status;
  }
}

const noteSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const noteSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  updatedAt: z.number(),
});

async function fetchResponse(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(input, { credentials: "same-origin", ...init });
  } catch {
    throw new NotesApiError("offline", "The notes service could not be reached.");
  }

  if (!response.ok) {
    let message = `Notes API request failed (${response.status}).`;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // The HTTP status still carries the useful error classification.
    }

    if (response.status === 401) {
      throw new NotesApiError("unauthorized", message, response.status);
    }
    if (response.status === 404) {
      throw new NotesApiError("not-found", message, response.status);
    }
    if (response.status >= 500) {
      throw new NotesApiError("server", message, response.status);
    }
    throw new NotesApiError("validation", message, response.status);
  }

  return response;
}

async function parseJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new NotesApiError("server", "The notes service returned an invalid response.");
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new NotesApiError("server", "The notes service returned an unexpected response.");
  }
  return result.data;
}

export async function fetchNotes(): Promise<NoteSummary[]> {
  const response = await fetchResponse("/api/notes", { cache: "no-store" });
  return parseJson(response, z.array(noteSummarySchema));
}

export async function fetchNote(id: string): Promise<Note> {
  const response = await fetchResponse(`/api/notes/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  return parseJson(response, noteSchema);
}

export async function saveNote(note: Pick<Note, "id" | "content" | "updatedAt">): Promise<Note> {
  const response = await fetchResponse(`/api/notes/${encodeURIComponent(note.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: note.content, updatedAt: note.updatedAt }),
  });
  return parseJson(response, noteSchema);
}

export async function deleteNote(id: string): Promise<void> {
  await fetchResponse(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

```

## src/lib/sync/migrateGuest.ts

```typescript
import { dropSyncedGuestNotes, readGuestState } from "@/lib/store/guest";
import type { GuestNoteRecord } from "@/lib/store/guestState";
import { isBlankContent } from "@/lib/store/logic";

import { NotesApiError, saveNote } from "./client";

export interface GuestMigrationResult {
  /** Notes that no longer need guest storage: saved to the account, or deleted there. */
  synced: number;
  /** Notes kept in guest storage for the next attempt. */
  failed: number;
}

/**
 * Sends one guest note to the account. Returns true when the note can leave guest storage.
 * A 404 means this id was deleted on the account with a newer timestamp, so retrying cannot
 * succeed and the note is treated as settled. Other failures (offline, 401, 5xx) are retried.
 */
async function sendGuestNote(note: GuestNoteRecord): Promise<boolean> {
  try {
    await saveNote({ id: note.id, content: note.content, updatedAt: note.updatedAt });
    return true;
  } catch (error) {
    return error instanceof NotesApiError && error.kind === "not-found";
  }
}

/**
 * Moves every non-empty, non-deleted guest note to the account. Each note keeps its own id,
 * so a retry is idempotent. Storage is only changed for notes that were sent unchanged.
 */
export async function migrateGuestNotes(): Promise<GuestMigrationResult> {
  if (typeof window === "undefined") return { synced: 0, failed: 0 };

  const candidates = readGuestState().notes.filter(
    (note) => note.deletedAt === undefined && !isBlankContent(note.content),
  );

  const outcomes = await Promise.all(
    candidates.map(async (note) => ({ note, done: await sendGuestNote(note) })),
  );

  const synced = new Map<string, number>();
  for (const { note, done } of outcomes) {
    if (done) synced.set(note.id, note.updatedAt);
  }
  dropSyncedGuestNotes(synced);

  return { synced: synced.size, failed: candidates.length - synced.size };
}

/** Name kept from the original module so existing imports keep working. */
export const migrateGuestNote = migrateGuestNotes;

interface MigrationRun {
  userId: string;
  result: Promise<GuestMigrationResult>;
}

let currentRun: MigrationRun | null = null;

function forgetRun(run: MigrationRun): void {
  if (currentRun === run) currentRun = null;
}

/**
 * Runs the guest-to-account migration once per signed-in user for this page session.
 * Concurrent calls share one in-flight run (React strict mode runs effects twice). A run
 * that left failures, or threw, is forgotten so the next call retries it.
 */
export function migrateGuestOnce(userId: string): Promise<GuestMigrationResult> {
  if (currentRun && currentRun.userId === userId) return currentRun.result;

  const run: MigrationRun = { userId, result: migrateGuestNotes() };
  currentRun = run;
  void run.result.then(
    (outcome) => {
      if (outcome.failed > 0) forgetRun(run);
    },
    () => forgetRun(run),
  );
  return run.result;
}

/** Forgets the completed run, e.g. on sign-out, so the next sign-in migrates again. */
export function resetGuestMigration(): void {
  currentRun = null;
}

```

## src/lib/types.ts

```typescript
export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteSummary {
  id: string;
  title: string;
  updatedAt: number;
  /** Account mode: this note has edits that are not saved to the database yet. */
  unsaved?: boolean;
}

export type SaveState = "idle" | "unsaved" | "saving" | "saved" | "offline" | "error";

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "signed-out" | "empty" | "offline" | "error"; message?: string };

export interface UiPrefs {
  previewOpen: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  font: "hand" | "sans" | "serif" | "mono";
  size: "small" | "medium" | "large" | "xlarge";
}

export interface NoteStore {
  mode: "guest" | "account";
  notes: NoteSummary[];
  activeNote: Note | null;
  /** Whether the active account note has been saved to the database at least once. */
  activeNotePersisted?: boolean;
  saveState: SaveState;
  ready: boolean;
  /** Active note has edits that are not in the database. Guest mode: true when the note has any content. */
  dirty: boolean;
  select(id: string): void;
  create(): void;
  update(content: string): void;
  remove(id: string): void;
  restore(id: string): void;
  /** Pushes the ACTIVE note to the database. Never throws. Guest: resolves { ok:false, reason:"signed-out" } without any network call. */
  save(): Promise<SaveResult>;
}

export function deriveTitle(content: string): string {
  return content.split(/\r?\n/, 1)[0]?.trim() || "Untitled note";
}

```

## src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```

## src/lib/session.ts

```typescript
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Reads the Better Auth session on the server. Returns null for guests and
 * also when auth isn't configured (missing env), so pages can treat both the
 * same way instead of crashing.
 */
export async function getServerSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

```

## src/lib/auth-client.ts

```typescript
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword, changePassword } = authClient;

```

## src/components/AppShell.tsx

```tsx
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


```

## src/components/NotesSidebar.tsx

```tsx
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


```

## src/components/NoteList.tsx

```tsx
"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { relativeTime } from "@/components/format";
import { MoveIcon } from "@/components/folders/FolderIcons";
import { Icon } from "@/components/Icon";
import { useNow } from "@/components/useNow";
import { cn } from "@/lib/utils";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteSummary } from "@/lib/types";

interface NoteListProps {
  notes: NoteSummary[];
  activeId: string | undefined;
  ready: boolean;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  /** Shows a "Move to folder" button on each row when given. */
  onMove?: (id: string) => void;
  /** Text for an empty list. Pass null to render nothing (used inside folders). */
  emptyText?: string | null;
}

interface NoteRowProps {
  id: string;
  title: string;
  updatedAt: number;
  now: number;
  active: boolean;
  unsaved: boolean;
  /** True for a row that appears after the list has settled: it fades in once, on mount. */
  enter: boolean;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string) => void;
}

// Plain props only, so a row re-renders when its own title, time, active or unsaved state changes, not on every keystroke.
// One line per note: the title. The relative time lives in the tooltip; the trash icon shows on hover or focus.
const NoteRow = memo(function NoteRow({ id, title, updatedAt, now, active, unsaved, enter, onPick, onDelete, onMove }: NoteRowProps) {
  const when = now > 0 ? relativeTime(updatedAt, now) : "";
  // Captured at mount, so a later change of the flag never replays the fade on a row that is already on screen.
  const [fadeIn] = useState(enter);
  // Urdu titles need a taller row (Nastaliq is tall) and right-to-left alignment.
  const urdu = ARABIC_SCRIPT.test(title);
  return (
    <li
      className={cn(
        "group flex items-center rounded-lg transition-colors duration-150",
        urdu ? "h-12 pointer-coarse:h-12" : "h-9 pointer-coarse:h-11",
        fadeIn && "sb-row-in",
        active ? "bg-selected" : "hover:bg-hover",
      )}
    >
      <button
        type="button"
        onClick={() => onPick(id)}
        aria-current={active ? "true" : undefined}
        title={when || undefined}
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          dir="auto"
          lang={urdu ? "ur" : undefined}
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            urdu && "urdu-row",
            active ? "text-foreground" : "text-secondary-foreground",
          )}
        >
          {title}
        </span>
        {unsaved && (
          <span className="inline-flex shrink-0 items-center" title="Unsaved changes">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
            <span className="sr-only">Unsaved changes</span>
          </span>
        )}
      </button>
      {onMove && (
        <button
          type="button"
          aria-label={`Move note to a folder: ${title}`}
          title="Move to folder"
          onClick={() => onMove(id)}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-100 outline-none transition-[color,opacity] duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
        >
          <MoveIcon />
        </button>
      )}
      <button
        type="button"
        aria-label={`Delete note: ${title}`}
        onClick={() => onDelete(id)}
        className="mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-100 outline-none transition-[color,opacity] duration-150 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
      >
        <Icon icon={Delete02Icon} />
      </button>
    </li>
  );
});

export const NoteList = memo(function NoteList({
  notes,
  activeId,
  ready,
  onPick,
  onDelete,
  onMove,
  emptyText,
}: NoteListProps) {
  // Changes once a minute at most, so only the rows' time labels are touched by it.
  const now = useNow();
  // Rows that mount after the first settled render fade in. The first list, shown with the page, does not.
  const settled = useRef(false);
  useEffect(() => {
    if (ready && notes.length > 0) settled.current = true;
  });

  if (!ready) {
    return (
      <div className="flex flex-col gap-1" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-lg bg-hover" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    if (emptyText === null) return null;
    return (
      <p className="px-2.5 py-3 text-sm leading-6 text-muted-foreground">
        {emptyText ?? "No notes yet. Start writing and it will appear here."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => (
        <NoteRow
          key={note.id}
          id={note.id}
          title={note.title}
          updatedAt={note.updatedAt}
          now={now}
          active={note.id === activeId}
          unsaved={note.unsaved === true}
          enter={settled.current}
          onPick={onPick}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </ul>
  );
});


```

## src/components/DeleteNoteDialog.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteNoteDialogProps {
  /** The note waiting for an answer, or null when the dialog is closed. */
  note: { id: string; title: string } | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Asks before a note is deleted. Cancel holds the first focus, so a stray Enter never deletes. The undo toast that
 * follows a confirmed delete stays as a second safety net.
 */
export function DeleteNoteDialog({ note, onCancel, onConfirm }: DeleteNoteDialogProps) {
  return (
    <Dialog open={note !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu"
      >
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Delete this note?</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-foreground">
            <span className="font-medium text-foreground break-words">“{note?.title}”</span> will be removed. You can
            undo this right after.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 sm:h-9"
            onClick={() => note && onConfirm(note.id)}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

## src/components/WritingPad.tsx

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { formatSize } from "@/components/format";
import { FormatToolbar } from "@/components/editor/FormatToolbar";
import { EMPTY_FORMATS, type FormatState } from "@/components/editor/formatTypes";
import { ExportMenu } from "@/components/ExportMenu";
import { splitNote } from "@/components/exportNote";
import { Icon } from "@/components/Icon";
import { SharePopover, type ShareController } from "@/components/share/SharePopover";
import { SaveButton, useSaveAction } from "@/components/SaveButton";
import { UrduToggle } from "@/components/UrduToggle";
import { useWideScreen } from "@/components/useWideScreen";
import "./WritingPad.css";
import { cn } from "@/lib/utils";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";
import type { NoteStore } from "@/lib/types";
import type { NoteEditorHandle } from "@/components/editor/NoteEditor";

// The editor is CodeMirror. It loads on the client only, after the pad is on screen. The skeleton is one empty
// 28px row, the same as an empty note, so nothing moves when the editor mounts.
const NoteEditor = dynamic(() => import("@/components/editor/NoteEditor").then((mod) => mod.NoteEditor), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-7 min-w-0 flex-1" />,
});

interface StatusView {
  label: string;
  dot?: string;
  spinning?: boolean;
}

/**
 * What the bottom strip says. Guest: the note lives on this device. Account: the save state. An empty note says
 * nothing.
 */
function statusFor(store: Pick<NoteStore, "mode" | "saveState">, empty: boolean): StatusView | null {
  if (store.mode === "guest") return empty ? null : { label: "On this device", dot: "bg-muted-foreground/60" };
  switch (store.saveState) {
    case "saving":
      return { label: "Saving…", spinning: true };
    case "unsaved":
      return { label: "Unsaved changes", dot: "bg-warning" };
    case "offline":
      return { label: "Offline — not saved", dot: "bg-warning" };
    case "error":
      return { label: "Couldn't save", dot: "bg-destructive" };
    default:
      return empty ? null : { label: "All changes saved", dot: "bg-success" };
  }
}

/** Joins the two fields back into the stored string. An empty note stays an empty string. */
function joinNote(title: string, body: string): string {
  if (title === "" && body === "") return "";
  return `${title}\n${body}`;
}

/** What the shell can ask of the pad. Focus goes to the title of an empty note, otherwise to the end of the body. */
export interface WritingPadHandle {
  focusNote: () => void;
}

/** The margin rule sits this far from the pad's left edge. The text starts 12px to its right. */
const MARGIN_RULE = "clamp(14px, 2.5vw, 32px)";

interface WritingPadProps {
  store: NoteStore;
  handleRef: RefObject<WritingPadHandle | null>;
  shareController: ShareController;
}

export function WritingPad({ store, handleRef, shareController }: WritingPadProps) {
  const wide = useWideScreen();
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<NoteEditorHandle>(null);
  // What the caret is inside right now (bold, a heading ...). The editor reports it; the toolbar lights its buttons.
  const [formats, setFormats] = useState<FormatState>(EMPTY_FORMATS);
  // Caret to set in the body after a multi-line paste into the title. Applied once the body has re-rendered.
  const pendingBodyCaret = useRef<number | null>(null);
  // A focus request ran before the editor finished loading. The editor takes it when it is ready.
  const pendingEditorFocus = useRef<"start" | "end" | null>(null);
  // One save path for the pad's button and Cmd/Ctrl+S. Its sign-in prompt is rendered once, below.
  const save = useSaveAction(store);

  const content = store.activeNote?.content ?? "";
  const { title, body } = useMemo(() => splitNote(content), [content]);
  const size = useMemo(() => formatSize(content), [content]);
  const empty = content.trim() === "";
  const status = statusFor(store, empty);
  // Signed in with notes but none open yet: the note is still loading, so typing would be lost.
  const locked = store.mode === "account" && !store.activeNote && store.notes.length > 0;
  const readOnly = !store.ready || locked;

  useLayoutEffect(() => {
    const caret = pendingBodyCaret.current;
    if (caret === null) return;
    pendingBodyCaret.current = null;
    editorRef.current?.focusAt(caret);
  });

  // Writes both fields back as one string, so the store, sync and sidebar only ever see title + "\n" + body.
  function commit(nextTitle: string, nextBody: string) {
    // Signed in with no notes yet: the first keystroke creates one.
    if (!store.activeNote) store.create();
    store.update(joinNote(nextTitle, nextBody));
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    commit(event.target.value, body);
  }

  function handleBodyChange(nextBody: string) {
    commit(title, nextBody);
  }

  function focusTitleEnd() {
    const input = titleRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  // The editor takes focus now, or once it has loaded.
  const focusEditor = useCallback((where: "start" | "end") => {
    const editor = editorRef.current;
    if (!editor) {
      pendingEditorFocus.current = where;
    } else if (where === "start") {
      editor.focusStart();
    } else {
      editor.focusEnd();
    }
  }, []);

  const focusEditorEnd = useCallback(() => focusEditor("end"), [focusEditor]);

  const onEditorReady = useCallback(() => {
    const where = pendingEditorFocus.current;
    if (!where) return;
    pendingEditorFocus.current = null;
    focusEditor(where);
  }, [focusEditor]);

  // An empty title takes focus (new notes, first load, empty notes). Otherwise the caret goes to the end of the body.
  // Reads the DOM, so callers must flush the store update first.
  const focusNote = useCallback(() => {
    const input = titleRef.current;
    if (!input) return;
    if (input.value === "") {
      input.focus();
      input.setSelectionRange(0, 0);
    } else {
      focusEditorEnd();
    }
  }, [focusEditorEnd]);

  useImperativeHandle(handleRef, () => ({ focusNote }), [focusNote]);

  // First load: focus the note once the store has loaded it. Editing is locked until then.
  useEffect(() => {
    if (store.ready) focusNote();
  }, [store.ready, focusNote]);

  // Enter, or Arrow Down at the end of the title, moves focus to the start of the body.
  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const atEnd = selectionStart === value.length && selectionEnd === value.length;
    if (event.key === "Enter" || (event.key === "ArrowDown" && atEnd)) {
      event.preventDefault();
      editorRef.current?.focusStart();
    }
  }

  // A multi-line paste into the title: the first line stays in the title, the rest opens the body.
  function handleTitlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    const lineBreak = text.indexOf("\n");
    if (lineBreak === -1) return; // One line pastes as usual.
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    const start = selectionStart ?? title.length;
    const end = selectionEnd ?? start;
    const restOfPaste = text.slice(lineBreak + 1);
    // Title text after the caret moves down into the body, behind the rest of the paste.
    const bodyHead = restOfPaste + title.slice(end);
    commit(
      title.slice(0, start) + text.slice(0, lineBreak),
      body ? `${bodyHead}\n${body}` : bodyHead,
    );
    pendingBodyCaret.current = restOfPaste.length;
  }

  // Cmd/Ctrl+S saves the note to the account (or opens the sign-in prompt). It never downloads a file, and the
  // browser's save dialog stays shut.
  function handlePadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    if (event.key.toLowerCase() !== "s") return;
    event.preventDefault();
    void save.run();
  }

  // Clicks on the title keep their own caret. Clicks in the pad outside the text (the empty space below it, the
  // margins, the strip) put the caret at the end of the body. Clicks in portals (the sign-in prompt, the export
  // menu) are not in the pad's DOM, so they are ignored here.
  function focusPad(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Node) || !event.currentTarget.contains(target)) return;
    if (target instanceof Element && target.closest(".cm-editor, input, button, a")) return;
    focusEditorEnd();
  }

  // Urdu titles get their own size and line box, and no letter-spacing (see .urdu-title in globals.css).
  const urduTitle = ARABIC_SCRIPT.test(title);

  return (
    // The pad is a fixed sheet: border, radius and shadow stay put. Only the ruled sheet scrolls, so the bottom strip
    // is never over the text and the caret can't hide behind it.
    <div
      onClick={focusPad}
      onKeyDown={handlePadKeyDown}
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-pad"
    >
      {/* The formatting panel sits above the sheet, outside the scrolling part, so it is always in reach. */}
      <FormatToolbar state={formats} disabled={readOnly} onCommand={(id) => editorRef.current?.format(id)} />

      <div
        onScroll={() => editorRef.current?.refresh()}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* One ruled sheet for the title and the body: same 28px grid, same insets, so no rule breaks at the boundary. */}
        <div
          className="notepad relative flex min-h-full flex-col pt-3 pr-4 pad-gutter"
          style={{ paddingLeft: `calc(${MARGIN_RULE} + 12px)` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: MARGIN_RULE }}
          />

          {/* Title row: two 28px rules tall. The title text sits on the second rule. Share and Save sit at the right. */}
          <div className="relative h-14 shrink-0">
            <input
              ref={titleRef}
              type="text"
              aria-label="Note title"
              dir="auto"
              lang={urduTitle ? "ur" : undefined}
              placeholder={store.ready ? "Untitled note" : undefined}
              autoComplete="off"
              spellCheck
              value={title}
              readOnly={readOnly}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onPaste={handleTitlePaste}
              className={cn(
                "pad-title-reserve block h-14 w-full text-ellipsis bg-transparent pt-4 text-[1.75rem] leading-[36px] font-semibold tracking-[-0.01em] text-secondary-foreground caret-brand outline-none placeholder:font-medium placeholder:text-muted-foreground",
                urduTitle && "urdu-title",
              )}
              style={{ paddingRight: wide ? "12rem" : undefined }}
            />
            {/* Desktop-class screens only (CSS, same rule as the shell). Phones use the top-bar controls. */}
            <div className="shell-desk-only absolute top-[1.125rem] right-0 flex items-center gap-1">
              <SharePopover store={store} controller={shareController} />
              <SaveButton store={store} action={save} />
            </div>
          </div>

          {/* One empty 28px rule between the title and the body. Clicking it starts the body. The rules run through it.
              The English | اردو toggle and the keyboard-layout button live here, inside the notebook. */}
          <div className="relative h-7 shrink-0">
            <div
              aria-hidden="true"
              onClick={(event) => {
                event.stopPropagation();
                focusEditor("start");
              }}
              className="absolute inset-0 cursor-text"
            />
            <UrduToggle />
          </div>

          <NoteEditor
            noteId={store.activeNote?.id ?? null}
            value={body}
            readOnly={readOnly}
            placeholder={store.ready ? "Start writing…" : ""}
            onChange={handleBodyChange}
            onAtTop={focusTitleEnd}
            onReady={onEditorReady}
            onFormatState={setFormats}
            handleRef={editorRef}
          />
        </div>
      </div>

      {/* The strip is outside the scrolling sheet. Its height is 32px, or 56px plus the home-indicator inset on phones. */}
      <div className="pad-strip flex shrink-0 items-center justify-between gap-2 px-3">
        <Link
          href="/about"
          prefetch={false}
          className="inline-flex min-h-7 shrink-0 items-center rounded-sm text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          About Likho
        </Link>
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-pad/90 px-1.5 text-xs text-muted-foreground tabular-nums">
          <ExportMenu content={content} />
          <span className="hidden min-[360px]:inline">{size}</span>
          {status ? (
            <span aria-hidden="true" className="hidden min-[360px]:inline">
              ·
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5">
            {status?.spinning ? (
              <Icon icon={Loading03Icon} className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : status?.dot ? (
              <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
            ) : null}
            <span role="status" aria-live="polite" className="truncate">
              {status?.label ?? ""}
            </span>
          </span>
        </div>
      </div>

      {save.prompt}
    </div>
  );
}


```

## src/components/SaveButton.tsx

```tsx
"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { toast } from "sonner";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { iconButtonClass } from "@/components/styles";
import { SaveRequiredPrompt } from "@/components/SaveRequiredPrompt";
import { cn } from "@/lib/utils";
import type { NoteStore } from "@/lib/types";

export type SaveStore = Pick<NoteStore, "mode" | "dirty" | "saveState" | "save" | "activeNote">;

export interface SaveAction {
  /** Saves the active note, or opens the sign-in prompt for a signed-out visitor. The button and Ctrl/Cmd+S both call it. */
  run: () => Promise<void>;
  /** The sign-in prompt. Render it once per SaveAction. SaveButton renders it when it owns the action. */
  prompt: ReactNode;
  /** Attached to the button, so the prompt can hang from it. */
  anchorRef: RefObject<HTMLButtonElement | null>;
  /** Text for the polite live region: "Saving", "Saved" or "Couldn't save". Empty when nothing is announced. */
  announcement: string;
}

const OFFLINE_MESSAGE = "You're offline — your note is kept on this device. Try again when you're back online.";
const ERROR_MESSAGE = "Couldn't save. Your note is still on this device.";

/**
 * The one code path for saving: the Save button and Ctrl/Cmd+S both call run(). It owns the sign-in prompt and the
 * toasts, so neither is duplicated elsewhere.
 */
export function useSaveAction(store: SaveStore): SaveAction {
  const [promptOpen, setPromptOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);

  async function run(): Promise<void> {
    const note = store.activeNote;
    if (!note || note.content.trim() === "") return;
    if (store.saveState === "saving") return;

    // Signed out: save() does no network work and says so. Then the prompt opens, once.
    if (store.mode === "guest") {
      const result = await store.save();
      if (!result.ok && result.reason === "signed-out") setPromptOpen(true);
      return;
    }

    // Signed in and clean: nothing to write. A failed save stays dirty, so it can be retried.
    const retrying = store.saveState === "offline" || store.saveState === "error";
    if (!store.dirty && !retrying) return;

    setAnnouncement("Saving");
    const result = await store.save();
    if (result.ok) {
      setAnnouncement("Saved");
      toast.success("Saved to your account");
      return;
    }
    if (result.reason === "signed-out") {
      setAnnouncement("");
      setPromptOpen(true);
      return;
    }
    setAnnouncement("Couldn't save");
    if (result.reason === "offline") toast.error(OFFLINE_MESSAGE);
    else if (result.reason === "error") toast.error(ERROR_MESSAGE);
  }

  return {
    run,
    prompt: <SaveRequiredPrompt open={promptOpen} onOpenChange={setPromptOpen} anchorRef={anchorRef} />,
    anchorRef,
    announcement,
  };
}

type View = "empty" | "guest" | "dirty" | "saving" | "saved" | "retry";

function viewOf(store: SaveStore): View {
  const note = store.activeNote;
  if (!note || note.content.trim() === "") return "empty";
  if (store.mode === "guest") return "guest";
  if (store.saveState === "saving") return "saving";
  if (store.saveState === "offline" || store.saveState === "error") return "retry";
  if (store.dirty || store.saveState === "unsaved") return "dirty";
  return "saved";
}

const LABEL: Record<View, string> = {
  empty: "Save",
  guest: "Save",
  dirty: "Save",
  saving: "Saving…",
  saved: "Saved",
  retry: "Retry",
};

const TITLE: Partial<Record<View, string>> = {
  empty: "Write something to save it",
  guest: "Save to your account",
  dirty: "Save to your account (Ctrl/⌘+S)",
  retry: "Couldn't save. Try again.",
};

const GLYPH: Record<View, IconSvgElement> = {
  empty: CloudUploadIcon,
  guest: CloudUploadIcon,
  dirty: CloudUploadIcon,
  saving: Loading03Icon,
  saved: CheckmarkCircle02Icon,
  retry: Alert02Icon,
};

const VARIANT: Record<View, string> = {
  empty: "border border-border text-muted-foreground",
  guest: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  dirty: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  saving: "bg-primary text-primary-foreground",
  saved: "text-secondary-foreground",
  retry: "border border-warning/40 bg-warning/10 text-warning hover:bg-warning/15",
};

const COMPACT_TONE: Record<View, string> = {
  empty: "text-muted-foreground",
  guest: "text-secondary-foreground",
  dirty: "text-foreground",
  saving: "text-muted-foreground",
  saved: "text-muted-foreground",
  retry: "text-warning",
};

const COMPACT_DOT: Partial<Record<View, string>> = {
  dirty: "bg-brand",
  retry: "bg-warning",
};

interface SaveButtonProps {
  store: SaveStore;
  /** Icon only, 44px square, for the mobile top bar. */
  compact?: boolean;
  className?: string;
  /** Share another SaveAction (from useSaveAction) so the pad's shortcut and this button use one prompt. */
  action?: SaveAction;
}

/** The Save control. Full variant is a 36px pill with icon and label. Compact is a 44px icon button. */
export function SaveButton({ store, compact = false, className, action }: SaveButtonProps) {
  const own = useSaveAction(store);
  const shared = action;
  const view = viewOf(store);
  const label = LABEL[view];
  const glyph = GLYPH[view];
  const disabled = view === "empty" || view === "saving" || view === "saved";

  const onClick = () => void (shared ? shared.run() : own.run());
  const anchor = shared ? shared.anchorRef : own.anchorRef;
  const announcer = (
    <span aria-live="polite" className="sr-only">
      {shared ? shared.announcement : own.announcement}
    </span>
  );

  if (compact) {
    // Matches the other 44px bar icons: a ghost icon. Dirty or failed saves get a small dot, not a filled disc.
    return (
      <>
        <button
          ref={anchor}
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-busy={view === "saving" || undefined}
          aria-label={label}
          title={label}
          className={cn(iconButtonClass, "relative size-11", COMPACT_TONE[view], className)}
        >
          <Icon icon={glyph} className={cn(view === "saving" && "animate-spin motion-reduce:animate-none")} />
          {COMPACT_DOT[view] ? (
            <span aria-hidden="true" className={cn("absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-canvas", COMPACT_DOT[view])} />
          ) : null}
        </button>
        {announcer}
        {shared ? null : own.prompt}
      </>
    );
  }

  return (
    <>
      <button
        ref={anchor}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={view === "saving" || undefined}
        title={TITLE[view]}
        className={cn(
          "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad disabled:cursor-default motion-reduce:transition-none",
          VARIANT[view],
          className,
        )}
      >
        <Icon icon={glyph} className={cn(view === "saving" && "animate-spin motion-reduce:animate-none")} />
        <span>{label}</span>
      </button>
      {announcer}
      {shared ? null : own.prompt}
    </>
  );
}

```

## src/components/SaveRequiredPrompt.tsx

```tsx
"use client";

import Link from "next/link";
import { useId, type RefObject } from "react";
import { CloudIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { useWideScreen } from "@/components/useWideScreen";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const primaryLink =
  "inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad md:h-10";

const secondaryLink =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad md:h-10";

/** Focus lands on "Sign in", the primary action. Radix would skip the links and pick "Not now". */
function focusSignIn(event: Event) {
  event.preventDefault();
  const root = event.currentTarget;
  if (root instanceof HTMLElement) root.querySelector<HTMLElement>("a[href='/login']")?.focus();
}

interface PromptBodyProps {
  titleId: string;
  descriptionId: string;
  /** Radix Dialog parts for the bottom sheet, so the sheet is named. Plain elements for the popover. */
  inSheet: boolean;
  onNotNow: () => void;
}

function PromptBody({ titleId, descriptionId, inSheet, onNotNow }: PromptBodyProps) {
  const Heading = inSheet ? SheetTitle : "h2";
  const Text = inSheet ? SheetDescription : "p";

  return (
    <div className="flex flex-col gap-4">
      <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon icon={CloudIcon} />
      </span>
      <div className="flex flex-col gap-1.5">
        <Heading id={titleId} className="text-base leading-snug font-semibold text-foreground">
          Sign in to save your notes
        </Heading>
        <Text id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">
          Save your notes to your account and open them on any device. Until you sign in, they stay on this device
          only.
        </Text>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/login" className={primaryLink}>
          Sign in
        </Link>
        <Link href="/login?mode=signup" className={secondaryLink}>
          Create account
        </Link>
      </div>
      <button
        type="button"
        onClick={onNotNow}
        className="inline-flex h-11 items-center self-start rounded-lg px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9"
      >
        Not now
      </button>
    </div>
  );
}

interface SaveRequiredPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Save button the popover hangs from on md+. Focus goes back to it when the prompt closes. */
  anchorRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Shown to a signed-out visitor who presses Save. A popover anchored to the Save button on md+, and a bottom sheet
 * on phones (where the button may not be on screen). Escape and "Not now" close it. The page never navigates by
 * itself: only the two links do.
 */
export function SaveRequiredPrompt({ open, onOpenChange, anchorRef }: SaveRequiredPromptProps) {
  const wide = useWideScreen();
  const titleId = useId();
  const descriptionId = useId();
  const close = () => onOpenChange(false);

  if (wide) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor virtualRef={anchorRef} />
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          // Radix skips links when it picks the first focus target, so the primary action gets focus explicitly.
          onOpenAutoFocus={focusSignIn}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            anchorRef.current?.focus();
          }}
          className="w-80 p-5"
        >
          <PromptBody titleId={titleId} descriptionId={descriptionId} inSheet={false} onNotNow={close} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onOpenAutoFocus={focusSignIn}
        className="gap-0 rounded-t-2xl border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <PromptBody titleId={titleId} descriptionId={descriptionId} inSheet onNotNow={close} />
      </SheetContent>
    </Sheet>
  );
}

```

## src/components/AppToaster.tsx

```tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import { usePrefs } from "@/lib/store/prefs";

export function AppToaster() {
  const { prefs } = usePrefs();

  return <Toaster position="bottom-center" theme={prefs.theme} />;
}

```

## src/components/Icon.tsx

```tsx
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: IconSvgElement;
  className?: string;
}

/** The one icon size and stroke used across the app (Hugeicons, stroke rounded). */
export function Icon({ icon, className }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={18}
      strokeWidth={1.5}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    />
  );
}

```

## src/components/styles.ts

```typescript
/** Shared class for icon-only buttons: 36px target, quiet hover, accent focus ring. */
export const iconButtonClass =
  "grid size-9 shrink-0 place-items-center rounded-lg text-secondary-foreground outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

```

## src/components/format.ts

```typescript
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["week", 7 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago". `now` is passed in so callers control when time is read. */
export function relativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, (now - timestamp) / 1000);
  if (seconds < MINUTE) return "just now";
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return relativeFormat.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}

/** Size of the note body in kilobytes, measured as UTF-8. */
export function formatSize(content: string): string {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes === 0) return "0 KB";
  return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
}

```

## src/components/useNow.ts

```typescript
import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(notify: () => void) {
  const id = window.setInterval(notify, MINUTE);
  return () => window.clearInterval(id);
}

// Floored to the minute so the snapshot is stable between ticks. The server snapshot is 0, so
// relative times are never computed during SSR or hydration.
function getSnapshot() {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

/** Current time, refreshed once a minute. Returns 0 until mounted on the client. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

```

## src/components/userDisplay.ts

```typescript
export interface UserDisplay {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/** Up to two initials from the name, falling back to the email handle. */
export function initialsFor(user: UserDisplay): string {
  const source = user.name?.trim() || user.email?.split("@")[0] || "N";
  const letters = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "N";
}

```

## src/components/share/SharePopover.tsx

```tsx
"use client";

import { useCallback, useId, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import {
  Cancel01Icon,
  Copy01Icon,
  ExternalLinkIcon,
  Loading03Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { useWideScreen } from "@/components/useWideScreen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { iconButtonClass } from "@/components/styles";
import type { NoteStore } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShareStore = Pick<NoteStore, "mode" | "activeNote" | "activeNotePersisted">;

export interface ShareLink {
  slug: string;
  url: string;
  createdAt: string;
}

interface ShareRecord {
  noteId: string;
  share: ShareLink | null;
}

export interface ShareController {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
  available: boolean;
  known: boolean;
  share: ShareLink | null;
  loading: boolean;
  failed: boolean;
  busy: boolean;
  retryLoad: () => void;
  toggle: () => Promise<void>;
}

function readShareResponse(value: unknown): ShareLink | null {
  if (typeof value !== "object" || value === null) throw new Error("Invalid share response");
  const data = value as Record<string, unknown>;
  if (data.shared === false) return null;
  if (
    data.shared === true &&
    typeof data.slug === "string" &&
    typeof data.url === "string" &&
    typeof data.createdAt === "string"
  ) {
    return { slug: data.slug, url: data.url, createdAt: data.createdAt };
  }
  throw new Error("Invalid share response");
}

async function requestShare(noteId: string, method: "GET" | "POST" | "DELETE"): Promise<ShareLink | null> {
  const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}/share`, {
    method,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Share request failed");

  const share = readShareResponse(await response.json());
  if ((method === "POST" && !share) || (method === "DELETE" && share)) {
    throw new Error("Unexpected share response");
  }
  return share;
}

/** One share state controller is shared by the phone and desktop buttons. */
export function useShareController(store: ShareStore): ShareController {
  const noteId = store.activeNote?.id ?? null;
  const available = store.mode === "account" && noteId !== null && store.activeNotePersisted === true;
  const [openFor, setOpenFor] = useState<{ noteId: string | null; open: boolean }>({ noteId: null, open: false });
  const open = openFor.noteId === noteId && openFor.open;
  const [record, setRecord] = useState<ShareRecord | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadSequence = useRef(0);

  const loadShare = useCallback(async (id: string) => {
    const request = ++loadSequence.current;
    setLoadingId(id);
    setFailedId(null);
    try {
      const share = await requestShare(id, "GET");
      if (request !== loadSequence.current) return;
      setRecord({ noteId: id, share });
    } catch {
      if (request !== loadSequence.current) return;
      setFailedId(id);
      toast.error("Couldn't load sharing settings.");
    } finally {
      if (request === loadSequence.current) setLoadingId((current) => (current === id ? null : current));
    }
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpenFor({ noteId, open: next });
      if (next && available && noteId) void loadShare(noteId);
    },
    [available, loadShare, noteId],
  );

  const retryLoad = useCallback(() => {
    if (available && noteId) void loadShare(noteId);
  }, [available, loadShare, noteId]);

  const currentRecord = record?.noteId === noteId ? record : null;

  const toggle = useCallback(async () => {
    if (!available || !noteId || !currentRecord || loadingId === noteId || busyId === noteId) return;
    const id = noteId;
    const method = currentRecord.share ? "DELETE" : "POST";
    // Ignore any earlier GET so it cannot replace the result of this mutation.
    loadSequence.current += 1;
    setLoadingId((current) => (current === id ? null : current));
    setBusyId(id);
    setFailedId(null);
    try {
      const share = await requestShare(id, method);
      setRecord({ noteId: id, share });
      toast.success(method === "POST" ? "Sharing link created" : "Sharing stopped");
    } catch {
      toast.error("Couldn't update sharing. Try again.");
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  }, [available, busyId, currentRecord, loadingId, noteId]);

  return {
    open,
    onOpenChange,
    noteId,
    available,
    known: currentRecord !== null,
    share: currentRecord?.share ?? null,
    loading: loadingId === noteId,
    failed: failedId === noteId,
    busy: busyId === noteId,
    retryLoad,
    toggle,
  };
}

interface SharePopoverProps {
  store: ShareStore;
  controller: ShareController;
  /** Icon-only 44px phone header variant. */
  compact?: boolean;
}

export function SharePopover({ store, controller, compact = false }: SharePopoverProps) {
  const wide = useWideScreen();
  const titleId = useId();
  const descriptionId = useId();
  const linkRef = useRef<HTMLInputElement>(null);
  if (store.mode !== "account" || (compact ? wide : !wide)) return null;

  const noteId = store.activeNote?.id ?? null;
  const persisted = store.activeNotePersisted === true;
  const disabled = !noteId || !persisted;
  const shareIsOn = controller.noteId === noteId && controller.known && controller.share !== null;
  const pending = controller.loading || controller.busy;
  const triggerLabel = shareIsOn ? "Share note, link is on" : "Share note";
  const triggerTitle = disabled ? "Save the note to share it" : triggerLabel;

  async function copyLink() {
    const url = controller.share?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      return;
    } catch {
      // Fall back to selecting the read-only field when clipboard access is unavailable.
    }

    const input = linkRef.current;
    if (!input) {
      toast.error("Couldn't copy the link.");
      return;
    }
    input.focus();
    input.select();
    try {
      if (document.execCommand("copy")) {
        toast.success("Link copied");
        return;
      }
    } catch {
      // Leave the selection in place so the user can copy it with the keyboard.
    }
    toast("Link selected. Press Ctrl+C or ⌘C to copy.");
  }

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      title={triggerTitle}
      aria-label={triggerLabel}
      aria-expanded={controller.open}
      aria-busy={pending || undefined}
      className={
        compact
          ? cn(
              iconButtonClass,
              "relative size-11 disabled:cursor-not-allowed disabled:opacity-40",
              shareIsOn && "text-brand",
            )
          : cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
              shareIsOn
                ? "border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft"
                : "border-border text-secondary-foreground hover:bg-hover hover:text-foreground",
            )
      }
    >
      <Icon
        icon={pending ? Loading03Icon : Share01Icon}
        className={cn(pending && "animate-spin motion-reduce:animate-none")}
      />
      {compact ? null : <span>Share</span>}
      {shareIsOn ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2.5 right-2.5 size-2 rounded-full bg-brand ring-2 ring-canvas",
            !compact && "static size-1.5 ring-0",
          )}
        />
      ) : null}
    </button>
  );

  const panel = (
    <SharePanel
      controller={controller}
      titleId={titleId}
      descriptionId={descriptionId}
      linkRef={linkRef}
      onCopy={() => void copyLink()}
      onClose={() => controller.onOpenChange(false)}
      inSheet={compact}
    />
  );

  if (compact) {
    return (
      <Sheet open={controller.open} onOpenChange={controller.onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-label="Share note"
          className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={controller.open} onOpenChange={controller.onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={16}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-4"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

interface SharePanelProps {
  controller: ShareController;
  titleId: string;
  descriptionId: string;
  linkRef: RefObject<HTMLInputElement | null>;
  onCopy: () => void;
  onClose: () => void;
  inSheet: boolean;
}

function SharePanel({
  controller,
  titleId,
  descriptionId,
  linkRef,
  onCopy,
  onClose,
  inSheet,
}: SharePanelProps) {
  const shareIsOn = controller.known && controller.share !== null;
  const canToggle = controller.available && controller.known && !controller.loading && !controller.busy;
  const title = inSheet ? (
    <SheetTitle className="text-base leading-snug font-semibold text-foreground">Share note</SheetTitle>
  ) : (
    <h2 id={titleId} className="text-base leading-snug font-semibold text-foreground">
      Share note
    </h2>
  );
  const description = inSheet ? (
    <SheetDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
      Create a read-only link anyone can open.
    </SheetDescription>
  ) : (
    <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted-foreground">
      Create a read-only link anyone can open.
    </p>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 text-foreground">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {title}
          {description}
        </div>
        {inSheet ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share settings"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-secondary-foreground outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon icon={Cancel01Icon} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-3">
        <span className="min-w-0 flex-1 text-sm leading-snug font-medium text-secondary-foreground">
          Anyone with the link can view
        </span>
        {controller.loading || controller.busy ? (
          <Icon icon={Loading03Icon} className="animate-spin text-brand motion-reduce:animate-none" />
        ) : null}
        <button
          type="button"
          role="switch"
          aria-label="Anyone with the link can view"
          aria-checked={shareIsOn}
          disabled={!canToggle}
          onClick={() => void controller.toggle()}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted outline-none transition-colors duration-150 after:absolute after:inset-[-8px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none aria-checked:bg-brand"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-4 rounded-full bg-canvas shadow-xs transition-transform duration-150 motion-reduce:transition-none",
              shareIsOn ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {controller.loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Checking link status…
        </p>
      ) : controller.busy ? (
        <p role="status" className="text-xs text-muted-foreground">
          Updating sharing…
        </p>
      ) : controller.failed && !controller.known ? (
        <div className="flex items-center justify-between gap-3 text-xs text-destructive">
          <span>Couldn&apos;t load sharing settings.</span>
          <button
            type="button"
            onClick={controller.retryLoad}
            className="shrink-0 rounded-md px-2 py-1 font-medium text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        </div>
      ) : null}

      {shareIsOn && controller.share ? (
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={linkRef}
              type="url"
              aria-label="Share link"
              readOnly
              value={controller.share.url}
              onFocus={(event) => event.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-pad px-2.5 font-mono text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon={Copy01Icon} />
              <span>Copy</span>
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Viewers see the last saved version. Edits appear after you save.
          </p>
          <a
            href={controller.share.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-md text-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open link
            <Icon icon={ExternalLinkIcon} className="size-4" />
          </a>
        </div>
      ) : controller.known && !controller.failed ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Turn on the link when you’re ready to share this note.
        </p>
      ) : null}
    </div>
  );
}

```

## src/components/ui/popover.tsx

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover as PopoverPrimitive } from "radix-ui"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-xl border border-border bg-pad p-4 text-popover-foreground shadow-menu outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

```

## src/components/ui/dialog.tsx

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Icon } from "@/components/Icon"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-pad p-6 shadow-overlay duration-200 ease-soft outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <Icon icon={Cancel01Icon} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

```

## src/components/ui/sheet.tsx

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Icon } from "@/components/Icon"
import { Dialog as SheetPrimitive } from "radix-ui"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  onSwipeClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Left sheets only: a leftward touch swipe past the threshold closes the sheet. Vertical scrolling is untouched. */
  onSwipeClose?: () => void
}) {
  const swipe = useSwipeToClose(side === "left" ? onSwipeClose : undefined)
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col gap-4 border-border bg-pad shadow-overlay transition duration-200 ease-soft data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-200",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-dvh w-[min(86vw,20rem)] max-w-none touch-pan-y [&_.overflow-y-auto]:touch-pan-y border-r pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          swipe.onPointerDown(event)
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          swipe.onPointerMove(event)
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          swipe.onPointerUp(event)
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event)
          swipe.onPointerCancel(event)
        }}
        onClickCapture={(event) => {
          onClickCapture?.(event)
          if (swipe.consumeClick()) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <Icon icon={Cancel01Icon} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/**
 * Touch swipe to close. The sheet follows the finger only once the gesture is clearly horizontal (leftward), so a
 * vertical scroll of the list never moves the sheet. Past 30% of its width, or on a quick flick, it closes; otherwise it
 * springs back. The close runs from the current position and skips Radix's exit animation, which would jump back.
 */
function useSwipeToClose(onClose: (() => void) | undefined) {
  const drag = React.useRef<{
    pointer: number
    x0: number
    y0: number
    x: number
    t: number
    axis: "pending" | "x" | "none"
    el: HTMLElement
  } | null>(null)
  const suppressClick = React.useRef(false)

  const release = (el: HTMLElement, pointer: number) => {
    try {
      if (el.hasPointerCapture(pointer)) el.releasePointerCapture(pointer)
    } catch {}
  }

  const settle = (el: HTMLElement, closing: boolean) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (closing) {
      el.style.animation = "none"
      el.style.transition = reduce ? "none" : "transform 160ms cubic-bezier(0.4, 0, 1, 1)"
      el.style.transform = "translateX(-100%)"
      window.setTimeout(() => onClose?.(), reduce ? 0 : 160)
      return
    }
    el.style.transition = reduce ? "none" : "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)"
    el.style.transform = "translateX(0px)"
    window.setTimeout(() => {
      el.style.transition = ""
      el.style.transform = ""
    }, reduce ? 0 : 200)
  }

  return {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      suppressClick.current = false
      if (!onClose || event.pointerType === "mouse" || !event.isPrimary) return
      // Capture from the start, so the browser never takes the gesture for a native pan before we decide it's ours.
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {}
      drag.current = {
        pointer: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        x: event.clientX,
        t: event.timeStamp,
        axis: "pending",
        el: event.currentTarget,
      }
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      if (!d || d.pointer !== event.pointerId) return
      const dx = event.clientX - d.x0
      const dy = event.clientY - d.y0
      if (d.axis === "pending") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          d.axis = "x"
          d.el.style.transition = "none"
        } else {
          // Vertical or rightward: not ours. Release and let the browser scroll.
          release(d.el, event.pointerId)
          drag.current = null
          return
        }
      }
      d.x = event.clientX
      d.t = event.timeStamp
      d.el.style.transform = `translateX(${Math.min(0, dx)}px)`
    },
    onPointerUp(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      drag.current = null
      if (d) release(d.el, event.pointerId)
      if (!d || d.pointer !== event.pointerId || d.axis !== "x") return
      const offset = Math.min(0, event.clientX - d.x0)
      const velocity = (event.clientX - d.x) / Math.max(1, event.timeStamp - d.t)
      const closing = -offset > d.el.offsetWidth * 0.3 || (velocity < -0.5 && offset < -16)
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 300)
      settle(d.el, closing)
    },
    onPointerCancel(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      drag.current = null
      if (d) release(d.el, event.pointerId)
      if (d && d.pointer === event.pointerId && d.axis === "x") settle(d.el, false)
    },
    consumeClick(): boolean {
      const was = suppressClick.current
      suppressClick.current = false
      return was
    },
  }
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```

## src/components/ui/button.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-soft outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

## src/app/dashboard/page.tsx

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your notes",
  robots: { index: false },
};

async function Dashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <AppShell />;
}

// The signed-in home. Guests are sent to the login page; guest notes still live at "/".
// The session is read inside Suspense so the rest of the route can prerender (Cache Components).
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

```

## src/app/page.tsx

```tsx
import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import { homeStructuredData } from "@/lib/structuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <>
      {/* The page is the notepad itself; this heading names it for search engines and screen readers. */}
      <h1 className="sr-only">{site.title}</h1>
      <JsonLd data={homeStructuredData()} />
      <noscript>
        <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
          <p>
            <strong>{site.name}</strong> — {site.summary}
          </p>
          <p>
            Likho needs JavaScript to run the editor. <a href="/about">Read about Likho and its features</a>.
          </p>
        </div>
      </noscript>
      <AppShell />
    </>
  );
}

```
