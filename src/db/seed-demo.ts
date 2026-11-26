/**
 * Fills a LOCAL database with sample posts so the public pages can be seen.
 * Refuses to run against production. Usage: pnpm db:seed:demo
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db, schema } from "./index";
import type { Doc, InlineNode } from "../lib/content/types";
import { countWords, docToText } from "../lib/content/text";

if (process.env.NODE_ENV === "production" || /railway|rlwy/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to add demo posts to a production database.");
  process.exit(1);
}

const t = (text: string, marks?: { type: "italic" | "bold" }[]): InlineNode => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (...content: InlineNode[]) => ({ type: "paragraph" as const, content });

const restless: Doc = {
  type: "doc",
  content: [
    p(t("There is a kind of tiredness that sleep does not fix. You know it if you have ever come home from a long-awaited trip and felt, somewhere on the drive back, a faint disappointment you could not name. Nothing went wrong. It simply was not enough.")),
    p(t("Saint Augustine opens his "), t("Confessions", [{ type: "italic" }]), t(" with a sentence that names this feeling better than almost anything written since:")),
    { type: "pullQuote", attrs: { cite: "Augustine, Confessions I.1 · trans. E. B. Pusey" }, content: [p(t("“Thou madest us for Thyself, and our heart is restless, until it repose in Thee.”"))] },
    p(t("We usually treat restlessness as a malfunction. If I am restless, something must need fixing: a new job, a better routine, a quieter house. Sometimes that is true. But Augustine suggests something stranger. The restlessness may be working exactly as it was made to."), { type: "footnote", attrs: { text: "Augustine, Confessions, trans. E. B. Pusey (Oxford, 1838), I.1." } }),
    { type: "heading", attrs: { level: 2 }, content: [t("A signpost, not a problem")] },
    p(t("Think about homesickness. Most of us have felt it even while sitting in the house we grew up in, surrounded by the very people we missed. The longing was real, but it pointed past the place. Home, it turns out, was a word for something the house could only suggest.")),
    p(t("C. S. Lewis made a similar argument: if we find in ourselves a desire that nothing in this world can satisfy, the likeliest explanation is that we were made for another. The ache is not a mistake in the design. It is a clue to the designer.")),
    { type: "paywall" },
    p(t("Pascal saw the other side of the coin. He noticed how much of ordinary life is spent running from this ache: the noise, the errands, the endless small diversions that keep us from sitting quietly long enough to feel it.")),
    { type: "heading", attrs: { level: 2 }, content: [t("Learning to stay")] },
    p(t("So what do we do with a restless heart? Not nothing, and not everything. We can begin by noticing the longing before rushing to feed it. A few minutes of silence before the day starts. A walk without headphones. A prayer that asks for nothing and simply waits.")),
    p(t("SECRET-GATED-TEXT Advent begins this Sunday, a whole season built around this practice: waiting on purpose, letting the ache sharpen rather than numbing it.")),
    { type: "horizontalRule" },
  ],
};

const quiet: Doc = { type: "doc", content: [p(t("Stillness is not a mood that arrives; it is a discipline you practice, like scales on a piano.")), p(t("More to come."))] };
const pascal: Doc = {
  type: "doc",
  content: [
    { type: "pullQuote", attrs: { cite: "Pascal, Pensées 139" }, content: [p(t("All the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber."))] },
    p(t("A note on distraction.")),
  ],
};
const augustine: Doc = {
  type: "doc",
  content: [
    { type: "pullQuote", attrs: { cite: "Augustine, Confessions I.1" }, content: [p(t("Our heart is restless, until it repose in Thee."))] },
    p(t("A note on restlessness as direction.")),
  ],
};
const letter: Doc = { type: "doc", content: [p(t("Dear friends, as Advent begins, I want to invite you to wait on purpose this year.")), p(t("Yours in Christ, Blake"))] };

async function makeImage(name: string, w: number, h: number, shade: number) {
  const dir = path.join(process.cwd(), "public", "demo");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  await sharp({ create: { width: w, height: h, channels: 3, background: { r: shade, g: shade + 4, b: shade + 10 } } })
    .jpeg({ quality: 80 })
    .toFile(file);
  const [m] = await db
    .insert(schema.media)
    .values({ storageKey: `/demo/${name}`, mimeType: "image/jpeg", width: w, height: h, alt: "Light through an arched window in a quiet chapel" })
    .onConflictDoUpdate({ target: schema.media.storageKey, set: { width: w } })
    .returning();
  return m.id;
}

async function upsertPost(v: Partial<typeof schema.posts.$inferInsert> & { slug: string; content: Doc }) {
  const text = docToText(v.content);
  const values = { status: "published" as const, contentText: text, wordCount: countWords(text), ...v };
  const [row] = await db.insert(schema.posts).values(values).onConflictDoUpdate({ target: schema.posts.slug, set: values }).returning();
  return row;
}

async function main() {
  const img = await makeImage("restless.jpg", 2100, 900, 60);
  const day = (n: number) => new Date(Date.UTC(2026, 10, n, 15));

  const r = await upsertPost({
    slug: "the-restless-heart", type: "essay", visibility: "subscribers", kicker: "Essay · Advent",
    title: "The Restless Heart", subtitle: "Why our deepest longings are not problems to fix, but signposts to follow",
    summary: "Why our deepest longings are not problems to fix, but signposts to follow.",
    content: restless, headerImageId: img, headerCaption: "Morning light in the nave", headerCredit: "Photo: Demo", publishedAt: day(25),
  });
  await upsertPost({ slug: "quiet-is-a-skill", type: "essay", title: "Quiet Is a Skill", subtitle: "On stillness as a discipline you practice", content: quiet, publishedAt: day(18) });
  await upsertPost({ slug: "the-quiet-room", type: "commonplace", title: "The Quiet Room", subtitle: "On Pascal, Pensées 139", content: pascal, publishedAt: day(20) });
  await upsertPost({ slug: "restless-heart-note", type: "commonplace", title: "Restless Heart", subtitle: "On Augustine, Confessions I.1", content: augustine, publishedAt: day(12) });
  await upsertPost({ slug: "first-week-of-advent", type: "parish_letter", title: "A Letter for the First Week of Advent", subtitle: "On waiting on purpose", content: letter, publishedAt: day(22) });

  for (const name of ["Augustine", "Desire", "Advent"]) {
    const slug = name.toLowerCase();
    const [tag] = await db.insert(schema.tags).values({ name, slug }).onConflictDoUpdate({ target: schema.tags.slug, set: { name } }).returning();
    await db.insert(schema.postTags).values({ postId: r.id, tagId: tag.id }).onConflictDoNothing();
  }
  console.log("Demo posts added.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
