import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";

export const MAX_NOTE_CONTENT_BYTES = 1_048_576;
const MAX_JSON_BODY_BYTES = MAX_NOTE_CONTENT_BYTES * 6 + 2_048;

const noStoreHeaders = { "Cache-Control": "no-store" };

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: noStoreHeaders });
}

export function apiError(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}

export function serviceUnavailable(): Response {
  return apiError(503, "The notes service is temporarily unavailable.");
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

const notePayloadSchema = z.object({
  content: z.string().refine(
    (content) => new TextEncoder().encode(content).byteLength <= MAX_NOTE_CONTENT_BYTES,
    "Content must be at most 1 MiB.",
  ),
  updatedAt: z.number().int().min(0).max(8_640_000_000_000_000),
});

export type NotePayload = z.infer<typeof notePayloadSchema>;

export type NotePayloadResult =
  | { ok: true; payload: NotePayload }
  | { ok: false; response: Response };

export async function readNotePayload(request: Request): Promise<NotePayloadResult> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { ok: false, response: apiError(415, "Content-Type must be application/json.") };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { ok: false, response: apiError(400, "Invalid Content-Length header.") };
    }
    if (declaredLength > MAX_JSON_BODY_BYTES) {
      return { ok: false, response: apiError(413, "Request body is too large.") };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, response: apiError(400, "A JSON request body is required.") };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      void reader.cancel();
      return { ok: false, response: apiError(413, "Request body is too large.") };
    }
    chunks.push(value);
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes));
  } catch {
    return { ok: false, response: apiError(400, "Request body must contain valid JSON.") };
  }

  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "content" in decoded &&
    typeof decoded.content === "string" &&
    new TextEncoder().encode(decoded.content).byteLength > MAX_NOTE_CONTENT_BYTES
  ) {
    return { ok: false, response: apiError(413, "Note content must be at most 1 MiB.") };
  }

  const validation = notePayloadSchema.safeParse(decoded);
  if (!validation.success) {
    return { ok: false, response: apiError(400, "Invalid note payload.") };
  }

  return { ok: true, payload: validation.data };
}
