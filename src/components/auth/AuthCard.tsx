import type { ReactNode, Ref } from "react";

interface AuthCardProps {
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, titleRef, description, children, footer }: AuthCardProps) {
  return (
    <section className="auth-enter w-full">
      <div className="mb-7 text-center sm:mb-8">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="auth-serif text-4xl leading-[1.12] font-medium tracking-[-0.035em] text-balance text-foreground outline-none sm:text-[44px]"
        >
          {title}
        </h1>
        {description && <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-6 text-pretty text-secondary-foreground">{description}</p>}
      </div>
      {children}
      {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
    </section>
  );
}

/** Text inputs: 16px text (no iOS zoom), hairline border, 3px ring in the ring colour on focus. */
export const authInputClass =
  "w-full rounded-[12px] border border-border bg-background px-3.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/35 aria-invalid:border-destructive aria-invalid:focus:ring-destructive/25 disabled:opacity-60 [.auth-enter_&]:rounded-[10px] [.auth-enter_&]:bg-pad";

export const authActionClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-foreground px-4 text-base font-medium text-background outline-none transition-colors duration-150 hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const authLinkClass =
  "rounded-sm underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/35";
