"use client";

import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MIN_PASSWORD_LENGTH, describeAuthError } from "@/components/auth/errors";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePassword, requestPasswordReset } from "@/lib/auth-client";

type Method = "password" | "email";

const methods: SegmentOption<Method>[] = [
  { value: "password", label: "Current password" },
  { value: "email", label: "Email me a link" },
];

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function ChangePasswordDialog({ open, onOpenChange, email }: ChangePasswordDialogProps) {
  const errorId = useId();
  const [method, setMethod] = useState<Method>("password");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Passwords never stay in state while the dialog is closed, and it always reopens clean.
  function setOpen(nextOpen: boolean) {
    if (!nextOpen) {
      setMethod("password");
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      setBusy(false);
    }
    onOpenChange(nextOpen);
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`);
      return;
    }
    if (next !== confirm) {
      setError("The two new passwords don't match.");
      return;
    }
    if (next === current) {
      setError("The new password must be different from the current one.");
      return;
    }

    setError(null);
    setBusy(true);
    const { error: requestError } = await changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setBusy(false);
    if (requestError) {
      setError(describeAuthError(requestError, "We couldn't change your password. Please try again."));
      return;
    }
    toast.success("Password changed. Other devices were signed out.");
    setOpen(false);
  }

  async function submitEmail() {
    setError(null);
    setBusy(true);
    const { error: requestError } = await requestPasswordReset({ email, redirectTo: "/reset-password" });
    setBusy(false);
    if (requestError) {
      setError(describeAuthError(requestError, "We couldn't send the email. Please try again in a moment."));
      return;
    }
    toast.success(`We sent a reset link to ${email}.`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm gap-5 rounded-2xl border border-border bg-pad p-6 text-foreground shadow-menu">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">Change password</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-foreground">
            Confirm it&apos;s you with your current password, or get a reset link by email.
          </DialogDescription>
        </DialogHeader>

        <SegmentedControl
          label="How to change your password"
          options={methods}
          value={method}
          onChange={(value) => {
            setMethod(value);
            setError(null);
          }}
        />

        {method === "password" ? (
          <form onSubmit={submitPassword} noValidate className="flex flex-col gap-4">
            <PasswordInput
              label="Current password"
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
              autoFocus
              placeholder="Your current password"
              invalid={Boolean(error)}
              describedBy={error ? errorId : undefined}
            />
            <PasswordInput
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              invalid={Boolean(error)}
              describedBy={error ? errorId : undefined}
            />
            <PasswordInput
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Repeat the new password"
              invalid={Boolean(error)}
              describedBy={error ? errorId : undefined}
            />
            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-10 w-full">
              {busy ? "Saving…" : "Change password"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-secondary-foreground">
              We&apos;ll email a link to <span className="font-medium text-foreground">{email}</span>. Open it to choose a
              new password. You don&apos;t need your current one.
            </p>
            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="button" disabled={busy} onClick={() => void submitEmail()} className="h-10 w-full">
              {busy ? "Sending…" : "Email me a reset link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
