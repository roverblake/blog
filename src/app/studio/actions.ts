"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { chicagoLocalToUtc } from "@/lib/dates";
import { saveUpload } from "@/lib/images";
import { afterPublish, derived, setPostTags, uniqueSlug } from "@/lib/post-service";
import { requireAdmin } from "@/lib/session";

const { posts } = schema;

export async function createPost(form: FormData) {
  await requireAdmin();
  const type = z.enum(["essay", "commonplace", "parish_letter"]).catch("essay").parse(form.get("type"));
  const slug = await uniqueSlug(`untitled-${Date.now().toString(36)}`);
  const [row] = await db
    .insert(posts)
    .values({ type, slug, emailLists: type === "parish_letter" ? ["parish"] : type === "essay" ? ["essays"] : [] })
    .returning({ id: posts.id });
  redirect(`/studio/posts/${row.id}`);
}

const SaveInput = z.object({
  title: z.string().max(300),
  subtitle: z.string().max(500),
  content: z.object({ type: z.literal("doc") }).passthrough(),
});

/** Autosave of title, subtitle and body. */
export async function saveDraft(id: string, input: z.infer<typeof SaveInput>) {
  await requireAdmin();
  const data = SaveInput.parse(input);
  const [row] = await db
    .update(posts)
    .set({ title: data.title, subtitle: data.subtitle || null, content: data.content, ...derived(data.content) })
    .where(eq(posts.id, id))
    .returning({ updatedAt: posts.updatedAt, wordCount: posts.wordCount, status: posts.status });
  if (row?.status === "published") revalidatePath("/", "layout");
  return { savedAt: row?.updatedAt.toISOString() ?? null };
}

const SettingsInput = z.object({
  type: z.enum(["essay", "commonplace", "parish_letter"]),
  visibility: z.enum(["everyone", "subscribers"]),
  slug: z.string().max(120),
  kicker: z.string().max(120),
  summary: z.string().max(1000),
  tags: z.array(z.string().max(60)).max(30),
  headerImageId: z.string().uuid().nullable(),
  headerCaption: z.string().max(400),
  headerCredit: z.string().max(200),
  emailLists: z.array(z.enum(["essays", "parish"])),
});
export type PostSettings = z.infer<typeof SettingsInput>;

export async function saveSettings(id: string, input: PostSettings) {
  await requireAdmin();
  const s = SettingsInput.parse(input);
  const slug = await uniqueSlug(s.slug || "untitled", id);
  await db
    .update(posts)
    .set({
      type: s.type,
      visibility: s.visibility,
      slug,
      kicker: s.kicker || null,
      summary: s.summary || null,
      headerImageId: s.headerImageId,
      headerCaption: s.headerCaption || null,
      headerCredit: s.headerCredit || null,
      emailLists: s.emailLists,
    })
    .where(eq(posts.id, id));
  await setPostTags(id, s.tags);
  revalidatePath("/", "layout");
  return { slug };
}

export async function publishNow(id: string) {
  await requireAdmin();
  const now = new Date();
  const [row] = await db.select({ publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, id));
  await db.update(posts).set({ status: "published", publishAt: null, publishedAt: row?.publishedAt ?? now }).where(eq(posts.id, id));
  await afterPublish(id);
  revalidatePath("/", "layout");
}

/** `local` is a date and time typed in Chicago time, e.g. "2026-12-01T09:00". */
export async function schedulePost(id: string, local: string) {
  await requireAdmin();
  const when = chicagoLocalToUtc(local);
  if (!when) return { error: "Please choose a date and time." };
  if (when.getTime() < Date.now() + 60_000) return { error: "Please choose a time in the future." };
  await db.update(posts).set({ status: "scheduled", publishAt: when }).where(eq(posts.id, id));
  revalidatePath("/studio");
  return { ok: true };
}

export async function unpublish(id: string) {
  await requireAdmin();
  await db.update(posts).set({ status: "draft", publishAt: null }).where(eq(posts.id, id));
  revalidatePath("/", "layout");
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/", "layout");
  redirect("/studio");
}

export async function uploadImage(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "No file received." };
  try {
    return { image: await saveUpload(file, (form.get("alt") as string) || undefined) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function setImageAlt(id: string, alt: string) {
  await requireAdmin();
  await db.update(schema.media).set({ alt: alt.slice(0, 300) }).where(eq(schema.media.id, id));
}

/* Personal dictionary for the spelling check */
export async function addDictionaryWord(word: string) {
  await requireAdmin();
  const w = word.trim().slice(0, 80);
  if (w) await db.insert(schema.dictionaryWords).values({ word: w }).onConflictDoNothing();
}

export async function removeDictionaryWord(word: string) {
  await requireAdmin();
  await db.delete(schema.dictionaryWords).where(eq(schema.dictionaryWords.word, word));
}
