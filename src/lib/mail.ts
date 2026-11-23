// Server-only: imported from src/lib/auth.ts, never from client components.
import nodemailer from "nodemailer";

interface ResetPasswordEmail {
  to: string;
  url: string;
}

const MINUTES = 60;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(url: string): string {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#efebdf;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141413;">
    <div style="max-width:440px;margin:0 auto;background:#f8f5ec;border:1px solid rgba(31,30,29,0.12);border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;">Reset your Likho password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#3d3d3a;">
        Click the button below to choose a new password. The link works once and expires in ${MINUTES} minutes.
      </p>
      <a href="${safeUrl}" style="display:inline-block;background:#2b2a27;color:#f8f5ec;text-decoration:none;font-size:15px;font-weight:500;padding:11px 20px;border-radius:10px;">Reset password</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:19px;color:#4d4c47;">
        If you didn't ask for this, you can ignore this email. Your password won't change.
      </p>
    </div>
  </body>
</html>`;
}

/**
 * Sends the password-reset email through Gmail SMTP. Set GMAIL_USER and
 * GMAIL_APP_PASSWORD (a Google "app password", not your normal password).
 * Without them, development prints the link to the server console so the
 * flow can be tested with no mail setup. Production without them fails loudly.
 */
export async function sendResetPasswordEmail({ to, url }: ResetPasswordEmail): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required to send password reset emails in production.");
    }
    console.info(`\n[auth] Password reset link for ${to} (no Gmail credentials set, not emailed):\n${url}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Likho <${user}>`,
    to,
    subject: "Reset your Likho password",
    text: `Reset your Likho password: ${url}\n\nThe link works once and expires in ${MINUTES} minutes. If you didn't ask for it, ignore this email.`,
    html: renderHtml(url),
  });
}
