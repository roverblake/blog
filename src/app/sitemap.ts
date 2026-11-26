import type { MetadataRoute } from "next";
import { listAllTags, listPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/env";
import { postPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [items, tags] = await Promise.all([listPosts({ limit: 5000 }), listAllTags()]);
  const pages = ["", "/essays", "/commonplace", "/letters", "/archive", "/about", "/subscribe", "/privacy"].map((p) => ({
    url: `${base}${p}`,
  }));
  return [
    ...pages,
    ...items.map((p) => ({ url: `${base}${postPath(p)}`, lastModified: p.publishedAt ?? undefined })),
    ...tags.map((t) => ({ url: `${base}/tags/${t.slug}` })),
  ];
}
