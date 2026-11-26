"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { newToken } from "@/lib/tokens";

export async function addSubscriber(_prev: { message?: string } | null, form: FormData) {
  await requireAdmin();
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  const lists = form.getAll("lists").filter((l): l is "essays" | "parish" => l === "essays" || l === "parish");
  if (!email.success) return { message: "Please enter a valid email address." };
  if (!lists.length) return { message: "Please choose at least one list." };
  const [row] = await db
    .insert(schema.subscribers)
    .values({ email: email.data, status: "confirmed", confirmedAt: new Date(), unsubscribeToken: newToken(), source: "admin" })
    .onConflictDoUpdate({ target: schema.subscribers.email, set: { status: "confirmed", confirmedAt: new Date(), confirmTokenHash: null } })
    .returning({ id: schema.subscribers.id });
  for (const l of lists) {
    await db
      .insert(schema.subscriberLists)
      .values({ subscriberId: row.id, listSlug: l })
      .onConflictDoUpdate({ target: [schema.subscriberLists.subscriberId, schema.subscriberLists.listSlug], set: { unsubscribedAt: null } });
  }
  revalidatePath("/studio/subscribers");
  return { message: `Added ${email.data}.` };
}

export async function removeFromList(subscriberId: string, list: string) {
  await requireAdmin();
  await db
    .update(schema.subscriberLists)
    .set({ unsubscribedAt: new Date() })
    .where(and(eq(schema.subscriberLists.subscriberId, subscriberId), eq(schema.subscriberLists.listSlug, list)));
  revalidatePath("/studio/subscribers");
}

export async function deleteSubscriber(subscriberId: string) {
  await requireAdmin();
  await db.delete(schema.subscribers).where(eq(schema.subscribers.id, subscriberId));
  revalidatePath("/studio/subscribers");
}
