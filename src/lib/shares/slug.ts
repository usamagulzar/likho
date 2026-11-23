import { randomBytes } from "node:crypto";

export const SLUG_RE = /^[A-Za-z0-9_-]{22}$/;

export function generateShareSlug(): string {
  return randomBytes(16).toString("base64url");
}
