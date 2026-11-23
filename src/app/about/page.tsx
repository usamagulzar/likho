import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { faqs } from "@/lib/faq";
import { site } from "@/lib/site";
import { aboutStructuredData } from "@/lib/structuredData";

// Already names the brand, so it opts out of the "· Likho" title template.
const title = "Likho Guide — Browser Notes, Checklists & Markdown";
const description =
  "Learn to take notes online with Likho. Write without signing up, make Markdown checklists, export text files, and share saved notes by link.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/about" },
  openGraph: { title, description, url: "/about", type: "article" },
  twitter: { title, description },
};

const markdown: [string, string][] = [
  ["- item or * item", "Bullet list (Enter continues it, Enter on an empty bullet ends it)"],
  ["1. item", "Numbered list that counts up as you go"],
  ["- [ ] task", "Checklist item you can tick"],
  ["# , ## , ###", "Headings in three sizes"],
  ["---", "Horizontal rule"],
  ["```json then Enter", "Code block with syntax highlighting and a copy button"],
  ["> quote", "Block quote"],
  ["**bold**, *italic*, ~~strike~~", "Inline styles"],
  ["`code`", "Inline code"],
  ["[text](https://…)", "Link (Ctrl/Cmd+click to open)"],
  ["| a | b |", "Table (renders as a grid; Tab moves between cells)"],
];

const shortcuts: [string, string][] = [
  ["Ctrl/⌘ + Shift + O", "New note"],
  ["Ctrl/⌘ + S", "Save the note to your account (when signed in)"],
  ["Ctrl/⌘ + B", "Bold in the editor; elsewhere, show or hide the sidebar"],
  ["Ctrl/⌘ + I", "Italic"],
  ["Ctrl/⌘ + Alt + T", "Insert a table"],
  ["Tab / Shift + Tab", "Indent or outdent a list item"],
  ["Ctrl/⌘ + Enter", "Leave a code block, or tick a checklist item"],
  ["Enter (in the title)", "Jump to the note body"],
];

const h2 = "mt-12 text-xl font-semibold tracking-tight text-foreground";
const p = "mt-3 text-[15px] leading-7 text-secondary-foreground";
const th = "border-b border-border px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const td = "border-b border-border px-3 py-2.5 align-top text-sm leading-6 text-secondary-foreground";

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <JsonLd data={aboutStructuredData(faqs)} />
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {site.name}
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Open the notepad
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex gap-1.5">
            <li>
              <Link href="/" className="hover:text-foreground hover:underline">
                {site.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-secondary-foreground">
              About
            </li>
          </ol>
        </nav>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How to take notes online with Likho
        </h1>
        <p className="mt-4 text-[17px] leading-8 text-secondary-foreground">
          Likho is a free, open source notes app for your web browser. Use it as an online scratchpad for a quick
          note, a checklist, or a longer Markdown draft. You can start writing on a phone or computer without an account.
        </p>

        <h2 className={h2}>Write a quick note without signing up</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-secondary-foreground">
          <li>
            <Link href="/" className="font-medium text-brand underline-offset-4 hover:underline">
              Open Likho
            </Link>{" "}
            and type a title or start writing in the body.
          </li>
          <li>Choose New note for a separate draft. Your recent notes are listed in the sidebar.</li>
          <li>Use the download button to keep a copy as a Markdown (.md) or plain text (.txt) file.</li>
        </ol>
        <p className={p}>
          Guest edits are saved in the browser on that device. Export anything you want to keep before clearing browser data.
        </p>

        <h2 className={h2}>Save across devices or share a note by link</h2>
        <p className={p}>
          With a free account, press Save to store the current note in the cloud. To let someone read a saved note, open
          Share and turn on the view-only link. You can turn the link off from the same menu.
        </p>

        <h2 className={h2}>What you can do</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {site.features.map((feature) => (
            <li key={feature} className="rounded-xl border border-border bg-pad px-4 py-3 text-sm leading-6 text-secondary-foreground">
              {feature}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Make checklists and format notes with live Markdown</h2>
        <p className={p}>
          Start a line with <code>- [ ]</code> and a space to make a checklist item you can tick. Start with{" "}
          <code>##</code> and a space for a heading. Formatting appears as you type, and the note is still saved as
          plain Markdown text.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-pad">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>Type</th>
                <th scope="col" className={th}>You get</th>
              </tr>
            </thead>
            <tbody>
              {markdown.map(([type, result]) => (
                <tr key={type}>
                  <td className={`${td} whitespace-nowrap font-mono text-[13px] text-foreground`}>{type}</td>
                  <td className={td}>{result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={h2}>Keyboard shortcuts</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-pad">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>Keys</th>
                <th scope="col" className={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map(([keys, action]) => (
                <tr key={keys}>
                  <td className={`${td} whitespace-nowrap font-medium text-foreground`}>{keys}</td>
                  <td className={td}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={h2}>Frequently asked questions</h2>
        <div className="mt-2">
          {faqs.map((faq) => (
            <section key={faq.question} className="border-b border-border py-5">
              <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-2 text-[15px] leading-7 text-secondary-foreground">{faq.answer}</p>
            </section>
          ))}
        </div>

        <h2 className={h2}>Connect your AI assistant</h2>
        <p className={p}>
          Signed-in users can connect Claude, Cursor and other MCP clients to their cloud notes with a scoped personal access token. Read the{" "}
          <Link href="/mcp" className="font-medium text-brand underline-offset-4 hover:underline">
            MCP server setup guide
          </Link>
          , or{" "}
          <Link href="/connect" className="font-medium text-brand underline-offset-4 hover:underline">
            create a token
          </Link>
          . OAuth sign-in is planned; clients that require OAuth are not supported yet.
        </p>

        <h2 className={h2}>Compare note-taking apps</h2>
        <p className={p}>
          See how Likho fits alongside other tools for browser drafts, sharing by link, and organizing a knowledge base. Read the{" "}
          <Link href="/compare" className="font-medium text-brand underline-offset-4 hover:underline">
            comparison with Notes.io, QuickNote.io, Notion, and Obsidian
          </Link>
          .
        </p>

        <h2 className={h2}>Open source</h2>
        <p className={p}>
          Likho is free and open source under the MIT license. Likho is built by Usama Gulzar and based on QuickNotes by Piyushrathoree. Urdu text is set in Mehr Nastaliq Web by Muhammad Zeeshan Nasar (CC BY-SA 4.0). The code is on{" "}
          <a href={site.repo} className="font-medium text-brand underline-offset-4 hover:underline" rel="noopener">
            GitHub
          </a>
          .
        </p>

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Start writing — it&apos;s free
          </Link>
        </div>
      </main>
    </div>
  );
}
