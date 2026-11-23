import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { verifyToken } from "@/lib/tokens";
import { getBearerToken } from "@/lib/mcp/auth";
import { consumeTokenRequest } from "@/lib/mcp/rateLimit";
import { createLikhoServer } from "@/lib/mcp/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function responseWithHeaders(response: Response, additionalHeaders: Record<string, string> = {}): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);
  for (const [name, value] of Object.entries(additionalHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function jsonResponse(status: number, body: Record<string, string>, extraHeaders: Record<string, string> = {}) {
  return responseWithHeaders(Response.json(body, { status }), extraHeaders);
}

function unauthorized() {
  return jsonResponse(401, { error: "Unauthorized" }, {
    "WWW-Authenticate": 'Bearer realm="likho", error="invalid_token"',
  });
}

function methodNotAllowed() {
  return jsonResponse(405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
}

export async function OPTIONS(): Promise<Response> {
  return responseWithHeaders(new Response(null, { status: 204 }), { Allow: "POST, OPTIONS" });
}

export async function GET(): Promise<Response> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<Response> {
  return methodNotAllowed();
}

export async function HEAD(): Promise<Response> {
  return methodNotAllowed();
}

export async function POST(request: Request): Promise<Response> {
  const rawToken = getBearerToken(request);
  if (!rawToken) return unauthorized();

  let verified;
  try {
    verified = await verifyToken(rawToken);
  } catch {
    return jsonResponse(500, { error: "Internal server error" });
  }
  if (!verified.ok) return unauthorized();

  const rateLimit = consumeTokenRequest(verified.tokenId);
  if (!rateLimit.allowed) {
    return jsonResponse(429, { error: "Too many requests" }, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const origin = new URL(request.url).origin;
  const server = createLikhoServer({
    userId: verified.userId,
    scopes: verified.scopes,
    origin,
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return responseWithHeaders(response);
  } catch {
    return jsonResponse(500, { error: "Internal server error" });
  } finally {
    try {
      await server.close();
    } catch {
      // Closing the per-request server is best-effort after the response is ready.
    }
  }
}
