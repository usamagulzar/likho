import { Alert02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard, authActionClass, authLinkClass } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { Icon } from "@/components/Icon";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
  // Keep the reset token out of the Referer header sent to other sites.
  referrer: "no-referrer",
};

function InvalidLink() {
  return (
    <AuthCard
      title="This link doesn't work"
      description="That reset link is invalid or has expired. Ask for a new one and try again."
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-soft text-destructive">
            <Icon icon={Alert02Icon} />
          </span>
          <p className="self-center text-sm leading-6 text-secondary-foreground">
            Reset links work once and expire after an hour. A newer link replaces any older one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className={authActionClass}
        >
          Request a new link
          <Icon icon={ArrowRight01Icon} />
        </Link>
      </div>
    </AuthCard>
  );
}

async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return token && !error ? <ResetPasswordForm token={token} /> : <InvalidLink />;
}

// The token comes from the URL, so it is read inside Suspense (Cache Components).
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  return (
    <AuthShell>
      <Suspense fallback={<div aria-hidden="true" className="min-h-[28rem]" />}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
