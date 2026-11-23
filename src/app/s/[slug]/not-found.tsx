import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";
import "@/components/share/shared-note.css";

export default function SharedNoteNotFound() {
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
        <section className="shared-note-paper shared-note-not-found">
          <h1>This note isn’t shared anymore</h1>
          <p>The link may have been turned off, or the note may have been deleted.</p>
          <Link className="shared-note-open-link" href="/">
            Go to Likho
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </Link>
        </section>
      </main>

      <footer className="shared-note-footer">Shared with Likho</footer>
    </div>
  );
}
