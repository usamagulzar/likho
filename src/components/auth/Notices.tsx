import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

/** Server or form-level error. role="alert" so screen readers announce it as soon as it appears. */
export function ErrorBanner({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex gap-3 rounded-[12px] border border-destructive/35 bg-destructive/5 px-3.5 py-3 text-sm leading-5 text-foreground"
    >
      <Icon icon={Alert02Icon} className="mt-px text-destructive" />
      <p>{children}</p>
    </div>
  );
}

/** Calm confirmation banner, for example after a password reset. */
export function NoticeBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="mb-6 flex gap-3 rounded-[12px] border border-border bg-brand-soft px-3.5 py-3 text-sm leading-5 text-secondary-foreground"
    >
      <Icon icon={CheckmarkCircle02Icon} className="mt-px text-success" />
      <p>{children}</p>
    </div>
  );
}
