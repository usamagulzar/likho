"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { authInputClass } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  /** Inline validation message. Replaces the hint while it is shown. */
  error?: string;
  hint?: ReactNode;
  labelAside?: ReactNode;
}

/** A labelled 48px text input with a visible label, an optional hint and an inline error. */
export function TextField({ label, error, hint, labelAside, id: providedId, className, ...input }: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : hint ? hintId : null, input["aria-describedby"] ?? null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(authInputClass, "h-12", className)}
      />
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
