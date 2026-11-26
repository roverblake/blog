import { citeParts } from "@/lib/content/cite";
import { isValidVideo, videoThumbUrl, videoWatchUrl } from "@/lib/embeds";
import { escapeHtml as e } from "@/lib/email";
import type { BlockNode, Doc, InlineNode } from "@/lib/content/types";
import { safeHref } from "@/lib/urls";
import { EMAIL_STYLE as S, emailButton, emailShell } from "./layout";

/**
 * Renders a post as a simple newsletter email: serif, black on white, one
 * navy button, styled to match the site. Inline styles only (email clients).
 */

const P = `margin:0 0 18px;font-size:18px;line-height:1.65;color:${S.body};`;

function abs(href: string, base: string) {
  return href.startsWith("/") ? base + href : href;
}

function inline(nodes: InlineNode[] | undefined, notes: string[], base: string): string {
  return (nodes ?? [])
    .map((n) => {
      if (!n || typeof n !== "object") return "";
      if (n.type === "hardBreak") return "<br>";
      if (n.type === "footnote") {
        const t = n.attrs?.text?.trim();
        if (!t) return "";
        notes.push(t);
        return `<sup style="font-size:12px;">${notes.length}</sup>`;
      }
      if (n.type !== "text") return "";
      let html = e(n.text);
      for (const m of n.marks ?? []) {
        if (m.type === "bold") html = `<strong>${html}</strong>`;
        else if (m.type === "italic") html = `<em>${html}</em>`;
        else if (m.type === "strike") html = `<s>${html}</s>`;
        else if (m.type === "underline") html = `<u>${html}</u>`;
        else if (m.type === "code") html = `<code style="font-family:Menlo,Consolas,monospace;font-size:0.88em;">${html}</code>`;
        else if (m.type === "link") {
          const href = safeHref(m.attrs.href);
          if (href) html = `<a href="${e(abs(href, base))}" style="color:${S.ink};text-decoration:underline;">${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}

function block(b: BlockNode, notes: string[], base: string): string {
  switch (b.type) {
    case "paragraph":
      return `<p style="${P}">${inline(b.content, notes, base)}</p>`;
    case "heading":
      return `<h2 style="margin:28px 0 12px;font-size:14px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:${S.ink};">${inline(b.content, notes, base)}</h2>`;
    case "blockquote":
      return `<div style="margin:8px 0 22px;"><div style="font-style:italic;font-size:20px;line-height:1.45;color:${S.ink};">${(b.content ?? [])
        .map((c) => (c.type === "paragraph" ? `<p style="margin:0 0 10px;">${inline(c.content, notes, base)}</p>` : block(c, notes, base)))
        .join("")}</div>${b.attrs?.cite ? `<div style="font-size:15px;color:${S.slate};">${citeHtml(b.attrs.cite)}</div>` : ""}</div>`;
    case "pullQuote":
      return `<div style="margin:12px 0 24px;padding:18px 0;border-top:1px solid ${S.ink};border-bottom:1px solid ${S.ink};text-align:center;font-style:italic;font-size:22px;line-height:1.45;color:${S.ink};">${(b.content ?? [])
        .map((c) => `<p style="margin:0;">${inline(c.content, notes, base)}</p>`)
        .join("")}${b.attrs?.cite ? `<div style="margin-top:8px;font-style:normal;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${S.slate};">${citeHtml(b.attrs.cite)}</div>` : ""}</div>`;
    case "bulletList":
    case "orderedList": {
      const tag = b.type === "bulletList" ? "ul" : "ol";
      return `<${tag} style="margin:0 0 18px;padding-left:24px;font-size:18px;line-height:1.65;color:${S.body};">${(b.content ?? [])
        .map(
          (li) =>
            `<li style="margin:0 0 6px;">${(li.type === "listItem" ? (li.content ?? []) : [])
              .map((c) => (c.type === "paragraph" ? inline(c.content, notes, base) : block(c, notes, base)))
              .join("")}</li>`,
        )
        .join("")}</${tag}>`;
    }
    case "video": {
      const { provider, id, caption } = b.attrs ?? ({} as { provider?: string; id?: string; caption?: string | null });
      if (!isValidVideo(provider, id)) return "";
      const thumb = videoThumbUrl(provider, id);
      const link = e(videoWatchUrl(provider, id));
      const img = thumb ? `<img src="${e(abs(thumb, base))}" alt="Watch the video" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;">` : `<span style="display:block;padding:40px 0;background:${S.ink};color:#fff;text-align:center;">Watch the video</span>`;
      return `<div style="margin:8px 0 22px;"><a href="${link}">${img}</a><div style="padding-top:6px;font-size:14px;font-style:italic;color:${S.slate};">${caption ? e(caption) + " · " : ""}<a href="${link}" style="color:${S.slate};">Watch on ${provider === "youtube" ? "YouTube" : "Vimeo"}</a></div></div>`;
    }
    case "linkCard": {
      const { href, title, site, author } = b.attrs ?? ({} as { href?: string; title?: string | null; site?: string | null; author?: string | null });
      const h = safeHref(href);
      if (!h) return "";
      const url = abs(h, base);
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
      const internal = h.startsWith("/");
      return `<a href="${e(url)}" style="display:block;margin:6px 24px 24px;padding:14px 4px;border-top:1px solid ${S.ink};border-bottom:1px solid ${S.ink};text-decoration:none;color:${S.ink};">${site ? `<span style="display:block;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${S.slate};">${e(site)}</span>` : ""}<span style="display:block;font-size:20px;line-height:1.25;margin-top:4px;">${e(title || host || h)}</span><span style="display:block;font-size:15px;font-style:italic;color:${S.slate};margin-top:2px;">${author ? `by ${e(author)} · ` : ""}${internal ? "Read &rarr;" : `Read at ${e(host)} &rarr;`}</span></a>`;
    }
    case "audio": {
      const { src, title } = b.attrs ?? ({} as { src?: string; title?: string | null });
      if (!src) return "";
      return `<div style="margin:8px 0 22px;padding:12px 0;border-top:1px solid #ddd8cf;border-bottom:1px solid #ddd8cf;"><a href="${e(abs(src, base))}" style="color:${S.ink};">&#9654; Listen${title ? `: ${e(title)}` : ""}</a></div>`;
    }
    case "horizontalRule":
      return `<p style="margin:8px 0 22px;text-align:center;letter-spacing:0.6em;color:#9aa0a8;">· · ·</p>`;
    case "image": {
      const src = safeHref(b.attrs?.src);
      if (!src) return "";
      const cap = [b.attrs.caption, b.attrs.credit].filter(Boolean).map((x) => e(x!)).join(" · ");
      return `<div style="margin:8px 0 22px;"><img src="${e(abs(src, base))}" alt="${e(b.attrs.alt ?? "")}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;">${cap ? `<div style="padding-top:6px;font-size:14px;font-style:italic;color:${S.slate};">${cap}</div>` : ""}</div>`;
    }
    default:
      return "";
  }
}

export function postEmail(opts: {
  base: string;
  url: string;
  kicker: string;
  title: string;
  subtitle: string | null;
  dateLabel: string;
  headerImage: string | null;
  headerCaption: string | null;
  doc: Doc;
  mailingAddress: string;
  listName: string;
  unsubscribeListUrl: string;
  unsubscribeAllUrl: string;
}) {
  const notes: string[] = [];
  const body = (opts.doc.content ?? []).filter((b) => b.type !== "paywall").map((b) => block(b, notes, opts.base)).join("");
  const header = `
<div style="text-align:center;padding-bottom:20px;">
  <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:${S.slate};">${e(opts.kicker)}</div>
  <h1 style="margin:12px 0 10px;font-weight:400;font-size:34px;line-height:1.1;color:${S.ink};"><a href="${e(opts.url)}" style="color:${S.ink};text-decoration:none;">${e(opts.title)}</a></h1>
  ${opts.subtitle ? `<div style="font-size:20px;line-height:1.4;font-style:italic;color:#3d3a35;">${e(opts.subtitle)}</div>` : ""}
  <div style="margin-top:12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${S.slate};">By Blake Johnson · ${e(opts.dateLabel)}</div>
</div>
${opts.headerImage ? `<div style="margin-bottom:24px;"><img src="${e(opts.headerImage)}" alt="" width="600" style="display:block;width:100%;height:auto;border:0;">${opts.headerCaption ? `<div style="padding-top:6px;font-size:14px;font-style:italic;color:${S.slate};">${e(opts.headerCaption)}</div>` : ""}</div>` : ""}`;
  const footnotes = notes.length
    ? `<div style="margin-top:12px;border-top:1px solid ${S.ink};padding-top:10px;font-size:15px;line-height:1.5;color:${S.body};"><div style="font-size:12px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;margin-bottom:6px;">Notes</div><ol style="margin:0;padding-left:20px;">${notes.map((n) => `<li>${e(n)}</li>`).join("")}</ol></div>`
    : "";
  const button = `<p style="margin:24px 0 8px;text-align:center;">${emailButton(opts.url, "Read on the website")}</p>`;
  const footer = `
<p style="margin:0 0 8px;">Blake Johnson${opts.mailingAddress ? `<br>${e(opts.mailingAddress).replace(/\n/g, "<br>")}` : ""}</p>
<p style="margin:0 0 8px;">You're receiving this because you subscribed to ${e(opts.listName)}.</p>
<p style="margin:0;"><a href="${e(opts.unsubscribeListUrl)}" style="color:${S.slate};">Unsubscribe from ${e(opts.listName)}</a> · <a href="${e(opts.unsubscribeAllUrl)}" style="color:${S.slate};">Unsubscribe from everything</a></p>`;

  const textBody = [
    opts.title,
    opts.subtitle ?? "",
    "",
    `Read on the website: ${opts.url}`,
    "",
    "—",
    `Blake Johnson${opts.mailingAddress ? "\n" + opts.mailingAddress : ""}`,
    `Unsubscribe from ${opts.listName}: ${opts.unsubscribeListUrl}`,
    `Unsubscribe from everything: ${opts.unsubscribeAllUrl}`,
  ].join("\n");

  return { html: emailShell(header + body + footnotes + button, footer), text: textBody };
}

/** Source line with book titles in italics. */
function citeHtml(s: string) {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return citeParts(s).map((p) => (p.italic ? `<em>${esc(p.text)}</em>` : esc(p.text))).join("");
}
