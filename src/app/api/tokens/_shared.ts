import { z } from "zod";

import { apiError, getSessionUserId, jsonResponse } from "@/app/api/notes/_shared";
import { site } from "@/lib/site";
import { TOKEN_LIMITS, type TokenRecord } from "@/lib/tokens";

export const createTokenSchema = z
  .object({
    name: z.string().trim().min(1).max(TOKEN_LIMITS.nameMax),
    access: z.enum(["read", "read-write"]),
    expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
  })
  .strict();

export type TokenRecordJson = Omit<TokenRecord, "createdAt" | "lastUsedAt" | "expiresAt" | "revokedAt"> & {
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

export function serializeTokenRecord(record: TokenRecord): TokenRecordJson {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}

export function originIsAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;

  try {
    const suppliedOrigin = new URL(origin).origin;
    const allowedOrigins = new Set([new URL(request.url).origin]);
    if (process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
      allowedOrigins.add(new URL(site.url).origin);
    }
    return allowedOrigins.has(suppliedOrigin);
  } catch {
    return false;
  }
}

export function notSignedIn() {
  return apiError(401, "Sign in to manage API tokens.");
}

export function forbiddenOrigin() {
  return apiError(403, "Cross-origin request rejected.");
}

export { apiError, getSessionUserId, jsonResponse };
