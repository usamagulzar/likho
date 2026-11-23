import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ConnectManager } from "@/components/connect/ConnectManager";
import { getServerSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Connect AI" },
  robots: { index: false, follow: false },
};

async function ConnectPageContent() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return <ConnectManager serverUrl={new URL("/api/mcp", site.url).toString()} />;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-dvh bg-background" />}>
      <ConnectPageContent />
    </Suspense>
  );
}
