"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { AutoHeight } from "@/components/auth/AutoHeight";
import { MIN_PASSWORD_LENGTH, describeAuthError } from "@/components/auth/errors";
import { ErrorBanner } from "@/components/auth/Notices";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Icon } from "@/components/Icon";
import { resetPassword } from "@/lib/auth-client";

type Field = "password" | "confirm";

function passwordProblem(value: string): string | undefined {
  if (!value) return "Choose a new password.";
  if (value.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return undefined;
}

function confirmProblem(value: string, password: string): string | undefined {
  if (!value) return "Repeat the new password.";
  if (value !== password) return "The two passwords don't match.";
  return undefined;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) passwordRef.current?.focus();
  }, []);

  function blurCheck(field: Field) {
    const value = field === "password" ? password : confirm;
    if (!value && !errors[field]) return;
    const problem = field === "password" ? passwordProblem(password) : confirmProblem(confirm, password);
    setErrors((current) => ({ ...current, [field]: problem }));
  }

  // Keep a shown error in step with what is typed, so it clears as soon as it is fixed.
  function onPasswordChange(next: string) {
    setPassword(next);
    if (errors.password || errors.confirm) {
      setErrors((current) => ({
        password: current.password ? passwordProblem(next) : undefined,
        confirm: current.confirm ? confirmProblem(confirm, next) : undefined,
      }));
    }
  }

  function onConfirmChange(next: string) {
    setConfirm(next);
    if (errors.confirm) setErrors((current) => ({ ...current, confirm: confirmProblem(next, password) }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;

    const next = { password: passwordProblem(password), confirm: confirmProblem(confirm, password) };
    setErrors(next);
    setBanner(null);
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }
    if (next.confirm) {
      confirmRef.current?.focus();
      return;
    }

    busyRef.current = true;
    setBusy(true);
    const { error: requestError } = await resetPassword({ newPassword: password, token });
    if (requestError) {
      busyRef.current = false;
      setBusy(false);
      setBanner(describeAuthError(requestError, "We couldn't update your password. Please try again."));
      return;
    }
    // Busy stays on while the sign-in page loads.
    router.replace("/login?reset=1");
  }

  const matches = confirm.length > 0 && confirm === password && !passwordProblem(password);

  return (
    <AuthCard
      title="Choose a new password"
      description="Pick something you haven't used here before. You'll use it to sign in from now on."
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      <AutoHeight>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {banner && <ErrorBanner>{banner}</ErrorBanner>}

          <div className="flex flex-col gap-3">
            <PasswordInput
              tall
              id="reset-password"
              label="New password"
              inputRef={passwordRef}
              value={password}
              onChange={onPasswordChange}
              onBlur={() => blurCheck("password")}
              autoComplete="new-password"
              enterKeyHint="next"
              placeholder="Enter a new password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              error={errors.password}
            />
            <PasswordStrength password={password} />
          </div>

          <PasswordInput
            tall
            id="reset-confirm"
            label="Confirm new password"
            inputRef={confirmRef}
            value={confirm}
            onChange={onConfirmChange}
            onBlur={() => blurCheck("confirm")}
            autoComplete="new-password"
            enterKeyHint="go"
            placeholder="Repeat the new password"
            hint={
              matches ? (
                <span className="inline-flex items-center gap-1.5 text-secondary-foreground">
                  <Icon icon={Tick02Icon} className="text-success" />
                  Passwords match
                </span>
              ) : undefined
            }
            error={errors.confirm}
          />

          <SubmitButton busy={busy} busyLabel="Saving…">
            Update password
          </SubmitButton>
        </form>
      </AutoHeight>
    </AuthCard>
  );
}
