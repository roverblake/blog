import { emailButton, emailShell } from "./layout";

export function confirmEmail(url: string, listNames: string[]) {
  const lists = listNames.join(" and ");
  return {
    subject: "Please confirm your subscription",
    html: emailShell(
      `<p>Thank you for subscribing to ${lists}.</p>
<p>Please confirm your email address by clicking the button below. Until you do, nothing will be sent.</p>
<p style="padding:8px 0;">${emailButton(url, "Confirm subscription")}</p>
<p style="font-size:14px;">If you didn't sign up, ignore this email and you won't hear from us.</p>`,
    ),
    text: `Thank you for subscribing to ${lists}.\n\nConfirm your email address:\n${url}\n\nIf you didn't sign up, ignore this email.`,
  };
}
