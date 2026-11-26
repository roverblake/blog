"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
