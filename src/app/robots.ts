import type { MetadataRoute } from "next";

import { absoluteUrl, site } from "@/lib/site";

// Answer engines and AI search crawlers are welcome on the public pages, like regular search engines.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

// Private or per-user areas: nothing useful to index there.
const disallow = ["/api/", "/dashboard", "/reset-password"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
