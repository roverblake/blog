import "server-only";
import { and, desc, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { asDoc } from "@/lib/content/types";
import { gateDoc } from "@/lib/content/gate";
import { countWords, firstParagraphText, firstQuote, readingMinutes } from "@/lib/content/text";
import { mediaUrl } from "@/lib/urls";

const { posts, tags, postTags, media } = schema;
export type PostType = (typeof posts.$inferSelect)["type"];

/** Columns safe to load for lists (no full content). */
const listColumns = {
  id: posts.id,
  type: posts.type,
  visibility: posts.visibility,
  title: posts.title,
  subtitle: posts.subtitle,
  kicker: posts.kicker,
  slug: posts.slug,
  summary: posts.summary,
  wordCount: posts.wordCount,
  publishedAt: posts.publishedAt,
  headerImageId: posts.headerImageId,
};

const isLive = () => eq(posts.status, "published");

export type PostListItem = Awaited<ReturnType<typeof listPosts>>[number];

export async function listPosts(opts: {
  type?: PostType | PostType[];
  tagSlug?: string;
  /** Words to look for in titles, subtitles and summaries (and the text of free posts). */
  search?: string;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
} = {}) {
  const where: SQL[] = [isLive()];
  if (opts.type) where.push(Array.isArray(opts.type) ? inArray(posts.type, opts.type) : eq(posts.type, opts.type));
  if (opts.excludeIds?.length) for (const id of opts.excludeIds) where.push(ne(posts.id, id));
  if (opts.tagSlug) {
    where.push(
      sql`exists (select 1 from ${postTags} join ${tags} on ${tags.id} = ${postTags.tagId}
          where ${postTags.postId} = ${posts.id} and ${tags.slug} = ${opts.tagSlug})`,
    );
  }
  const q = opts.search?.trim().slice(0, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    // Subscriber-only text is never searched, so a search can't reveal it.
    where.push(
      sql`(${posts.title} ilike ${like} or coalesce(${posts.subtitle}, '') ilike ${like} or coalesce(${posts.summary}, '') ilike ${like}
          or (${posts.visibility} = 'everyone' and ${posts.contentText} ilike ${like}))`,
    );
  }
  return db
    .select(listColumns)
    .from(posts)
    .where(and(...where))
    .orderBy(desc(posts.publishedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

/** Longest quotation (in words) shown in full in a list row. */
const SHORT_QUOTE_WORDS = 45;
/** Words kept when a longer quotation is shortened in a list row. */
const CUT_QUOTE_WORDS = 30;

/**
 * For commonplace posts in a list, attach the quotation and its source when the
 * quotation is short enough to show in full (longer ones are shortened with an ellipsis).
 * Only the free part is read.
 */
export async function withShortQuotes<T extends PostListItem>(items: T[]): Promise<(T & { quote?: string; cite?: string | null })[]> {
  const ids = items.filter((p) => p.type === "commonplace").map((p) => p.id);
  if (!ids.length) return items;
  const rows = await db.select({ id: posts.id, content: posts.content, visibility: posts.visibility }).from(posts).where(inArray(posts.id, ids));
  const found = new Map<string, { quote: string; cite: string | null }>();
  for (const r of rows) {
    const { doc } = gateDoc(asDoc(r.content), { gated: r.visibility === "subscribers", hasAccess: false });
    const q = firstQuote(doc);
    if (!q?.text) continue;
    // A long quotation is cut at a word boundary and ends with an ellipsis, as in print.
    const quote =
      countWords(q.text) <= SHORT_QUOTE_WORDS
        ? q.text
        : `${q.text.replace(/\s+/g, " ").split(" ").slice(0, CUT_QUOTE_WORDS).join(" ").replace(/[\s,;:.!?—–-]+$/, "")}…`;
    found.set(r.id, { quote, cite: q.cite });
  }
  return items.map((p) => ({ ...p, ...found.get(p.id) }));
}

/** A small square thumbnail for each post that has a header image. */
export async function withThumbs<T extends PostListItem>(items: T[]): Promise<(T & { thumb?: string })[]> {
  const ids = [...new Set(items.map((p) => p.headerImageId).filter((x): x is string => !!x))];
  if (!ids.length) return items;
  const rows = await db.select({ id: media.id, storageKey: media.storageKey, variants: media.variants }).from(media).where(inArray(media.id, ids));
  const src = new Map<string, string>();
  for (const m of rows) {
    const vs = [...(m.variants ?? [])].sort((a, b) => a.width - b.width);
    const v = vs.find((x) => x.width >= 200) ?? vs.at(-1);
    src.set(m.id, mediaUrl(v?.storageKey ?? m.storageKey));
  }
  return items.map((p) => (p.headerImageId && src.has(p.headerImageId) ? { ...p, thumb: src.get(p.headerImageId) } : p));
}

export async function getImage(id: string | null) {
  if (!id) return null;
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  const m = rows[0];
  if (!m) return null;
  const variants = [...m.variants].sort((a, b) => a.width - b.width);
  return {
    src: mediaUrl(variants.at(-1)?.storageKey ?? m.storageKey),
    srcSet: variants.length ? variants.map((v) => `${mediaUrl(v.storageKey)} ${v.width}w`).join(", ") : undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    alt: m.alt ?? "",
  };
}
export type Image = NonNullable<Awaited<ReturnType<typeof getImage>>>;

export async function getPostTags(postId: string) {
  return db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, postId))
    .orderBy(tags.name);
}

/** A published post by type and slug, with everything the post page needs. */
export async function getPublishedPost(slug: string) {
  const rows = await db.select().from(posts).where(and(eq(posts.slug, slug), isLive())).limit(1);
  return rows[0] ?? null;
}

export async function getPostById(id: string) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Homepage lead story: the most recent published essay (or any post if none). */
export async function getLeadPost() {
  const essay = await db.select().from(posts).where(and(isLive(), eq(posts.type, "essay")))
    .orderBy(desc(posts.publishedAt)).limit(1);
  if (essay[0]) return essay[0];
  const any = await db.select().from(posts).where(isLive()).orderBy(desc(posts.publishedAt)).limit(1);
  return any[0] ?? null;
}

/** Quotes for "From the Commonplace Book": the first quote in recent notes. */
export async function getCommonplaceQuotes(limit = 2) {
  const rows = await db
    .select({ id: posts.id, type: posts.type, slug: posts.slug, title: posts.title, summary: posts.summary, visibility: posts.visibility, content: posts.content })
    .from(posts)
    .where(and(isLive(), eq(posts.type, "commonplace")))
    .orderBy(desc(posts.publishedAt))
    .limit(limit * 3);
  return rows
    .map(({ content, visibility, ...r }) => {
      // Only look at the free part of the note, never past a paywall line.
      const { doc } = gateDoc(asDoc(content), { gated: visibility === "subscribers", hasAccess: false });
      const q = firstQuote(doc);
      const text = q?.text || r.summary || firstParagraphText(doc);
      return text ? { ...r, quote: text, cite: q?.cite ?? null } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, limit);
}

/** "More to read": recent posts other than this one. */
export async function getMoreToRead(excludeId: string, limit = 3) {
  return listPosts({ excludeIds: [excludeId], limit });
}

export async function listAllTags() {
  return db
    .select({ name: tags.name, slug: tags.slug, count: sql<number>`count(${posts.id})::int` })
    .from(tags)
    .innerJoin(postTags, eq(postTags.tagId, tags.id))
    .innerJoin(posts, and(eq(posts.id, postTags.postId), isLive()))
    .groupBy(tags.id)
    .orderBy(tags.name);
}

export async function getTag(slug: string) {
  const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export { readingMinutes };

/**
 * Splits a post into metadata plus the document this reader may see.
 * Always use this before rendering: components never get the full text.
 */
export function viewablePost(post: typeof posts.$inferSelect, hasAccess: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, contentText, ...meta } = post;
  const { doc, truncated } = gateDoc(asDoc(content), { gated: post.visibility === "subscribers", hasAccess });
  return { post: meta, doc, truncated };
}

/** The opening paragraph only (always before any paywall line), for teasers. */
export function openingOf(post: typeof posts.$inferSelect) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, contentText, ...meta } = post;
  const opening = (asDoc(content).content ?? []).find((b) => b.type === "paragraph" && (b.content?.length ?? 0) > 0);
  const paywallIdx = (asDoc(content).content ?? []).findIndex((b) => b.type === "paywall");
  const openingIdx = opening ? (asDoc(content).content ?? []).indexOf(opening) : -1;
  const safe = opening && (paywallIdx < 0 || openingIdx < paywallIdx || post.visibility === "everyone") ? opening : null;
  return { post: meta, opening: safe && safe.type === "paragraph" ? safe : null };
}
