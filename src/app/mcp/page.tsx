import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { mcpFaqs } from "@/lib/faq";
import { absoluteUrl, site } from "@/lib/site";
import { mcpStructuredData } from "@/lib/structuredData";

const title = "Likho MCP server — Claude, Cursor and AI assistants";
const description =
  "Save, find and manage Likho from Claude, Cursor and other MCP clients using a scoped personal access token.";
const endpoint = absoluteUrl("/api/mcp");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/mcp" },
  openGraph: { title, description, url: "/mcp", type: "article" },
  twitter: { title, description },
};

const tools: [string, string, string][] = [
  [
    "list_notes",
    "Read",
    "List notes (20 by default, max 100) with title, update time and a roughly 160-character body preview. Supports offset and optionally including deleted notes.",
  ],
  [
    "search_notes",
    "Read",
    "Search note content for a case-insensitive substring (query length 1–200) in active notes, newest first, with a snippet about 80 characters either side of the first match.",
  ],
  [
    "get_note",
    "Read",
    "Read a note by UUID, including its title, body, timestamps and deleted status.",
  ],
  [
    "create_note",
    "Read & write",
    "Create a note. If no title is supplied, use the first 60 characters of the body's first line, or Untitled note when empty.",
  ],
  [
    "update_note",
    "Read & write",
    "Replace the supplied title and/or body while keeping the other part; provide at least one of title or body.",
  ],
  [
    "append_to_note",
    "Read & write",
    "Append text using a newline by default, or choose a blank line or space as the separator.",
  ],
  [
    "delete_note",
    "Read & write",
    "Soft-delete a note so it can be restored later.",
  ],
  [
    "restore_note",
    "Read & write",
    "Restore a soft-deleted note.",
  ],
];

const codeClass =
  "m-0 min-w-0 max-w-full overflow-x-auto whitespace-pre px-4 py-4 text-[13px] leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
const sectionHeading = "mt-12 text-xl font-semibold tracking-tight text-foreground";
const bodyText = "mt-3 text-[15px] leading-7 text-secondary-foreground";

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-pad">
      <pre
        aria-label={label}
        tabIndex={0}
        className={codeClass}
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function McpPage() {
  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "likho": {
          url: endpoint,
          headers: { Authorization: "Bearer YOUR_TOKEN" },
        },
      },
    },
    null,
    2,
  );
  const desktopConfig = JSON.stringify(
    {
      mcpServers: {
        "likho": {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            endpoint,
            "--header",
            "Authorization: Bearer ${QN_TOKEN}",
          ],
          env: { QN_TOKEN: "YOUR_TOKEN" },
        },
      },
    },
    null,
    2,
  );
  const curlCommand =
    "curl --request POST " +
    JSON.stringify(endpoint) +
    ' --header "Authorization: Bearer YOUR_TOKEN" --header "Content-Type: application/json" --header "Accept: application/json, text/event-stream" --data \'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\'';

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <JsonLd data={mcpStructuredData(mcpFaqs, description)} />
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {site.name}
          </Link>
          <Link
            href="/connect"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Connect AI
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex gap-1.5">
            <li>
              <Link href="/" className="hover:text-foreground hover:underline">
                {site.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-secondary-foreground">
              MCP server
            </li>
          </ol>
        </nav>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Connect an AI assistant to Likho
        </h1>
        <p className="mt-4 text-[17px] leading-8 text-secondary-foreground">
          The Likho MCP server lets Claude, Cursor and other MCP-compatible clients work with your
          signed-in cloud notes through a stateless Streamable HTTP endpoint. Each connection uses a
          personal access token with read or read-and-write scope.
        </p>

        <section aria-labelledby="tools-heading">
          <h2 id="tools-heading" className={sectionHeading}>
            What your assistant can do
          </h2>
          <p className={bodyText}>
            Read and write tools are available to read-and-write tokens; write access also includes read
            access.
          </p>
          <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-border bg-pad">
            <table className="w-full min-w-[720px] border-collapse">
              <caption className="sr-only">Likho MCP tools and their access scopes</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-border px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Scope
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    What it does
                  </th>
                </tr>
              </thead>
              <tbody>
                {tools.map(([name, scope, action]) => (
                  <tr key={name}>
                    <td
                      className="border-b border-border px-3 py-2.5 align-top font-mono text-[13px] text-foreground"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {name}
                    </td>
                    <td className="whitespace-nowrap border-b border-border px-3 py-2.5 align-top text-sm text-secondary-foreground">
                      {scope}
                    </td>
                    <td className="border-b border-border px-3 py-2.5 align-top text-sm leading-6 text-secondary-foreground">
                      {action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="setup-heading">
          <h2 id="setup-heading" className={sectionHeading}>
            Set up in 2 minutes
          </h2>
          <p className={bodyText}>
            Create a token first, then use the same endpoint URL in your client configuration:
          </p>
          <CodeBlock label="Likho MCP endpoint">{endpoint}</CodeBlock>

          <div className="mt-7">
            <h3 className="text-base font-semibold text-foreground">Claude Code</h3>
            <CodeBlock label="Claude Code setup command">
              {"claude mcp add --transport http likho " +
                endpoint +
                ' --header "Authorization: Bearer YOUR_TOKEN"'}
            </CodeBlock>
          </div>

          <div className="mt-7">
            <h3 className="text-base font-semibold text-foreground">Cursor</h3>
            <p className={bodyText}>Add this JSON to ~/.cursor/mcp.json:</p>
            <CodeBlock label="Cursor MCP configuration">{cursorConfig}</CodeBlock>
          </div>

          <div className="mt-7">
            <h3 className="text-base font-semibold text-foreground">Claude Desktop</h3>
            <p className={bodyText}>
              Configure claude_desktop_config.json to use the mcp-remote bridge:
            </p>
            <CodeBlock label="Claude Desktop MCP configuration">{desktopConfig}</CodeBlock>
          </div>

          <div className="mt-7">
            <h3 className="text-base font-semibold text-foreground">Any MCP client or curl</h3>
            <p className={bodyText}>
              Send this raw JSON-RPC tools/list request to the endpoint. MCP clients need Streamable HTTP
              support and the same bearer token header.
            </p>
            <CodeBlock label="curl JSON-RPC tools/list request">{curlCommand}</CodeBlock>
          </div>

          <p className={bodyText}>
            Exact configuration syntax changes between client versions. Check your client&apos;s current
            MCP documentation if these examples do not match its settings.
          </p>
        </section>

        <section aria-labelledby="token-heading">
          <h2 id="token-heading" className={sectionHeading}>
            How to get a token
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-secondary-foreground">
            <li>Sign in or create a Likho account.</li>
            <li>Open the account menu and choose Connect AI.</li>
            <li>
              On <Link href="/connect" className="font-medium text-brand underline-offset-4 hover:underline">Connect AI</Link>,
              create a read-only or read-and-write token.
            </li>
            <li>Copy the token when it is shown, then paste it into your client configuration.</li>
          </ol>
          <p className={bodyText}>
            The full token is shown once. If you lose it, revoke it and create another.
          </p>
        </section>

        <section aria-labelledby="security-heading">
          <h2 id="security-heading" className={sectionHeading}>
            Security
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-secondary-foreground">
            <li>Tokens are revocable and scoped as read-only or read and write.</li>
            <li>An assistant can access only cloud notes owned by the account associated with its token.</li>
            <li>The raw token is shown once and stored as a SHA-256 hash.</li>
            <li>Each note is limited to 1 MiB of UTF-8 content.</li>
            <li>
              The rate limit is 120 requests per minute per token. It is held in memory, so on serverless
              hosting it may apply per running instance.
            </li>
            <li>Guest notes stay in browser storage and are not reachable through MCP.</li>
            <li>
              Version 1 uses personal access tokens. OAuth sign-in is planned; clients that require OAuth
              are not supported yet.
            </li>
          </ul>
        </section>

        <section aria-labelledby="prompts-heading">
          <h2 id="prompts-heading" className={sectionHeading}>
            Example prompts
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-secondary-foreground">
            <li>Save this as a note titled …</li>
            <li>Find my note about …</li>
            <li>Append this to my Groceries note.</li>
            <li>Read my note titled …</li>
            <li>Change the title of my note …</li>
            <li>Restore the note I deleted yesterday.</li>
          </ul>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={sectionHeading}>
            Frequently asked questions
          </h2>
          <div className="mt-2">
            {mcpFaqs.map((faq) => (
              <section key={faq.question} className="border-b border-border py-5">
                <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-2 text-[15px] leading-7 text-secondary-foreground">{faq.answer}</p>
              </section>
            ))}
          </div>
        </section>

        <div className="mt-12">
          <Link
            href="/connect"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Create a token
          </Link>
        </div>
      </main>
    </div>
  );
}
