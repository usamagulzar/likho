import { apiError, forbiddenOrigin, getSessionUserId, notSignedIn, originIsAllowed } from "../_shared";
import { z } from "zod";

import { revokeToken } from "@/lib/tokens";

const tokenIdSchema = z.string().uuid();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!originIsAllowed(request)) return forbiddenOrigin();

  const userId = await getSessionUserId();
  if (!userId) return notSignedIn();

  const { id } = await params;
  if (!tokenIdSchema.safeParse(id).success) return apiError(404, "API token not found.");

  try {
    const result = await revokeToken(userId, id);
    if (result === "not_found") return apiError(404, "API token not found.");
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError(500, "Could not revoke API token.");
  }
}
