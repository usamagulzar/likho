import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { authLinkClass } from "@/components/auth/AuthCard";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1.25rem,env(safe-area-inset-left))] sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pl-[max(2rem,env(safe-area-inset-left))]">
        <Link href="/" className={`${authLinkClass} inline-flex min-h-11 items-center gap-2.5 pr-1 text-sm font-semibold hover:no-underline`}>
          <LogoMark size={32} tile="var(--logo-tile)" />
          <span>Likho</span>
        </Link>
      </header>

      <main className="pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))]">
        <div className="mx-auto w-full max-w-[360px] pt-9 sm:pt-[clamp(3rem,9vh,5.5rem)]">
          {children}

          <div className="mt-7 flex justify-center border-t border-border pt-2">
            <Link href="/" className={`${authLinkClass} inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground`}>
              Continue as guest
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
