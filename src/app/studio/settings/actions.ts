"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { setSetting } from "@/lib/settings";

export async function saveMailingAddress(address: string) {
  await requireAdmin();
  await setSetting("mailingAddress", z.string().max(500).parse(address).trim());
  return { ok: true };
}

export async function saveSiteIdentity(input: unknown) {
  await requireAdmin();
  const { title, tagline } = z.object({ title: z.string().max(80), tagline: z.string().max(200) }).parse(input);
  await setSetting("siteIdentity", { title: title.trim(), tagline: tagline.trim() });
  revalidatePath("/", "layout");
  return { ok: true };
}

const footerInput = z.object({
  columns: z
    .array(
      z.object({
        heading: z.string().max(40),
        links: z.array(z.object({ label: z.string().max(60), href: z.string().max(300) })).max(10),
      }),
    )
    .max(4),
  credit: z.string().max(200),
});

/** Footer links may point to a page on the site, a web address, or an email address. */
function normalizeHref(h: string) {
  if (/^(\/|https?:\/\/|mailto:)/i.test(h)) return h;
  if (h.includes("@") && !h.includes("/")) return `mailto:${h}`;
  if (h.includes(".")) return `https://${h}`;
  return `/${h.replace(/^\/+/, "")}`;
}

export async function saveFooter(input: unknown) {
  await requireAdmin();
  const f = footerInput.parse(input);
  const columns = f.columns
    .map((c) => ({
      heading: c.heading.trim(),
      links: c.links
        .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
        .filter((l) => l.label && l.href)
        .map((l) => ({ ...l, href: normalizeHref(l.href) })),
    }))
    .filter((c) => c.heading || c.links.length);
  await setSetting("footer", { columns, credit: f.credit.trim() });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveAbout(doc: unknown) {
  await requireAdmin();
  const parsed = z.object({ type: z.literal("doc") }).passthrough().parse(doc);
  await setSetting("about", parsed);
  revalidatePath("/about");
  return { ok: true };
}

const newsletterInput = z.object({
  copy: z.object({
    label: z.string().max(60),
    heading: z.string().max(120),
    body: z.string().max(400),
    button: z.string().max(30),
  }),
  options: z
    .array(
      z.object({
        slug: z.enum(["essays", "parish"]),
        name: z.string().trim().min(1).max(80),
        cadence: z.string().max(80),
        show: z.boolean(),
        checked: z.boolean(),
      }),
    )
    .max(2),
});

export async function saveNewsletterBox(input: unknown) {
  await requireAdmin();
  const { copy, options } = newsletterInput.parse(input);
  const trimmed = Object.fromEntries(Object.entries(copy).map(([k, v]) => [k, v.trim()]));
  await setSetting("newsletterCopy", trimmed);
  await setSetting(
    "newsletterOptions",
    Object.fromEntries(options.map((o) => [o.slug, { show: o.show, checked: o.checked }])),
  );
  for (const o of options) {
    await db.update(schema.lists).set({ name: o.name, description: o.cadence.trim() }).where(eq(schema.lists.slug, o.slug));
  }
  revalidatePath("/");
  revalidatePath("/subscribe");
  return { ok: true };
}
