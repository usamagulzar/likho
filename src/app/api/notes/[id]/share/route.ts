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
