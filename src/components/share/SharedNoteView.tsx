import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { LogoMark } from "@/components/brand/LogoMark";
import "./shared-note.css";
import { ARABIC_SCRIPT } from "@/lib/urdu/keymap";

export interface SharedNoteViewProps {
  title: string;
  body: string;
  updatedAt: Date;
  slug?: string;
}

type MarkdownNode = {
  type?: string;
  value?: string;
  children?: unknown[];
};

function remarkHtmlAsText() {
  return (tree: unknown) => {
    const visit = (value: unknown): void => {
      if (value === null || typeof value !== "object") return;

      const node = value as MarkdownNode;
      if (node.type === "html") {
        node.type = "text";
        node.value = node.value ?? "";
        delete node.children;
        return;
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

function isHttpsImageSource(source: unknown): source is string {
  if (typeof source !== "string" || !source) return false;

  try {
    return new URL(source).protocol === "https:";
  } catch {
    return false;
  }
}

const markdownComponents: Components = {
  a: ({ href, title, children }) => (
    <a href={href} title={title} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
  img: ({ src, alt = "", title }) => {
    if (!isHttpsImageSource(src)) return alt ? <span>{alt}</span> : null;

    return (
      <span className="shared-note-image-frame">
        {/* Markdown can reference arbitrary HTTPS hosts, so the browser loads it directly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} title={title} loading="lazy" referrerPolicy="no-referrer" />
      </span>
    );
  },
  input: ({ type, checked }) =>
    type === "checkbox" ? <input type="checkbox" checked={checked} disabled readOnly tabIndex={-1} /> : null,
  table: ({ children }) => (
    <div className="shared-note-table-scroll" role="region" aria-label="Scrollable table" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }) => <pre className="shared-note-code-block">{children}</pre>,
};

export function SharedNoteView({ title, body, updatedAt, slug }: SharedNoteViewProps) {
  const updatedDate = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(updatedAt);

  return (
    <div className="shared-note-page">
      <header className="shared-note-header">
        <Link className="shared-note-brand" href="/" aria-label="Likho home">
          <LogoMark size={30} />
          <span>Likho</span>
        </Link>
        <Link className="shared-note-open-link" href="/">
          Open Likho
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
        </Link>
      </header>

      <main className="shared-note-main">
        <article className="shared-note-paper">
          <header className="shared-note-note-header">
            <h1 dir="auto" lang={ARABIC_SCRIPT.test(title) ? "ur" : undefined}>{title}</h1>
            <p>
              Updated <time dateTime={updatedAt.toISOString()}>{updatedDate}</time>
            </p>
          </header>

          <div className="shared-note-markdown notepad">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkHtmlAsText]}
              components={markdownComponents}
              urlTransform={(url, key) =>
                key === "src" ? (isHttpsImageSource(url) ? url : "") : defaultUrlTransform(url)
              }
            >
              {body}
            </ReactMarkdown>
          </div>

          {slug ? (
            <a className="shared-note-download-link" href={`/s/${slug}/raw`}>
              <ArrowDownToLine aria-hidden="true" size={16} strokeWidth={1.8} />
              Download .md
            </a>
          ) : null}
        </article>
      </main>

      <footer className="shared-note-footer">
        Shared with <Link href="/">Likho</Link> · <Link href="/">Write your own</Link>
      </footer>
    </div>
  );
}
