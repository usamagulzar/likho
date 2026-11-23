import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import type { AuthMode } from "@/components/auth/ModeSwitch";
import { LoginForm } from "@/components/LoginForm";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

async function LoginContent({ searchParams }: { searchParams: Promise<{ reset?: string; mode?: string }> }) {
  const [session, { reset, mode }] = await Promise.all([getServerSession(), searchParams]);
  if (session) redirect("/dashboard");
  // /login?mode=signup opens "Create account"; anything else opens "Sign in".
  const initialMode: AuthMode = mode === "signup" ? "signup" : "signin";
  return (
    <LoginForm
      initialMode={initialMode}
      notice={reset ? "Password updated. Sign in with your new password." : undefined}
    />
  );
}

// Reads the session and URL on every request, so that part streams inside Suspense (Cache Components).
// The chrome is static and renders immediately; the form reserves its own height while it loads.
export default function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; mode?: string }> }) {
  return (
    <AuthShell>
      <Suspense fallback={<div aria-hidden="true" className="min-h-[28rem]" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
