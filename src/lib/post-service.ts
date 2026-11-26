import "server-only";
import { and, eq, lte, ne, sql } from "drizzle-orm";
import { sendPostNewsletter } from "@/lib/newsletter";
import { db, schema } from "@/db";
import { countWords, docToText } from "@/lib/content/text";
import { asDoc } from "@/lib/content/types";
import { slugify } from "@/lib/urls";

const { posts, tags, postTags } = schema;

/** Returns a slug no other post uses, adding -2, -3… if needed. */
export async function uniqueSlug(wanted: string, postId?: string): Promise<string> {
  const base = slugify(wanted) || "untitled";
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const clash = await db
      .select({ id: posts.id })
      .from(posts)
      .where(postId ? and(eq(posts.slug, candidate), ne(posts.id, postId)) : eq(posts.slug, candidate))
      .limit(1);
    if (!clash.length) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Derived fields kept in step with the document. */
export function derived(content: unknown) {
  const text = docToText(asDoc(content));
  return { contentText: text, wordCount: countWords(text) };
}

export async function setPostTags(postId: string, names: string[]) {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 30);
  await db.delete(postTags).where(eq(postTags.postId, postId));
  for (const name of clean) {
    const slug = slugify(name);
    if (!slug) continue;
    const [tag] = await db
      .insert(tags)
      .values({ name, slug })
      .onConflictDoUpdate({ target: tags.slug, set: { name } })
      .returning({ id: tags.id });
    await db.insert(postTags).values({ postId, tagId: tag.id }).onConflictDoNothing();
  }
}

/** Called whenever a post goes live (now or on schedule): emails it to its lists. */
export async function afterPublish(postId: string) {
  try {
    await sendPostNewsletter(postId);
  } catch (e) {
    console.error("[afterPublish]", e);
  }
}

/** Publishes every scheduled post whose time has come. Returns how many. */
export async function publishDuePosts(now = new Date()): Promise<number> {
  const due = await db
    .update(posts)
    .set({ status: "published", publishedAt: sql`${posts.publishAt}` })
    .where(and(eq(posts.status, "scheduled"), lte(posts.publishAt, now)))
    .returning({ id: posts.id });
  for (const p of due) await afterPublish(p.id);
  return due.length;
}
