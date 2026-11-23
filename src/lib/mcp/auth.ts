export function getBearerToken(request: Request): string | null {
  const url = new URL(request.url);
  if (url.searchParams.has("token") || url.searchParams.has("access_token")) return null;

  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}
