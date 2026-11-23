"use client";

import { useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat01Icon,
  HelpCircleIcon,
  Login03Icon,
  Logout01Icon,
  SquareLock02Icon,
  UnfoldMoreIcon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { WritingTypeRows } from "@/components/FontPopover";
import { Icon } from "@/components/Icon";
import { ThemeRow } from "@/components/ThemeButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { initialsFor, type UserDisplay } from "@/components/userDisplay";
import { signOut, useSession } from "@/lib/auth-client";
import { clearCurrentUserCloudCache, countUnsavedCloudNotes } from "@/lib/store/cloudCache";
import { cn } from "@/lib/utils";

/** Profile trigger in the sidebar footer: 52px tall, 10px radius, open state shown with the selected fill. */
const footerRowClass =
  "group flex h-13 w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2 text-left outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-selected";

/** Rail trigger: a 40px hit area with the avatar inside. */
const railTriggerClass =
  "group grid size-10 place-items-center rounded-[10px] outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-selected";

/** Menu row: 40px tall (44px on touch), 10px radius, one leading icon. */
const menuRowClass =
  "flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm text-secondary-foreground outline-none transition-colors duration-150 hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11";

/** Avatar: the user's image or initials, or a neutral circle with a person glyph for guests. The ring is a soft halo. */
function UserAvatar({ user, className }: { user: UserDisplay | null; className?: string }) {
  if (!user) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full bg-selected text-muted-foreground ring-2 ring-hover",
          className,
        )}
      >
        <Icon icon={UserIcon} />
      </span>
    );
  }
  return (
    <Avatar className={cn("size-8 ring-2 ring-hover", className)}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="bg-selected text-xs font-medium text-secondary-foreground">
        {initialsFor(user)}
      </AvatarFallback>
    </Avatar>
  );
}

function pluralNotes(count: number): string {
  return count === 1 ? "1 note only exists" : `${count} notes only exist`;
}

interface AccountMenuProps {
  /** null for a guest. */
  user: UserDisplay | null;
  side: "top" | "right";
  align: "start" | "end";
  children: ReactElement;
}

/**
 * The profile menu: a compact list (header, sign-in for guests, writing font, theme, help, and for signed-in users
 * change password and sign out). It renders in a portal, so the sidebar's overflow never clips it. Dialogs sit
 * outside the popover so they outlive it.
 */
function AccountMenu({ user, side, align, children }: AccountMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unsavedCount, setUnsavedCount] = useState(0);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function performSignOut() {
    await signOut();
    clearCurrentUserCloudCache();
    // The store re-reads the guest notes on sign-out; leave /dashboard, which is for signed-in users only.
    router.replace("/");
    router.refresh();
  }

  function requestSignOut() {
    setMenuOpen(false);
    const count = countUnsavedCloudNotes();
    if (count > 0) {
      setUnsavedCount(count);
      setConfirmOpen(true);
      return;
    }
    void performSignOut();
  }

  // Up/Down/Home/End move between the visible rows. Rows inside a collapsed list are inert, so they are skipped.
  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return;
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? []).filter(
      (item) => item.closest("[inert]") === null,
    );
    if (items.length === 0) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length;
    else if (event.key === "ArrowUp") next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
    else if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={side === "top" ? 4 : 12}
          className={cn(
            side === "top" ? "w-(--radix-popover-trigger-width)" : "w-[264px]",
            "max-h-(--radix-popover-content-available-height) overflow-y-auto rounded-[14px] border border-border bg-pad p-1.5 text-foreground shadow-menu",
            "data-[state=open]:duration-140 data-[state=closed]:duration-140",
          )}
        >
          <div ref={menuRef} onKeyDown={onMenuKeyDown} role="group" aria-label="Account" className="flex flex-col">
            <div className="flex items-center gap-3 px-2.5 pt-1.5 pb-2.5">
              <UserAvatar user={user} className="size-9" />
              <div className="min-w-0">
                {user ? (
                  <>
                    <p className="truncate text-sm font-medium text-foreground">{user.name || "Signed in"}</p>
                    {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Guest</p>
                    <p className="text-xs text-muted-foreground">Not signed in</p>
                  </>
                )}
              </div>
            </div>

            {!user && (
              <div className="grid gap-0.5">
                <Link
                  href="/login"
                  data-menu-item
                  onClick={() => setMenuOpen(false)}
                  className={cn(menuRowClass, "font-medium text-foreground")}
                >
                  <Icon icon={Login03Icon} className="text-muted-foreground" />
                  Sign in
                </Link>
                <Link
                  href="/login?mode=signup"
                  data-menu-item
                  onClick={() => setMenuOpen(false)}
                  className={menuRowClass}
                >
                  <Icon icon={UserAdd01Icon} className="text-muted-foreground" />
                  Create account
                </Link>
              </div>
            )}

            <div role="separator" className="mx-2 my-1.5 h-px bg-border" />

            <WritingTypeRows />
            <ThemeRow />

            <div role="separator" className="mx-2 my-1.5 h-px bg-border" />

            <Link href="/about" data-menu-item onClick={() => setMenuOpen(false)} className={menuRowClass}>
              <Icon icon={HelpCircleIcon} className="text-muted-foreground" />
              Help &amp; shortcuts
            </Link>
            {user && (
              <>
                <Link href="/connect" data-menu-item onClick={() => setMenuOpen(false)} className={menuRowClass}>
                  <Icon icon={AiChat01Icon} className="text-muted-foreground" />
                  Connect AI
                </Link>
                <button
                  type="button"
                  data-menu-item
                  onClick={() => {
                    setMenuOpen(false);
                    setPasswordOpen(true);
                  }}
                  className={menuRowClass}
                >
                  <Icon icon={SquareLock02Icon} className="text-muted-foreground" />
                  Change password
                </button>
                <div role="separator" className="mx-2 my-1.5 h-px bg-border" />
                <button
                  type="button"
                  data-menu-item
                  onClick={requestSignOut}
                  className={cn(menuRowClass, "hover:bg-destructive/10 hover:text-destructive")}
                >
                  <Icon icon={Logout01Icon} className="text-muted-foreground" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {user?.email && <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} email={user.email} />}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            // Cancel is the safe choice, so it takes focus.
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Sign out with unsaved notes?</DialogTitle>
            <DialogDescription>
              {`${pluralNotes(unsavedCount)} on this device and will be lost if you sign out. Save them first, or sign out anyway.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button ref={cancelRef} variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                void performSignOut();
              }}
              className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
            >
              Sign out anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AccountAreaProps {
  variant?: "full" | "rail";
}

/**
 * The sidebar footer: one profile row that opens the account menu. Collapsed rail: the avatar alone opens the same
 * menu to the right. Renders nothing while the session loads.
 */
export function AccountArea({ variant = "full" }: AccountAreaProps) {
  const { data: session, isPending } = useSession();
  if (isPending) return null;

  const user = session?.user ?? null;

  if (variant === "rail") {
    return (
      <AccountMenu user={user} side="right" align="end">
        <button type="button" aria-label={user ? "Account" : "Guest account"} title={user ? "Account" : "Guest"} className={railTriggerClass}>
          <UserAvatar user={user} />
        </button>
      </AccountMenu>
    );
  }

  return (
    <AccountMenu user={user} side="top" align="start">
      <button type="button" className={footerRowClass}>
        <UserAvatar user={user} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {user ? user.name || "Signed in" : "Guest"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {user ? user.email || "" : "Sign in to save your notes"}
          </span>
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className="shrink-0 text-muted-foreground transition-[transform,opacity] duration-150 group-data-[state=open]:rotate-180 group-data-[state=open]:opacity-70"
        />
      </button>
    </AccountMenu>
  );
}
