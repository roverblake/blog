/** Pull a page's title, publication and author out of its HTML (Open Graph and common meta tags). */
export function parseLinkMeta(html: string, url: string): { title: string; site: string; author: string } {
  const head = html.slice(0, 300_000);
  const decode = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/\s+/g, " ")
      .trim();
  const metas: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (key && content && !(key in metas)) metas[key] = decode(content);
  }
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }
  const authorRaw = metas["author"] || metas["article:author"] || metas["parsely-author"] || metas["sailthru.author"] || metas["twitter:creator"] || "";
  const author = /^https?:\/\//.test(authorRaw) || authorRaw.startsWith("@") ? "" : authorRaw;
  return {
    title: (metas["og:title"] || metas["twitter:title"] || (titleTag ? decode(titleTag) : "") || host).slice(0, 300),
    site: (metas["og:site_name"] || metas["application-name"] || host).slice(0, 120),
    author: author.slice(0, 120),
  };
}
