"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { AutoHeight } from "@/components/auth/AutoHeight";
import { ModeSwitch, type AuthMode } from "@/components/auth/ModeSwitch";
import { NoticeBanner, ErrorBanner } from "@/components/auth/Notices";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TextField } from "@/components/auth/TextField";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, describeAuthError } from "@/components/auth/errors";
import { signIn, signUp } from "@/lib/auth-client";

type Field = "name" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const FIELD_ORDER: Field[] = ["name", "email", "password"];

function validate(field: Field, value: string, mode: AuthMode): string | undefined {
  if (field === "email") {
    const address = value.trim();
    if (!address) return "Enter your email address.";
    if (!EMAIL_PATTERN.test(address)) return "Enter an email address like name@example.com.";
  }
  if (field === "password") {
    if (!value) return mode === "signup" ? "Choose a password." : "Enter your password.";
    if (mode === "signup" && value.length < MIN_PASSWORD_LENGTH) {
      return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
  }
  return undefined;
}

export function LoginForm({ notice, initialMode }: { notice?: string; initialMode: AuthMode }) {
  const router = useRouter();
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "signup";
  const bannerId = `${formId}-banner`;

  // Focus the email field on desktop only. On touch screens focusing would open the keyboard and shift the layout.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) emailRef.current?.focus();
  }, []);

  function valueOf(field: Field): string {
    if (field === "name") return name;
    if (field === "email") return email;
    return password;
  }

  function refOf(field: Field) {
    if (field === "name") return nameRef;
    if (field === "email") return emailRef;
    return passwordRef;
  }

  // Validate on blur, but do not shout about an empty field the user only tabbed through.
  function blurCheck(field: Field) {
    const value = valueOf(field);
    if (!value && !errors[field]) return;
    setErrors((current) => ({ ...current, [field]: validate(field, value, mode) }));
  }

  // Once a field has an error, keep its message in step with what is typed so it clears as soon as it is fixed.
  function revalidateIfShown(field: Field, nextValue: string) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validate(field, nextValue, mode) }));
  }

  function switchMode(next: AuthMode) {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setBanner(null);
    // Keep the URL in step so the view can be shared or reloaded. replaceState keeps Next's router state.
    const url = new URL(window.location.href);
    url.searchParams.set("mode", next);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;

    const next: FieldErrors = {};
    const fields: Field[] = isSignUp ? FIELD_ORDER : ["email", "password"];
    for (const field of fields) {
      const message = validate(field, valueOf(field), mode);
      if (message) next[field] = message;
    }
    setErrors(next);
    setBanner(null);

    const firstInvalid = fields.find((field) => next[field]);
    if (firstInvalid) {
      refOf(firstInvalid).current?.focus();
      return;
    }

    busyRef.current = true;
    setBusy(true);
    const address = email.trim();
    const { error: requestError } = isSignUp
      ? await signUp.email({ name: name.trim() || address.split("@")[0], email: address, password })
      : await signIn.email({ email: address, password });

    if (requestError) {
      busyRef.current = false;
      setBusy(false);
      setBanner(
        describeAuthError(
          requestError,
          isSignUp ? "We couldn't create your account. Please try again." : "We couldn't sign you in. Please try again.",
        ),
      );
      // Put the cursor where the fix is: the email for a taken address, otherwise the password.
      const code = (requestError.code ?? "").toUpperCase();
      (code.includes("ALREADY_EXISTS") ? emailRef : passwordRef).current?.focus();
      return;
    }

    // Busy stays on while the dashboard loads, so the button cannot be pressed twice.
    router.replace("/dashboard");
    router.refresh();
  }

  const copy = isSignUp
    ? {
        title: "Create your account",
        description:
          "Save notes to your account and open them on any device. Your browser notes come with you.",
      }
    : {
        title: "Welcome back",
        description: "Sign in to pick up where you left off.",
      };

  return (
    <AuthCard title={copy.title} description={copy.description}>
      {notice && <NoticeBanner>{notice}</NoticeBanner>}

      <ModeSwitch value={mode} onChange={switchMode} />

      <div className="mt-6">
        <AutoHeight>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            {banner && <ErrorBanner id={bannerId}>{banner}</ErrorBanner>}

            {isSignUp && (
              <TextField
                ref={nameRef}
                label="Name"
                labelAside={<span className="text-sm text-muted-foreground">Optional</span>}
                name="name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                placeholder="Your name"
                value={name}
                error={errors.name}
                onChange={(event) => {
                  setName(event.target.value);
                  revalidateIfShown("name", event.target.value);
                }}
              />
            )}

            <TextField
              ref={emailRef}
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete={isSignUp ? "email" : "username"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="you@example.com"
              value={email}
              error={errors.email}
              onBlur={() => blurCheck("email")}
              onChange={(event) => {
                setEmail(event.target.value);
                revalidateIfShown("email", event.target.value);
              }}
            />

            <div className="flex flex-col gap-3">
              <PasswordInput
                tall
                label="Password"
                inputRef={passwordRef}
                value={password}
                onChange={(next) => {
                  setPassword(next);
                  revalidateIfShown("password", next);
                }}
                onBlur={() => blurCheck("password")}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                enterKeyHint="go"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                hint={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
                error={errors.password}
                labelAside={
                  !isSignUp && (
                    <Link href="/forgot-password" className={`${authLinkClass} text-sm text-muted-foreground hover:text-foreground`}>
                      Forgot password?
                    </Link>
                  )
                }
              />
              {isSignUp && <PasswordStrength password={password} />}
            </div>

            <SubmitButton busy={busy} busyLabel={isSignUp ? "Creating account…" : "Signing in…"}>
              {isSignUp ? "Create account" : "Sign in"}
            </SubmitButton>
          </form>
        </AutoHeight>
      </div>
    </AuthCard>
  );
}
