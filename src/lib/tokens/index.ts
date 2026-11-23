import { and, count, desc, eq, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { apiTokens } from "@/db/schema";
import { generateTokenString, hashToken, isWellFormedToken, tokenPrefix } from "./crypto";

export type TokenScope = "read" | "write";

export interface TokenRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: TokenScope[];
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export type CreateTokenResult =
  | { ok: true; token: string; record: TokenRecord }
  | { ok: false; reason: "limit" | "invalid_name" | "invalid_expiry" | "database" };

export type VerifyTokenResult =
  | { ok: true; userId: string; tokenId: string; scopes: TokenScope[] }
  | { ok: false; reason: "malformed" | "unknown" | "expired" | "revoked" };

export const TOKEN_LIMITS = { maxActivePerUser: 20, nameMax: 60 } as const;

type TokenRow = typeof apiTokens.$inferSelect;
type PublicTokenRow = Pick<
  TokenRow,
  "id" | "userId" | "name" | "prefix" | "scopes" | "createdAt" | "lastUsedAt" | "expiresAt" | "revokedAt"
>;

function parseScopes(storedScopes: string): TokenScope[] {
  const scopes = new Set(
    storedScopes
      .split(",")
      .map((scope) => scope.trim())
      .filter((scope): scope is TokenScope => scope === "read" || scope === "write"),
  );

  const parsed: TokenScope[] = [];
  if (scopes.has("read") || scopes.has("write")) parsed.push("read");
  if (scopes.has("write")) parsed.push("write");
  return parsed;
}

function toTokenRecord(row: PublicTokenRow): TokenRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    prefix: row.prefix,
    scopes: parseScopes(row.scopes),
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  };
}

function getRequiredDb(operation: string) {
  const db = getDb();
  if (!db) {
    throw new Error(
      `Token database is unavailable while trying to ${operation}: DATABASE_URL is not configured.`,
    );
  }
  return db;
}

async function runDatabaseOperation<T>(
  operation: string,
  run: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>,
): Promise<T> {
  const db = getRequiredDb(operation);
  try {
    return await run(db);
  } catch {
    throw new Error(`Token database request failed while trying to ${operation}.`);
  }
}

/**
 * Creates a token and returns its raw value once. The active-token cap uses
 * count-then-insert because Neon HTTP does not support interactive transactions;
 * simultaneous creates can therefore briefly exceed the cap by a small amount.
 * Database failures are returned as `{ ok: false, reason: "database" }` here.
 */
export async function createToken(
  userId: string,
  input: { name: string; access: "read" | "read-write"; expiresInDays?: number | null },
): Promise<CreateTokenResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > TOKEN_LIMITS.nameMax) {
    return { ok: false, reason: "invalid_name" };
  }

  const expiresInDays = input.expiresInDays;
  if (
    expiresInDays != null &&
    (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365)
  ) {
    return { ok: false, reason: "invalid_expiry" };
  }

  try {
    const db = getDb();
    if (!db) return { ok: false, reason: "database" };

    const [activeTokenCount] = await db
      .select({ value: count() })
      .from(apiTokens)
      .where(
        and(
          eq(apiTokens.userId, userId),
          isNull(apiTokens.revokedAt),
          or(isNull(apiTokens.expiresAt), sql`${apiTokens.expiresAt} > now()`),
        ),
      );

    if ((activeTokenCount?.value ?? 0) >= TOKEN_LIMITS.maxActivePerUser) {
      return { ok: false, reason: "limit" };
    }

    const token = generateTokenString();
    const expiry =
      expiresInDays == null ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const inserted = await db
      .insert(apiTokens)
      .values({
        userId,
        name,
        tokenHash: hashToken(token),
        prefix: tokenPrefix(token),
        scopes: input.access === "read-write" ? "read,write" : "read",
        expiresAt: expiry,
      })
      .returning({
        id: apiTokens.id,
        userId: apiTokens.userId,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        scopes: apiTokens.scopes,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        revokedAt: apiTokens.revokedAt,
      });

    const record = inserted[0];
    if (!record) return { ok: false, reason: "database" };
    return { ok: true, token, record: toTokenRecord(record) };
  } catch {
    return { ok: false, reason: "database" };
  }
}

/** Database failures reject with a clear error; the result type has no database variant. */
export async function listTokens(userId: string): Promise<TokenRecord[]> {
  return runDatabaseOperation("list API tokens", async (db) => {
    const rows = await db
      .select({
        id: apiTokens.id,
        userId: apiTokens.userId,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        scopes: apiTokens.scopes,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId))
      .orderBy(desc(apiTokens.createdAt));

    return rows.map(toTokenRecord);
  });
}

/** Database failures reject with a clear error; the result type has no database variant. */
export async function revokeToken(
  userId: string,
  id: string,
): Promise<"revoked" | "already_revoked" | "not_found"> {
  return runDatabaseOperation("revoke API token", async (db) => {
    const revoked = await db
      .update(apiTokens)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(apiTokens.id, id),
          eq(apiTokens.userId, userId),
          isNull(apiTokens.revokedAt),
        ),
      )
      .returning({ id: apiTokens.id });

    if (revoked.length > 0) return "revoked";

    const [existing] = await db
      .select({ revokedAt: apiTokens.revokedAt })
      .from(apiTokens)
      .where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)))
      .limit(1);

    if (!existing) return "not_found";
    return existing.revokedAt ? "already_revoked" : "not_found";
  });
}

/** Database failures reject with a clear error; the result type has no database variant. */
export async function verifyToken(rawToken: string): Promise<VerifyTokenResult> {
  if (!isWellFormedToken(rawToken)) return { ok: false, reason: "malformed" };

  const tokenHash = hashToken(rawToken);
  return runDatabaseOperation("verify API token", async (db) => {
    const [token] = await db
      .select({
        id: apiTokens.id,
        userId: apiTokens.userId,
        scopes: apiTokens.scopes,
        expiresAt: apiTokens.expiresAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, tokenHash))
      .limit(1);

    if (!token) return { ok: false, reason: "unknown" };
    if (token.revokedAt) return { ok: false, reason: "revoked" };
    if (token.expiresAt && token.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" };
    }

    try {
      await db
        .update(apiTokens)
        .set({ lastUsedAt: sql`now()` })
        .where(
          and(
            eq(apiTokens.id, token.id),
            or(
              isNull(apiTokens.lastUsedAt),
              sql`${apiTokens.lastUsedAt} < now() - interval '1 minute'`,
            ),
          ),
        );
    } catch {
      // Usage timestamps are best-effort and must not invalidate a verified token.
    }

    return {
      ok: true,
      userId: token.userId,
      tokenId: token.id,
      scopes: parseScopes(token.scopes),
    };
  });
}

export function hasScope(scopes: TokenScope[], needed: TokenScope): boolean {
  if (needed === "read") return scopes.includes("read") || scopes.includes("write");
  return scopes.includes("write");
}
