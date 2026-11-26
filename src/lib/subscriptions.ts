import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashToken } from "@/lib/tokens";

/** Confirms a double opt-in token. Returns true on success. */
export async function confirmSubscription(token: string): Promise<boolean> {
  const hash = hashToken(token);
  const rows = await db
    .update(schema.subscribers)
    .set({ status: "confirmed", confirmedAt: new Date(), confirmTokenHash: null, confirmTokenExpiresAt: null })
    .where(and(eq(schema.subscribers.confirmTokenHash, hash), gt(schema.subscribers.confirmTokenExpiresAt, new Date())))
    .returning({ id: schema.subscribers.id });
  return rows.length > 0;
}

/** One-click unsubscribe from one list (or all lists when list is "all"). */
export async function unsubscribeByToken(token: string, list: string): Promise<{ email: string } | null> {
  const sub = (await db.select().from(schema.subscribers).where(eq(schema.subscribers.unsubscribeToken, token)).limit(1))[0];
  if (!sub) return null;
  const where =
    list === "all"
      ? and(eq(schema.subscriberLists.subscriberId, sub.id), isNull(schema.subscriberLists.unsubscribedAt))
      : and(eq(schema.subscriberLists.subscriberId, sub.id), eq(schema.subscriberLists.listSlug, list));
  await db.update(schema.subscriberLists).set({ unsubscribedAt: new Date() }).where(where);
  return { email: sub.email };
}
