import type { Metadata } from "next";
import Link from "next/link";

const title = "Likho vs. Notes.io, QuickNote.io, Notion & Obsidian";
const description =
  "Compare Likho with Notes.io, QuickNote.io, Notion, and Obsidian for browser notes, link sharing, Markdown drafts, and organized knowledge bases.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/compare" },
  openGraph: { title, description, url: "/compare", type: "article" },
  twitter: { title, description },
};

const comparisons = [
  {
    id: "notes-io",
    name: "Notes.io",
    useCase: "Share a note with a short link",
    competitor: "Notes.io lets you write a note in your browser and share it with a short URL without creating an account. It suits one-off notes you want to send in a message or email.",
    quickNotes: "Likho saves guest drafts in your browser as you type and lets you download them as Markdown or plain text. To share a view-only link, sign in, save the note, and turn on sharing. You can turn the link off later.",
    source: "https://notes.io/etN",
  },
  {
    id: "quicknote-io",
    name: "QuickNote.io",
    useCase: "Share formatted notes without signing up",
    competitor: "QuickNote.io supports links, images, lists, and code snippets in notes you can share without signing up. Its My Notes page offers a backup code for transferring notes to another device.",
    quickNotes: "Likho works well when you want Markdown to format as you type and want a downloadable .md or .txt file. Guest drafts stay in the browser. With a free account, you can save a note to the cloud and open it on another device.",
    source: "https://quicknote.io/about",
    extraSource: "https://quicknote.io/mynotes",
  },
  {
    id: "notion",
    name: "Notion",
    useCase: "Organize projects and related pages",
    competitor: "Notion is a good fit when your notes belong in a workspace with pages and databases. A project database can give each task its own page and let you see the same tasks in a table, board, or calendar.",
    quickNotes: "Likho is a lightweight Notion alternative for personal scratch notes, meeting drafts, and simple checklists. You can write and export a note without signing in. To share a view-only link, save the note to your account first.",
    source: "https://www.notion.com/help/intro-to-databases",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    useCase: "Build a linked Markdown knowledge base",
    competitor: "Obsidian stores notes on your device and can link them together in a vault. Backlinks, a graph view, and plugins make it a good fit for ongoing research and a personal knowledge base you can access offline.",
    quickNotes: "Likho is a browser-based Obsidian alternative for quick Markdown capture. You can write a draft or checklist without installing an app, then download the Markdown file and move it into your Obsidian vault whenever you’re ready.",
    source: "https://obsidian.md/",
  },
] as const;

const linkClass = "font-medium text-brand underline-offset-4 hover:underline";
const buttonClass = "inline-flex min-h-9 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function ComparePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="text-[15px] font-semibold tracking-tight hover:underline">Likho</Link>
          <Link href="/" className={buttonClass}>Start writing</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-[17px] leading-8 text-secondary-foreground">
          Need a browser scratchpad, a quick way to share a note, or a place to organize a project? Here’s how Likho
          compares for each job. You can start writing in Likho for free without signing up.
        </p>

        <nav aria-label="Jump to a comparison" className="mt-7 rounded-xl border border-border bg-pad">
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-2">
            {comparisons.map(({ id, name, useCase }) => (
              <li key={id} className="bg-pad">
                <a href={`#${id}`} className="block px-4 py-3 hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="block text-sm leading-6 text-muted-foreground">{useCase}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {comparisons.map((comparison) => (
          <section key={comparison.id} id={comparison.id} className="mt-9 scroll-mt-6 border-b border-border pb-7">
            <h2 className="text-xl font-semibold tracking-tight">Likho vs. {comparison.name}</h2>
            <p className="mt-3 text-[15px] leading-7 text-secondary-foreground">{comparison.competitor}</p>
            <p className="mt-2 text-[15px] leading-7 text-secondary-foreground">{comparison.quickNotes}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href={comparison.source} className={linkClass}>About {comparison.name}</a>
              {"extraSource" in comparison && (
                <a href={comparison.extraSource} className={linkClass}>QuickNote.io device transfer</a>
              )}
            </div>
          </section>
        ))}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/" className={buttonClass}>Try Likho</Link>
          <Link href="/about" className={`${linkClass} text-sm`}>Read the Likho guide</Link>
        </div>
      </main>
    </div>
  );
}
