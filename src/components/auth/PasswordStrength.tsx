"use client";

import { MIN_PASSWORD_LENGTH } from "@/components/auth/errors";
import { cn } from "@/lib/utils";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const LABELS = ["", "Weak", "Okay", "Good", "Strong"] as const;

/**
 * Rough, honest guidance (not a security audit): under 8 characters is always Weak. Otherwise points come from
 * length (8+, 12+) and from mixing lower case, upper case, digits and symbols.
 */
export function passwordStrength(password: string): { level: StrengthLevel; label: (typeof LABELS)[number] } {
  if (!password) return { level: 0, label: "" };
  if (password.length < MIN_PASSWORD_LENGTH) return { level: 1, label: "Weak" };

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  let points = 1;
  if (kinds >= 2) points += 1;
  if (kinds >= 3) points += 1;
  if (password.length >= 12) points += 1;

  const level = Math.min(4, points) as StrengthLevel;
  return { level, label: LABELS[level] };
}

const SEGMENT_TONE: Record<StrengthLevel, string> = {
  0: "bg-selected",
  1: "bg-destructive",
  2: "bg-muted-foreground",
  3: "bg-brand",
  4: "bg-success",
};

/** Four segments plus a text label, so the level never depends on colour alone. */
export function PasswordStrength({ password }: { password: string }) {
  const { level, label } = passwordStrength(password);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none",
              segment <= level ? SEGMENT_TONE[level] : "bg-selected",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {label && (
          <>
            Strength: <span className="font-medium text-foreground">{label}</span>
          </>
        )}
      </p>
    </div>
  );
}
