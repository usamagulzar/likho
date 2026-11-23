import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^qn_[A-Za-z0-9_-]{43}$/;

export function generateTokenString(): string {
  return `qn_${randomBytes(32).toString("base64url")}`;
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function isWellFormedToken(raw: string): boolean {
  return TOKEN_PATTERN.test(raw);
}

export function tokenPrefix(raw: string): string {
  return raw.slice(0, 11);
}
