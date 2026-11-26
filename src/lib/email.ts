import { Resend } from "resend";

/**
 * Sends one email through Resend.
 * Without RESEND_API_KEY (local development), the email is printed to the
 * terminal instead, so sign-in links still work on your own computer.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Blake Johnson <onboarding@resend.dev>";
  if (!key) {
    console.log(`\n[email] To: ${opts.to}\n[email] Subject: ${opts.subject}\n${opts.text}\n`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from, ...opts });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
