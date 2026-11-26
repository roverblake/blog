import { emailButton, emailShell } from "./layout";

export function signInEmail(url: string) {
  return {
    subject: "Your sign-in link for Blake Johnson",
    html: emailShell(
      `<p>Click the button below to sign in. The link works once and expires in 15 minutes.</p>
<p style="padding:8px 0;">${emailButton(url, "Sign in")}</p>
<p style="font-size:14px;">If you didn't ask to sign in, you can ignore this email.</p>`,
    ),
    text: `Sign in to Blake Johnson:\n${url}\n\nThe link works once and expires in 15 minutes. If you didn't ask to sign in, ignore this email.`,
  };
}
