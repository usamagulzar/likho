"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { useId, useState, type ReactNode, type Ref } from "react";
import { authInputClass } from "@/components/auth/AuthCard";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Kept for the change-password dialog. Pages should focus with a ref instead (touch screens must not pop the keyboard). */
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onBlur?: () => void;
  enterKeyHint?: "next" | "done" | "go" | "send";
  placeholder?: string;
  hint?: ReactNode;
  /** Inline validation message. Replaces the hint while it is shown. */
  error?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Rendered on the right of the label, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
  /** 48px input for the account screens. The default stays 40px for the dialog. */
  tall?: boolean;
}

export function PasswordInput({
  id: providedId,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
  inputRef,
  onBlur,
  enterKeyHint,
  placeholder,
  hint,
  error,
  invalid,
  describedBy,
  labelAside,
  tall = false,
}: PasswordInputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);

  const describedIds = [error ? errorId : hint ? hintId : null, describedBy ?? null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          name={autoComplete === "new-password" ? "new-password" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          enterKeyHint={enterKeyHint}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={invalid || error ? true : undefined}
          aria-describedby={describedIds || undefined}
          className={cn(authInputClass, tall ? "h-12 pr-12" : "h-10 pr-10")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label="Show password"
          aria-pressed={visible}
          className={cn(
            "absolute top-0 right-0 flex h-full items-center justify-center rounded-r-[12px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35",
            tall ? "w-12" : "w-10",
          )}
        >
          <Icon icon={visible ? ViewOffIcon : ViewIcon} />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
