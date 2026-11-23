"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getMcpUrlSnapshot() {
  return `${window.location.origin}/api/mcp`;
}

interface TokenRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: ("read" | "write")[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
}

type TokenStatus = "Active" | "Expired" | "Revoked";

const inputClass =
  "mt-1.5 h-11 w-full min-w-0 rounded-lg border border-input bg-pad px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55";
const outlineButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-pad px-3 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55";

function tokenStatus(token: TokenRecord): TokenStatus {
  if (token.revokedAt) return "Revoked";
  if (token.expiresAt && Date.parse(token.expiresAt) <= Date.now()) return "Expired";
  return "Active";
}

function statusClass(status: TokenStatus): string {
  if (status === "Active") return "bg-success/10 text-success";
  if (status === "Expired") return "bg-warning/10 text-warning";
  return "bg-hover text-muted-foreground";
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function selectTarget(target: HTMLElement | null) {
  if (!target) return;
  target.focus();
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.select();
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(target);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

async function copyValue(value: string, target: HTMLElement | null): Promise<string> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return "Copied to clipboard.";
    }
  } catch {
    // Continue with a visible text selection when clipboard permission is unavailable.
  }

  selectTarget(target);
  return "Text selected. Press Ctrl+C or ⌘C to copy.";
}

function CopyButton({ value, label, target }: { value: string; label: string; target: HTMLElement | null }) {
  const [message, setMessage] = useState("");

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        className={outlineButtonClass}
        aria-label={label}
        onClick={async () => setMessage(await copyValue(value, target))}
      >
        Copy
      </button>
      <span className="max-w-40 text-right text-[11px] leading-4 text-muted-foreground" aria-live="polite">{message}</span>
    </div>
  );
}

async function fetchTokenRecords(): Promise<TokenRecord[]> {
  const response = await fetch("/api/tokens", { cache: "no-store" });
  const payload = (await response.json()) as { tokens?: TokenRecord[]; error?: string };
  if (!response.ok) throw new Error(payload.error || "Could not load your API tokens.");
  return payload.tokens ?? [];
}

function CodeSnippet({ title, value }: { title: string; value: string }) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [message, setMessage] = useState("");

  return (
    <article className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <button
          type="button"
          aria-label={`Copy ${title} setup`}
          className="rounded-md px-2 py-1 text-xs font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          onClick={async () => setMessage(await copyValue(value, codeRef.current))}
        >
          Copy
        </button>
      </div>
      <pre
        ref={codeRef}
        tabIndex={0}
        aria-label={`${title} setup snippet`}
        className="overflow-hidden rounded-lg border border-border bg-pad p-3 font-mono text-[12px] leading-5 text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]"
      >
        <code className="whitespace-pre-wrap break-all">{value}</code>
      </pre>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{message}</p>
    </article>
  );
}

function buildSnippets(url: string, token: string) {
  const header = `Authorization: Bearer ${token}`;
  const claudeDesktop = JSON.stringify(
    {
      mcpServers: {
        "likho": {
          command: "npx",
          args: ["-y", "mcp-remote", url, "--header", header],
        },
      },
    },
    null,
    2,
  );
  const cursor = JSON.stringify(
    {
      mcpServers: {
        "likho": {
          url,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );
  const claudeCode = `claude mcp add --transport http likho ${url} --header "${header}"`;
  const curl = `curl '${url}' -H 'Authorization: Bearer ${token}' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'`;

  return { claudeCode, claudeDesktop, cursor, curl };
}

export function ConnectManager({ serverUrl }: { serverUrl: string }) {
  const mcpUrl = useSyncExternalStore(subscribeToLocation, getMcpUrlSnapshot, () => serverUrl);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [tokensError, setTokensError] = useState("");
  const [name, setName] = useState("");
  const [access, setAccess] = useState<"read" | "read-write">("read");
  const [expiry, setExpiry] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [revealedToken, setRevealedToken] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState("");
  const [tokenStatusMessage, setTokenStatusMessage] = useState("");
  const tokenListHeadingRef = useRef<HTMLHeadingElement>(null);
  const revokeActionRef = useRef<HTMLButtonElement>(null);
  const [urlInput, setUrlInput] = useState<HTMLInputElement | null>(null);
  const [tokenInput, setTokenInput] = useState<HTMLInputElement | null>(null);

  const loadTokens = useCallback(async () => {
    setLoadingTokens(true);
    setTokensError("");
    try {
      setTokens(await fetchTokenRecords());
    } catch (error) {
      setTokensError(error instanceof Error ? error.message : "Could not load your API tokens.");
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchTokenRecords()
      .then((records) => {
        if (!active) return;
        setTokensError("");
        setTokens(records);
      })
      .catch((error: unknown) => {
        if (active) setTokensError(error instanceof Error ? error.message : "Could not load your API tokens.");
      })
      .finally(() => {
        if (active) setLoadingTokens(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    setRevealedToken("");

    const expiresInDays = expiry === "never" ? null : Number(expiry);
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, access, expiresInDays }),
      });
      const payload = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !payload.token) {
        if (response.status === 409) throw new Error("You have reached the limit of 20 active tokens. Revoke one before creating another.");
        throw new Error(payload.error || "Could not create the token. Check the details and try again.");
      }

      setRevealedToken(payload.token);
      setName("");
      setLoadingTokens(true);
      await loadTokens();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create the token. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setRevokeError("");
    try {
      const response = await fetch(`/api/tokens/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Could not revoke this token. Please try again.");
      }
      setConfirmingId(null);
      await loadTokens();
      setTokenStatusMessage("Token revoked.");
      window.requestAnimationFrame(() => tokenListHeadingRef.current?.focus());
    } catch (error) {
      setRevokeError(error instanceof Error ? error.message : "Could not revoke this token. Please try again.");
    } finally {
      setRevokingId(null);
    }
  }

  const setupToken = revealedToken || "YOUR_TOKEN";
  const snippets = buildSnippets(mcpUrl, setupToken);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Likho
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Your notes
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-foreground hover:underline">Likho</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-secondary-foreground">Connect AI</li>
          </ol>
        </nav>

        <div className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Connect AI</h1>
          <p className="mt-3 max-w-[68ch] text-[15px] leading-7 text-secondary-foreground sm:text-base">
            Connect Claude, Cursor, and other MCP-compatible assistants to your cloud notes with a personal access token.
            Give each client its own scope and revoke access whenever you need to.
          </p>
        </div>

        <section aria-labelledby="server-url-heading" className="mt-8 border-t border-border pt-6">
          <h2 id="server-url-heading" className="text-lg font-semibold tracking-tight">MCP server URL</h2>
          <p className="mt-1 text-sm leading-6 text-secondary-foreground">Use this address in your AI client&apos;s MCP settings.</p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
            <input
              ref={setUrlInput}
              aria-label="MCP server URL"
              readOnly
              value={mcpUrl}
              className={`${inputClass} mt-0 min-h-11 w-full font-mono text-[13px] sm:flex-1`}
            />
            <CopyButton value={mcpUrl} label="Copy MCP server URL" target={urlInput} />
          </div>
        </section>

        <section aria-labelledby="create-token-heading" className="mt-8 border-t border-border pt-6">
          <h2 id="create-token-heading" className="text-lg font-semibold tracking-tight">Create a token</h2>
          <p className="mt-1 text-sm leading-6 text-secondary-foreground">Create one token for each assistant or device.</p>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label htmlFor="token-name" className="text-sm font-medium text-foreground">Token name</label>
              <input
                id="token-name"
                name="name"
                required
                maxLength={60}
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Claude on laptop"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Up to 60 characters. Names help you recognize a token later.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="token-access" className="text-sm font-medium text-foreground">Access</label>
                <select id="token-access" value={access} onChange={(event) => setAccess(event.target.value as "read" | "read-write")} className={inputClass}>
                  <option value="read">Read only</option>
                  <option value="read-write">Read &amp; write</option>
                </select>
              </div>
              <div>
                <label htmlFor="token-expiry" className="text-sm font-medium text-foreground">Expires</label>
                <select id="token-expiry" value={expiry} onChange={(event) => setExpiry(event.target.value)} className={inputClass}>
                  <option value="30">In 30 days</option>
                  <option value="90">In 90 days</option>
                  <option value="365">In 1 year</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            {createError && <p role="alert" className="text-sm text-destructive">{createError}</p>}
            <button type="submit" disabled={creating} className={`${primaryButtonClass} w-full sm:w-auto`}>
              {creating ? "Creating token…" : "Create token"}
            </button>
          </form>

          {revealedToken && (
            <div className="mt-5 rounded-xl border border-warning/35 bg-pad p-4 sm:p-5" aria-labelledby="new-token-heading">
              <div className="flex flex-col gap-1">
                <h3 id="new-token-heading" className="text-sm font-semibold text-foreground">Copy your new token now</h3>
                <p className="text-sm leading-6 text-secondary-foreground">
                  Likho shows this token once. It is also in the setup snippets below while this notice is open.
                  Save your client config before hiding it; the snippets will then use <code className="font-mono text-[12px]">YOUR_TOKEN</code>.
                </p>
              </div>
              <div className="mt-3 flex min-w-0 items-start gap-2">
                <input
                  ref={setTokenInput}
                  aria-label="New personal access token"
                  readOnly
                  value={revealedToken}
                  className={`${inputClass} mt-0 min-h-11 flex-1 font-mono text-[13px]`}
                />
                <CopyButton value={revealedToken} label="Copy new token" target={tokenInput} />
              </div>
              <button
                type="button"
                className="mt-3 rounded-md px-1 py-1 text-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setRevealedToken("");
                }}
              >
                Hide token
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="token-list-heading" className="mt-8 border-t border-border pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 ref={tokenListHeadingRef} id="token-list-heading" tabIndex={-1} className="text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring">Your tokens</h2>
            <span className="text-xs text-muted-foreground">Raw tokens are never stored or shown in this list.</span>
          </div>
          <p className="sr-only" role="status" aria-live="polite">{tokenStatusMessage}</p>

          {loadingTokens ? (
            <p role="status" className="mt-4 text-sm text-muted-foreground">Loading tokens…</p>
          ) : tokensError ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p role="alert" className="text-sm text-destructive">{tokensError}</p>
              <button type="button" className={outlineButtonClass} onClick={() => { setLoadingTokens(true); void loadTokens(); }}>Try again</button>
            </div>
          ) : tokens.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-5 text-sm leading-6 text-secondary-foreground">
              No tokens yet. Create one above to connect an AI client to your notes.
            </p>
          ) : (
            <ul className="mt-3">
              {tokens.map((token) => {
                const status = tokenStatus(token);
                const isConfirming = confirmingId === token.id;
                return (
                  <li key={token.id} className="border-t border-border py-4 first:border-t-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">{token.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}>{status}</span>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{token.prefix}…</p>
                    <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">Access</dt>
                        <dd className="mt-0.5 text-secondary-foreground">{token.scopes.includes("write") ? "Read & write" : "Read only"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Created</dt>
                        <dd className="mt-0.5 text-secondary-foreground">{formatDate(token.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Last used</dt>
                        <dd className="mt-0.5 text-secondary-foreground">{formatDate(token.lastUsedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Expires</dt>
                        <dd className="mt-0.5 text-secondary-foreground">{formatDate(token.expiresAt)}</dd>
                      </div>
                    </dl>
                    {status !== "Revoked" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          ref={isConfirming ? revokeActionRef : undefined}
                          type="button"
                          disabled={revokingId === token.id}
                          aria-describedby={isConfirming ? `revoke-confirm-${token.id}` : undefined}
                          className="rounded-md px-2 py-1 text-sm font-semibold text-destructive underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
                          onClick={() => {
                            if (isConfirming) {
                              void handleRevoke(token.id);
                              return;
                            }
                            setRevokeError("");
                            setTokenStatusMessage("");
                            setConfirmingId(token.id);
                          }}
                        >
                          {revokingId === token.id ? "Revoking…" : isConfirming ? "Confirm revoke" : "Revoke"}
                        </button>
                        {isConfirming && <span id={`revoke-confirm-${token.id}`} className="text-sm text-secondary-foreground">Revoke this token?</span>}
                        {isConfirming && <button type="button" className="rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setConfirmingId(null); revokeActionRef.current?.focus(); }}>Cancel</button>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {revokeError && <p role="alert" className="mt-2 text-sm text-destructive">{revokeError}</p>}
        </section>

        <section aria-labelledby="setup-heading" className="mt-8 border-t border-border pt-6">
          <h2 id="setup-heading" className="text-lg font-semibold tracking-tight">Set up your client</h2>
          <p className="mt-1 text-sm leading-6 text-secondary-foreground">
            Use a token above. If you hid the new token, replace <code className="font-mono text-[12px]">YOUR_TOKEN</code> in the snippet with a token you saved.
            See the <Link href="/mcp" className="font-medium text-brand underline-offset-4 hover:underline">MCP setup guide</Link> for details.
          </p>
          <div className="mt-5">
            <CodeSnippet title="Claude Code" value={snippets.claudeCode} />
            <CodeSnippet title="Claude Desktop" value={snippets.claudeDesktop} />
            <CodeSnippet title="Cursor (mcp.json)" value={snippets.cursor} />
            <CodeSnippet title="Generic cURL" value={snippets.curl} />
          </div>
        </section>
      </main>
    </div>
  );
}
