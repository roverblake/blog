import { strToU8, zipSync, type Zippable } from "fflate";
import { db, schema } from "@/db";
import { asDoc } from "@/lib/content/types";
import { docToMarkdown } from "@/lib/content/markdown";
import { subscribersCsv } from "@/lib/csv";
import { requireAdmin } from "@/lib/session";
import { getSetting } from "@/lib/settings";
import { getObject } from "@/lib/storage";
import { postPath } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const yaml = (v: unknown) => JSON.stringify(v ?? null);

/** "Export everything": posts as Markdown + images + subscribers CSV, in one zip. */
export async function GET() {
  await requireAdmin();
  const files: Zippable = {};
  const [posts, media, postTags, tags] = await Promise.all([
    db.select().from(schema.posts),
    db.select().from(schema.media),
    db.select().from(schema.postTags),
    db.select().from(schema.tags),
  ]);

  // Images: the original of each upload, named by its id.
  const keyToFile = new Map<string, string>();
  for (const m of media) {
    if (m.storageKey.startsWith("/") || m.storageKey.startsWith("http")) continue;
    const obj = await getObject(m.storageKey);
    if (!obj) continue;
    const name = `images/${m.id}.jpg`;
    files[name] = [new Uint8Array(obj.body), { level: 0 }];
    keyToFile.set(m.storageKey, name);
    for (const v of m.variants) keyToFile.set(v.storageKey, name);
  }
  const mapImage = (src: string) => {
    const f = keyToFile.get(src.replace(/^\/media\//, ""));
    return f ? `../${f}` : src;
  };

  for (const p of posts) {
    const tagNames = postTags
      .filter((pt) => pt.postId === p.id)
      .map((pt) => tags.find((t) => t.id === pt.tagId)?.name)
      .filter(Boolean);
    const header = media.find((m) => m.id === p.headerImageId);
    const front = [
      "---",
      `title: ${yaml(p.title)}`,
      `subtitle: ${yaml(p.subtitle)}`,
      `type: ${p.type}`,
      `status: ${p.status}`,
      `visibility: ${p.visibility}`,
      `slug: ${p.slug}`,
      `url: ${yaml(postPath(p))}`,
      `kicker: ${yaml(p.kicker)}`,
      `summary: ${yaml(p.summary)}`,
      `tags: ${yaml(tagNames)}`,
      `published_at: ${yaml(p.publishedAt?.toISOString())}`,
      `scheduled_for: ${yaml(p.publishAt?.toISOString())}`,
      `header_image: ${yaml(header ? mapImage(header.storageKey) : null)}`,
      `header_caption: ${yaml(p.headerCaption)}`,
      `header_credit: ${yaml(p.headerCredit)}`,
      `email_lists: ${yaml(p.emailLists)}`,
      "---",
      "",
    ].join("\n");
    const folder = p.status === "published" ? "posts" : "drafts";
    files[`${folder}/${p.slug}.md`] = strToU8(front + docToMarkdown(asDoc(p.content), mapImage));
  }

  files["subscribers.csv"] = strToU8(await subscribersCsv());
  const about = await getSetting<unknown>("about", null);
  if (about) files["pages/about.md"] = strToU8(docToMarkdown(asDoc(about)));
  files["README.txt"] = strToU8(
    `Export of Blake Johnson's site, ${new Date().toISOString()}\n\nposts/           published posts (Markdown)\ndrafts/          drafts and scheduled posts\nimages/          uploaded images (originals)\nsubscribers.csv  everyone who subscribed, and to which lists\npages/about.md   the About page\n`,
  );

  const zip = zipSync(files, { level: 6 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(zip), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="blake-johnson-export-${date}.zip"`,
    },
  });
}
