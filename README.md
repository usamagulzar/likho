<p align="center"><img src="public/brand/quick-notes-mark.svg" width="96" height="96" alt="Likho logo: two note cards with a handwritten q"></p>

# Likho

> Likho is built by Usama Gulzar, based on the open-source [QuickNotes](https://github.com/Piyushrathoree/QuickNotes) by Piyushrathoree (MIT License).

A fast, calm notepad. Open the page and start typing: notes autosave in your browser, with live Markdown (lists, headings, rules, code blocks), three writing fonts, light and dark themes, and export to `.md` or `.txt`. Sign in with email and password to keep your notes in the cloud and sync across devices.

Built with Next.js 16, TypeScript, Tailwind CSS 4, CodeMirror 6, Better Auth, Drizzle ORM and Neon Postgres.

## Urdu keyboard

Press **Ctrl+Shift+U** (or the اردو button, bottom right) to type Urdu with the standard Pakistani layout. It maps physical keys, so it works whatever language the system keyboard uses: the Q key types ق, Shift+A types آ, and number keys type Urdu digits. Urdu lines switch to right-to-left and use the Mehr Nastaliq font. The layout table is in `src/lib/urdu/keymap.ts`; the keys `` ` [ ] \ ' `` and `-` `/` are left as normal characters.

The Mehr Nastaliq Web font is by Muhammad Zeeshan Nasar (calligraphy of Nasrullah Mehr), licensed CC BY-SA 4.0, in `public/fonts/`.

## Setup

Sign-in is **email + password** (Better Auth). There is no email-verification step: signing up logs you straight in and lands on `/dashboard`. Forgot-password sends a reset link by email (Gmail SMTP); a signed-in user can change their password with their current password or by email. Guests can use the app at `/` without signing in; their notes live in the browser and move into the account on first sign-in.

### Local setup

1. Create a Neon project and copy its pooled Postgres connection string. Keep `sslmode=require` in the URL.
2. Install the app and create a local environment file:

   ```sh
   pnpm install
   cp .env.example .env.local
   openssl rand -base64 32
   ```

3. Put the Neon URL in `DATABASE_URL` and the generated random value in `BETTER_AUTH_SECRET`. Keep `BETTER_AUTH_URL=http://localhost:3000` for local development.
4. Apply the checked-in schema migration to the Neon database, then start the app:

   ```sh
   pnpm db:migrate
   pnpm dev
   ```

**Password-reset emails in development:** leave `GMAIL_USER` and `GMAIL_APP_PASSWORD` empty. The reset link is then printed in the terminal running `pnpm dev`; open it to finish the reset. To send real emails through Gmail: turn on 2-Step Verification for the Google account, create an **app password** (Google Account → Security → 2-Step Verification → App passwords), then set `GMAIL_USER` to that Gmail address and `GMAIL_APP_PASSWORD` to the 16-character app password. Gmail limits sending to roughly 500 emails a day, which is plenty for password resets.

### Vercel setup

1. Add `DATABASE_URL` to the Vercel project's environment variables using the Neon pooled connection string.
2. Generate a separate production secret with `openssl rand -base64 32` and set it as `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL` to `https://your-domain.com`, the canonical production origin. The apex domain redirects to `www`.
4. Set `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com` as well. Better Auth trusts this exact public origin and the exact Vercel deployment origins.
5. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (required in production, since there is no console to print reset links to).
6. Apply pending migrations against the configured Neon database with `pnpm db:migrate` before deploying.

Set these values in Vercel under **Project → Settings → Environment Variables** for Production.

Enable **Web Analytics** in the project's Vercel dashboard, then deploy. Likho excludes password reset and shared note URLs from analytics.

For Google indexing, verify the domain in [Google Search Console](https://search.google.com/search-console), submit the production `/sitemap.xml`, and use URL Inspection to request indexing of the homepage, `/about`, and `/compare`.

## MCP server

Likho exposes a stateless MCP Streamable HTTP endpoint at /api/mcp. Sign in, open the account menu, choose **Connect AI**, then create a read-only or read-and-write personal access token at /connect. The full token is shown once; copy it into your client configuration. Use the endpoint URL shown on /mcp or /connect.

### Claude Code

~~~sh
claude mcp add --transport http likho {URL} --header "Authorization: Bearer YOUR_TOKEN"
~~~

### Cursor

Add this entry to ~/.cursor/mcp.json:

~~~json
{
  "mcpServers": {
    "likho": {
      "url": "{URL}",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
~~~

### Claude Desktop

Configure Claude Desktop through the mcp-remote bridge in claude_desktop_config.json:

~~~json
{
  "mcpServers": {
    "likho": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "{URL}", "--header", "Authorization: Bearer ${QN_TOKEN}"],
      "env": {
        "QN_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
~~~

### Any MCP client or curl

Clients that support MCP Streamable HTTP can send a JSON-RPC tools/list request with a bearer token:

~~~sh
curl --request POST "{URL}" \
  --header "Authorization: Bearer YOUR_TOKEN" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
~~~

Client configuration syntax can change between versions; check your client's current MCP documentation. OAuth sign-in is planned. Clients that require OAuth are not supported yet.

### SEO and answer engines

`NEXT_PUBLIC_SITE_URL` also controls the canonical URLs used by the app. The app then serves:

- `/sitemap.xml` and `/robots.txt` (private routes such as `/dashboard` and `/api` are excluded; AI search crawlers are allowed on public pages)
- `/manifest.webmanifest` with installable app icons
- Open Graph and Twitter share images generated at build time
- JSON-LD structured data (`WebApplication`, `WebSite`, `FAQPage`, `BreadcrumbList`)
- `/about`: features, Markdown shortcuts, keyboard shortcuts and an FAQ written for search and answer engines
- `/llms.txt`: a plain Markdown summary for AI assistants

After deploying, submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Scripts

- `pnpm typecheck` — check TypeScript without emitting files.
- `pnpm lint` — run ESLint.
- `pnpm build` — create a production build.
- `pnpm db:generate` — generate Drizzle migrations.
- `pnpm db:migrate` — apply Drizzle migrations.
- `pnpm db:studio` — open Drizzle Studio.

## License

[MIT](LICENSE)
