"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { and, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { asDoc } from "@/lib/content/types";
import { siteUrl } from "@/lib/env";
import { parseLinkMeta } from "@/lib/link-meta";
import { requireAdmin } from "@/lib/session";
import { getSiteIdentity } from "@/lib/site-identity";
import { postPath, TYPE_LABEL } from "@/lib/urls";

const { posts } = schema;

export type LinkPreview = { href: string; title: string; site: string; author: string };

/** True for loopback, private, link-local and other non-public addresses. */
function isPrivateAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
}

async function assertPublicHost(u: URL) {
  if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
  const addrs = isIP(u.hostname) ? [{ address: u.hostname }] : await lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("private address");
}

/** Reads a page once, on the server, to fill in a link preview. Readers' browsers never contact it. */
async function fetchExternal(raw: string): Promise<LinkPreview> {
  let url = new URL(raw);
  const host = url.hostname.replace(/^www\./, "");
  const fallback = { href: url.toString(), title: host, site: host, author: "" };
  try {
    for (let hop = 0; hop < 4; hop++) {
      await assertPublicHost(url);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)", accept: "text/html" },
      }).finally(() => clearTimeout(timer));
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return fallback;
      // Read at most ~600 KB; the tags we need are near the top.
      const reader = res.body?.getReader();
      let html = "";
      const dec = new TextDecoder();
      while (reader && html.length < 600_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      reader?.cancel().catch(() => {});
      return { href: raw, ...parseLinkMeta(html, url.toString()) };
    }
  } catch {
    /* fall through */
  }
  return fallback;
}

/** Fill in a link preview for a pasted address (a page on this site or anywhere on the web). */
export async function getLinkPreview(raw: string): Promise<LinkPreview | { error: string }> {
  await requireAdmin();
  const v = raw.trim();
  let url: URL;
  try {
    url = new URL(v, siteUrl());
  } catch {
    return { error: "That doesn't look like a link." };
  }
  if (!/^https?:$/.test(url.protocol)) return { error: "Please paste a full link starting with https://" };
  const own = new URL(siteUrl()).host;
  if (v.startsWith("/") || url.host === own) {
    const slug = url.pathname.split("/").filter(Boolean).pop() ?? "";
    const rows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
    const p = rows[0];
    if (p) return { href: postPath(p), title: p.title, site: TYPE_LABEL[p.type], author: "" };
    const site = await getSiteIdentity();
    return { href: url.pathname, title: site.title, site: site.title, author: "" };
  }
  return fetchExternal(url.toString());
}

export type PickItem = { id: string; type: string; label: string; title: string; href: string; date: string | null };

/** Recent posts and notes for "Insert from my site". */
export async function listInsertable(q: string): Promise<PickItem[]> {
  await requireAdmin();
  const term = q.trim().slice(0, 80);
  const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select({ id: posts.id, type: posts.type, title: posts.title, slug: posts.slug, publishedAt: posts.publishedAt })
    .from(posts)
    .where(and(eq(posts.status, "published"), ne(posts.type, "sermon"), term ? or(ilike(posts.title, like), ilike(posts.contentText, like)) : undefined))
    .orderBy(desc(posts.publishedAt))
    .limit(20);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    label: TYPE_LABEL[r.type],
    title: r.title,
    href: postPath(r),
    date: r.publishedAt ? r.publishedAt.toISOString() : null,
  }));
}

/** A note's content, to copy into the post being written. */
export async function getNoteBlocks(id: string) {
  await requireAdmin();
  const rows = await db.select({ content: posts.content }).from(posts).where(eq(posts.id, id)).limit(1);
  const blocks = asDoc(rows[0]?.content ?? null).content ?? [];
  return JSON.parse(JSON.stringify(blocks.filter((b) => b.type !== "paywall")));
}
