import { listPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/env";
import { getSiteIdentity } from "@/lib/site-identity";
import { postPath, TYPE_LABEL } from "@/lib/urls";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** RSS feed: titles and summaries only (never gated text). */
export async function GET() {
  const base = siteUrl();
  const [items, site] = await Promise.all([listPosts({ limit: 50 }), getSiteIdentity()]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(site.title)}</title>
<link>${base}</link>
<description>${esc(site.tagline)}</description>
<language>en-us</language>
<atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${base}${postPath(p)}</link>
<guid isPermaLink="true">${base}${postPath(p)}</guid>
<category>${esc(TYPE_LABEL[p.type])}</category>
${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
<description>${esc(p.summary || p.subtitle || "")}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
