import { SLUG_RE, getSharedNote } from "@/lib/shares";

const notFoundHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) return new Response(null, { status: 404, headers: notFoundHeaders });

  const note = await getSharedNote(slug);
  if (!note) return new Response(null, { status: 404, headers: notFoundHeaders });

  return new Response(note.content, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
