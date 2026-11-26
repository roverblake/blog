"use server";

import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { confirmEmail } from "@/emails/confirm";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashToken, newToken } from "@/lib/tokens";

export type SubscribeState = { status: "idle" | "ok" | "error"; message?: string };

const Input = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  lists: z.array(z.enum(["essays", "parish"])).min(1),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

const CONFIRM_HOURS = 72;

export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const parsed = Input.safeParse({
    email: form.get("email"),
    lists: form.getAll("lists"),
    website: form.get("website") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "lists") return { status: "error", message: "Please choose at least one newsletter." };
    if (issue?.path[0] === "website") return { status: "ok" };
    return { status: "error", message: "Please enter a valid email address." };
  }
  const { email, lists } = parsed.data;

  const ip = await clientIp();
  const okIp = await rateLimit(`subscribe:ip:${ip}`, 5, 60 * 10);
  const okEmail = await rateLimit(`subscribe:email:${email}`, 3, 60 * 60);
  if (!okIp || !okEmail) {
    return { status: "error", message: "Too many tries. Please wait a few minutes and try again." };
  }

  const existing = (await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, email)).limit(1))[0];
  let subscriberId: string;
  let token: string | null = null;

  if (existing) {
    subscriberId = existing.id;
    if (existing.status === "pending") {
      token = newToken();
      await db
        .update(schema.subscribers)
        .set({
          confirmTokenHash: hashToken(token),
          confirmTokenExpiresAt: new Date(Date.now() + CONFIRM_HOURS * 3600_000),
        })
        .where(eq(schema.subscribers.id, existing.id));
    }
  } else {
    token = newToken();
    const [row] = await db
      .insert(schema.subscribers)
      .values({
        email,
        status: "pending",
        confirmTokenHash: hashToken(token),
        confirmTokenExpiresAt: new Date(Date.now() + CONFIRM_HOURS * 3600_000),
        unsubscribeToken: newToken(),
        source: "form",
      })
      .returning({ id: schema.subscribers.id });
    subscriberId = row.id;
  }

  // Add (or re-activate) the chosen lists. Lists not ticked are left alone.
  for (const slug of lists) {
    await db
      .insert(schema.subscriberLists)
      .values({ subscriberId, listSlug: slug })
      .onConflictDoUpdate({
        target: [schema.subscriberLists.subscriberId, schema.subscriberLists.listSlug],
        set: { unsubscribedAt: null, subscribedAt: new Date() },
      });
  }

  if (token) {
    const names = await db
      .select({ name: schema.lists.name })
      .from(schema.lists)
      .where(inArray(schema.lists.slug, lists))
      .orderBy(schema.lists.position);
    const url = `${siteUrl()}/subscribe/confirm?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: email, ...confirmEmail(url, names.map((n) => n.name)) });
  }

  // Same message whether new, pending or already confirmed (no address probing).
  return { status: "ok", message: "Almost done. Check your inbox for a confirmation link." };
}
