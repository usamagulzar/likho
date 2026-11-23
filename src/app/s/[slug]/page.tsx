import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedNoteView } from "@/components/share/SharedNoteView";
import { getSharedNote } from "@/lib/shares";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const readSharedNote = cache((slug: string) => getSharedNote(slug));

function plainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}(?:>|[-+*]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await readSharedNote(slug);

  return {
    title: { absolute: note?.title ?? "Shared note" },
    description: note ? plainText(note.body) : "A note shared with Likho.",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

function LoadingNote() {
  return (
    <main aria-busy="true" aria-label="Loading shared note" style={{ minHeight: "55vh" }}>
      <span className="sr-only">Loading shared note…</span>
    </main>
  );
}

async function SharedNoteContent({ params }: PageProps) {
  const { slug } = await params;
  const note = await readSharedNote(slug);
  if (!note) notFound();

  return <SharedNoteView title={note.title} body={note.body} updatedAt={note.updatedAt} slug={slug} />;
}

export default function SharedNotePage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingNote />}>
      <SharedNoteContent params={params} />
    </Suspense>
  );
}
