/**
 * One source of truth for everything search engines and answer engines read:
 * metadata, Open Graph, JSON-LD, sitemap, robots, the web manifest and llms.txt.
 * Keep every claim here true to what the app actually does.
 */

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  // Set automatically on Vercel for production deployments.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const site = {
  name: "Likho",
  alternateNames: ["Likho", "Likho.site"],
  url: resolveSiteUrl(),
  /** <title> on the home page. Keep under ~60 characters. */
  title: "Likho — Free Online Notepad, No Sign-Up",
  /** Meta description. Keep under ~160 characters. */
  description:
    "Write quick notes and checklists in your browser with live Markdown. No sign-up needed. Drafts auto-save locally. Export to Markdown or plain text.",
  /** Longer plain-language summary for JSON-LD, the About page and llms.txt. */
  summary:
    "Likho is a free, open-source online notepad. Open the page and start typing — no sign-up needed. Notes save automatically in your browser, Markdown formats as you type (bullets, numbered lists, checklists, headings, horizontal rules and code blocks with syntax highlighting), and any note can be downloaded as a Markdown (.md) or plain text (.txt) file. Create a free account with an email and password, then press Save to keep your notes in the cloud and open them on any device. Signed-in users can connect MCP-compatible AI assistants to their cloud notes with personal access tokens; OAuth sign-in is planned.",
  tagline: "A free online notepad with live Markdown",
  locale: "en_US",
  language: "en",
  author: { name: "Usama Gulzar", url: resolveSiteUrl() },
  repo: "https://github.com/Piyushrathoree/QuickNotes",
  license: "https://opensource.org/licenses/MIT",
  /** Dates of meaningful public page changes for the sitemap. */
  updated: "2026-11-22",
  mcpUpdated: "2026-11-21",
  colors: { light: "#efebdf", dark: "#242423", ink: "#3d3d3a", paper: "#f8f5ec" },
  features: [
    "Opens straight into a blank note — no sign-up required",
    "Notes autosave in the browser as you type",
    "Live Markdown: bullets, numbered lists, checklists, headings, horizontal rules, quotes, links and inline styles",
    "Paste from anywhere: web pages, docs, spreadsheets and Excalidraw text become clean Markdown",
    "Fenced code blocks with syntax highlighting and a copy button",
    "Save any note as a Markdown (.md) or plain text (.txt) file",
    "Four writing fonts: Hand, Sans, Serif and Mono",
    "Light and dark themes",
    "Optional free account (email and password): press Save to keep notes in the cloud and open them on any device",
    "Connect Claude, Cursor and other MCP-compatible AI assistants to your cloud notes with scoped, revocable personal access tokens",
    "Works on phones, tablets and desktops",
    "Free and open source (MIT license)",
  ],
} as const;

/** Absolute URL for a path on this site. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${site.url}/`).toString();
}
