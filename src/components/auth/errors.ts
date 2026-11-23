interface AuthError {
  status?: number;
  code?: string;
  message?: string;
}

export const MIN_PASSWORD_LENGTH = 8;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turns a Better Auth client error into a short message that is safe to show. */
export function describeAuthError(error: AuthError, fallback: string): string {
  const code = (error.code ?? "").toUpperCase();

  if (error.status === 429) return "Too many tries. Wait a minute and try again.";
  if (error.status === 503) return "Sign-in isn't set up on this server yet.";
  if (code.includes("INVALID_EMAIL_OR_PASSWORD")) return "Wrong email or password.";
  if (code.includes("ALREADY_EXISTS")) return "An account with this email already exists. Try signing in.";
  if (code.includes("PASSWORD_TOO_SHORT")) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (code.includes("PASSWORD_TOO_LONG")) return "That password is too long.";
  if (code.includes("INVALID_PASSWORD")) return "That password isn't correct.";
  if (code.includes("INVALID_TOKEN")) return "This reset link is invalid or has expired. Request a new one.";
  return fallback;
}
