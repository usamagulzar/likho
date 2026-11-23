const REQUEST_LIMIT = 120;
const WINDOW_MS = 60_000;

const requestTimesByToken = new Map<string, number[]>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function consumeTokenRequest(tokenId: string, now = Date.now()): RateLimitResult {
  for (const [key, timestamps] of requestTimesByToken) {
    const recent = timestamps.filter((timestamp) => timestamp > now - WINDOW_MS);
    if (recent.length === 0) requestTimesByToken.delete(key);
    else requestTimesByToken.set(key, recent);
  }

  const timestamps = requestTimesByToken.get(tokenId) ?? [];
  if (timestamps.length >= REQUEST_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((timestamps[0]! + WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestTimesByToken.set(tokenId, timestamps);
  return { allowed: true };
}
