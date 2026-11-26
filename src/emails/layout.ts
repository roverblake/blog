import { escapeHtml } from "@/lib/email";

/**
 * Shared email shell: serif, black on white, one navy button.
 * TODO(design-spec): replace these placeholder values with the exact navy,
 * ink and font stack from docs/design-spec.md.
 */
export const EMAIL_STYLE = {
  ink: "#000000",
  paper: "#ffffff",
  navy: "#000080",
  font: "Georgia, 'Times New Roman', serif",
};

export function emailButton(href: string, label: string): string {
  const s = EMAIL_STYLE;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${s.navy};color:#ffffff;font-family:${s.font};font-size:16px;text-decoration:none;padding:12px 24px;">${escapeHtml(label)}</a>`;
}

export function emailShell(bodyHtml: string, footerHtml = ""): string {
  const s = EMAIL_STYLE;
  return `<!doctype html><html><body style="margin:0;background:${s.paper};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" style="max-width:600px;font-family:${s.font};color:${s.ink};font-size:17px;line-height:1.6;">
<tr><td style="text-align:center;font-size:24px;padding-bottom:24px;border-bottom:1px solid ${s.ink};">Blake Johnson</td></tr>
<tr><td style="padding:24px 0;">${bodyHtml}</td></tr>
${footerHtml ? `<tr><td style="border-top:1px solid ${s.ink};padding-top:16px;font-size:13px;">${footerHtml}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}
