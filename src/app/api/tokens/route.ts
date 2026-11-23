import {
  apiError,
  createTokenSchema,
  forbiddenOrigin,
  getSessionUserId,
  jsonResponse,
  notSignedIn,
  originIsAllowed,
  serializeTokenRecord,
} from "./_shared";
import { createToken, listTokens } from "@/lib/tokens";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return notSignedIn();

  try {
    const tokens = await listTokens(userId);
    return jsonResponse({ tokens: tokens.map(serializeTokenRecord) });
  } catch {
    return apiError(500, "Could not load API tokens.");
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return forbiddenOrigin();

  const userId = await getSessionUserId();
  if (!userId) return notSignedIn();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Request body must contain valid JSON.");
  }

  const parsed = createTokenSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "Invalid API token details.");

  const result = await createToken(userId, parsed.data);
  if (!result.ok) {
    if (result.reason === "limit") return apiError(409, "You have reached the active token limit.");
    if (result.reason === "database") return apiError(500, "Could not create an API token.");
    return apiError(400, "Invalid API token details.");
  }

  return jsonResponse(
    { token: result.token, record: serializeTokenRecord(result.record) },
    201,
  );
}
