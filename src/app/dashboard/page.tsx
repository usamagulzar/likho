import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your notes",
  robots: { index: false },
};

async function Dashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <AppShell />;
}

// The signed-in home. Guests are sent to the login page; guest notes still live at "/".
// The session is read inside Suspense so the rest of the route can prerender (Cache Components).
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
