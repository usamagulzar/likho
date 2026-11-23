"use client";

import Link from "next/link";
import { useId, type RefObject } from "react";
import { CloudIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { useWideScreen } from "@/components/useWideScreen";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const primaryLink =
  "inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors duration-150 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad md:h-10";

const secondaryLink =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-pad md:h-10";

/** Focus lands on "Sign in", the primary action. Radix would skip the links and pick "Not now". */
function focusSignIn(event: Event) {
  event.preventDefault();
  const root = event.currentTarget;
  if (root instanceof HTMLElement) root.querySelector<HTMLElement>("a[href='/login']")?.focus();
}

interface PromptBodyProps {
  titleId: string;
  descriptionId: string;
  /** Radix Dialog parts for the bottom sheet, so the sheet is named. Plain elements for the popover. */
  inSheet: boolean;
  onNotNow: () => void;
}

function PromptBody({ titleId, descriptionId, inSheet, onNotNow }: PromptBodyProps) {
  const Heading = inSheet ? SheetTitle : "h2";
  const Text = inSheet ? SheetDescription : "p";

  return (
    <div className="flex flex-col gap-4">
      <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon icon={CloudIcon} />
      </span>
      <div className="flex flex-col gap-1.5">
        <Heading id={titleId} className="text-base leading-snug font-semibold text-foreground">
          Sign in to save your notes
        </Heading>
        <Text id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">
          Save your notes to your account and open them on any device. Until you sign in, they stay on this device
          only.
        </Text>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/login" className={primaryLink}>
          Sign in
        </Link>
        <Link href="/login?mode=signup" className={secondaryLink}>
          Create account
        </Link>
      </div>
      <button
        type="button"
        onClick={onNotNow}
        className="inline-flex h-11 items-center self-start rounded-lg px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9"
      >
        Not now
      </button>
    </div>
  );
}

interface SaveRequiredPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Save button the popover hangs from on md+. Focus goes back to it when the prompt closes. */
  anchorRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Shown to a signed-out visitor who presses Save. A popover anchored to the Save button on md+, and a bottom sheet
 * on phones (where the button may not be on screen). Escape and "Not now" close it. The page never navigates by
 * itself: only the two links do.
 */
export function SaveRequiredPrompt({ open, onOpenChange, anchorRef }: SaveRequiredPromptProps) {
  const wide = useWideScreen();
  const titleId = useId();
  const descriptionId = useId();
  const close = () => onOpenChange(false);

  if (wide) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor virtualRef={anchorRef} />
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          // Radix skips links when it picks the first focus target, so the primary action gets focus explicitly.
          onOpenAutoFocus={focusSignIn}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            anchorRef.current?.focus();
          }}
          className="w-80 p-5"
        >
          <PromptBody titleId={titleId} descriptionId={descriptionId} inSheet={false} onNotNow={close} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onOpenAutoFocus={focusSignIn}
        className="gap-0 rounded-t-2xl border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <PromptBody titleId={titleId} descriptionId={descriptionId} inSheet onNotNow={close} />
      </SheetContent>
    </Sheet>
  );
}
