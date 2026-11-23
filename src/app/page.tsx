import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import { homeStructuredData } from "@/lib/structuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <>
      {/* The page is the notepad itself; this heading names it for search engines and screen readers. */}
      <h1 className="sr-only">{site.title}</h1>
      <JsonLd data={homeStructuredData()} />
      <noscript>
        <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
          <p>
            <strong>{site.name}</strong> — {site.summary}
          </p>
          <p>
            Likho needs JavaScript to run the editor. <a href="/about">Read about Likho and its features</a>.
          </p>
        </div>
      </noscript>
      <AppShell />
    </>
  );
}
