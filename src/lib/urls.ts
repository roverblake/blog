import type { posts } from "@/db/schema";

type PostType = (typeof posts.$inferSelect)["type"];

/** URL section for each post type. */
export const TYPE_PATH: Record<PostType, string> = {
  essay: "essays",
  commonplace: "commonplace",
  parish_letter: "letters",
  sermon: "sermons",
};

export const TYPE_LABEL: Record<PostType, string> = {
  essay: "Essay",
  commonplace: "Commonplace",
  parish_letter: "Letter to the Parish",
  sermon: "Sermon",
};

export const TYPE_PLURAL: Record<PostType, string> = {
  essay: "Essays",
  commonplace: "Commonplace",
  parish_letter: "Letters to the Parish",
  sermon: "Sermons",
};

export function postPath(p: { type: PostType; slug: string }): string {
  return `/${TYPE_PATH[p.type]}/${p.slug}`;
}

export function typeFromPath(section: string): PostType | null {
  const entry = Object.entries(TYPE_PATH).find(([, v]) => v === section);
  return entry ? (entry[0] as PostType) : null;
}

/** Allow only http(s), mailto, relative and anchor links. */
export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return null;
}

/** Public URL for a stored image (served through /media). */
export function mediaUrl(storageKey: string): string {
  if (/^(https?:)?\/\//.test(storageKey) || storageKey.startsWith("/")) return storageKey;
  return `/media/${storageKey}`;
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
