import { NextResponse, type NextRequest } from "next/server";

import { getSharedNote, SLUG_RE } from "@/lib/shares";

// With Cache Components the status line is sent before a streamed page can call notFound(), so a dead share link
// would answer 200. Checking here, before the page renders, lets unknown, revoked and deleted links return a real 404.
// Only "/s/<slug>" matches: "/s/<slug>/raw" already returns its own 404.
export const config = { matcher: "/s/:slug" };

const goneHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer">
<title>Note not shared · Likho</title>
<style>
:root{color-scheme:light dark;--bg:#f1ede3;--paper:#f8f5ee;--ink:#2b2824;--muted:#6f6a61;--line:#ddd7c9}
@media (prefers-color-scheme:dark){:root{--bg:#1d1b18;--paper:#26231f;--ink:#ece8df;--muted:#a39d91;--line:#3a362f}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:100%;max-width:460px;padding:40px 32px;border:1px solid var(--line);border-radius:20px;background:var(--paper);text-align:center}
h1{margin:0 0 8px;font-size:22px;line-height:1.3;letter-spacing:-.01em}p{margin:0 0 24px;color:var(--muted);font-size:15px}
a{display:inline-flex;align-items:center;height:40px;padding:0 18px;border-radius:999px;background:var(--ink);color:var(--paper);font-size:14px;font-weight:500;text-decoration:none}
a:focus-visible{outline:2px solid var(--muted);outline-offset:3px}
</style></head>
<body><main><h1>This note isn’t shared anymore</h1><p>The link may have been turned off, or the note may have been deleted.</p><a href="/">Go to Likho</a></main></body></html>`;

function gone(): Response {
  return new Response(goneHtml, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  if (!SLUG_RE.test(slug)) return gone();

  try {
    if (!(await getSharedNote(slug))) return gone();
  } catch {
    // Database trouble is not proof the link is dead: let the page render and handle it.
  }
  return NextResponse.next();
}
