import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const authEnvironment = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];

function authIsConfigured() {
  return authEnvironment.every((name) => Boolean(process.env[name]?.trim()));
}

function unavailableResponse(request: Request) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  if (path.endsWith("/get-session")) return Response.json(null);
  return Response.json({ error: "Authentication is not configured." }, { status: 503 });
}

export async function GET(request: Request): Promise<Response> {
  if (!authIsConfigured()) return unavailableResponse(request);
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  if (!authIsConfigured()) return unavailableResponse(request);
  return toNextJsHandler(auth).POST(request);
}
