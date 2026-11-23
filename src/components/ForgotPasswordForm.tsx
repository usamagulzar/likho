"use client";

import { ArrowLeft01Icon, MailOpen01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { AutoHeight } from "@/components/auth/AutoHeight";
import { EMAIL_PATTERN, describeAuthError } from "@/components/auth/errors";
import { ErrorBanner } from "@/components/auth/Notices";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TextField } from "@/components/auth/TextField";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth-client";

const RESEND_SECONDS = 30;

const EMAIL_ERROR = "Enter an email address like name@example.com.";
const EMAIL_REQUIRED = "Enter the email address you use for Likho.";

function emailProblem(value: string): string | undefined {
  const address = value.trim();
  if (!address) return EMAIL_REQUIRED;
  if (!EMAIL_PATTERN.test(address)) return EMAIL_ERROR;
  return undefined;
}

export function ForgotPasswordForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const busyRef = useRef(false);

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resentNotice, setResentNotice] = useState("");

  // Focus the email field on desktop only, so touch screens do not pop the keyboard.
  useEffect(() => {
    if (!sentTo && window.matchMedia("(pointer: fine)").matches) emailRef.current?.focus();
  }, [sentTo]);

  // Count the resend cooldown down once a second. The timer is cleared on unmount.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendLink(address: string): Promise<string | null> {
    const { error: requestError } = await requestPasswordReset({ email: address, redirectTo: "/reset-password" });
    if (requestError) {
      return describeAuthError(requestError, "We couldn't send the email. Please try again in a moment.");
    }
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;

    const problem = emailProblem(email);
    setFieldError(problem);
    setBanner(null);
    if (problem) {
      emailRef.current?.focus();
      return;
    }

    busyRef.current = true;
    setBusy(true);
    const address = email.trim();
    const failure = await sendLink(address);
    busyRef.current = false;
    setBusy(false);

    if (failure) {
      setBanner(failure);
      emailRef.current?.focus();
      return;
    }
    setSentTo(address);
    setCooldown(RESEND_SECONDS);
    // Move focus to the new view's heading so screen readers announce the change.
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  async function resend() {
    if (!sentTo || busyRef.current || cooldown > 0) return;
    busyRef.current = true;
    setBusy(true);
    setBanner(null);
    const failure = await sendLink(sentTo);
    busyRef.current = false;
    setBusy(false);
    if (failure) {
      setBanner(failure);
      return;
    }
    setCooldown(RESEND_SECONDS);
    setResentNotice("Sent again. Check your inbox and spam folder.");
  }

  function useDifferentEmail() {
    setSentTo(null);
    setEmail(sentTo ?? "");
    setBanner(null);
    setFieldError(undefined);
    setResentNotice("");
    setCooldown(0);
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  const backToSignIn = (
    <Link href="/login" className={`${authLinkClass} inline-flex min-h-11 items-center gap-1.5 text-secondary-foreground`}>
      <Icon icon={ArrowLeft01Icon} />
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthCard
        key="sent"
        title="Check your email"
        titleRef={titleRef}
        description={
          <>
            If an account exists for <span className="font-medium text-foreground break-all">{sentTo}</span>, we sent a link
            to choose a new password. It works once and expires in an hour.
          </>
        }
        footer={backToSignIn}
      >
        <div className="flex flex-col gap-5">
          <span className="flex size-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand">
            <Icon icon={MailOpen01Icon} />
          </span>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-secondary-foreground">
              Didn&apos;t get it? Check your spam folder, or ask for another link.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={busy || cooldown > 0}
              aria-busy={busy || undefined}
              onClick={resend}
              className="h-12 w-full rounded-[12px] border-border bg-background text-base font-medium hover:bg-hover disabled:opacity-100 disabled:text-muted-foreground"
            >
              {busy ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
            </Button>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {resentNotice}
            </p>
            {banner && <ErrorBanner>{banner}</ErrorBanner>}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={useDifferentEmail}
            className="h-12 w-full rounded-[12px] text-base font-medium text-secondary-foreground"
          >
            Use a different email
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      key="idle"
      title="Reset your password"
      description="Enter the email you use for Likho and we'll send you a link to choose a new password."
      footer={backToSignIn}
    >
      <AutoHeight>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {banner && <ErrorBanner>{banner}</ErrorBanner>}
          <TextField
            ref={emailRef}
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            placeholder="you@example.com"
            value={email}
            error={fieldError}
            onBlur={() => {
              if (email.trim() || fieldError) setFieldError(emailProblem(email));
            }}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldError) setFieldError(emailProblem(event.target.value));
            }}
          />
          <SubmitButton busy={busy} busyLabel="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      </AutoHeight>
    </AuthCard>
  );
}
