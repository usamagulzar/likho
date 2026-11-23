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
