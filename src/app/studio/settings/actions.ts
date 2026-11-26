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
