import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db, schema } from "@/db";
import { postEmail } from "@/emails/post-email";
import { asDoc } from "@/lib/content/types";
import { fullDate } from "@/lib/dates";
import { siteUrl } from "@/lib/env";
import { getImage } from "@/lib/posts";
import { getSetting } from "@/lib/settings";
import { postPath, TYPE_LABEL } from "@/lib/urls";

const BATCH = 100; // Resend's batch limit

/**
 * Emails a published post to its chosen lists. Safe to call more than once:
 * each (post, list) pair is only ever sent once. Someone on two of the lists
 * gets one copy.
 */
export async function sendPostNewsletter(postId: string) {
  const post = (await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1))[0];
  if (!post || post.status !== "published" || post.emailLists.length === 0) return;

  // Claim each list for this post; lists already sent (or sending) are skipped.
  const claimed: string[] = [];
  for (const list of post.emailLists) {
    const rows = await db
      .insert(schema.emailSends)
      .values({ postId, listSlug: list, status: "sending" })
      .onConflictDoNothing()
      .returning({ id: schema.emailSends.id });
    if (rows.length) claimed.push(list);
  }
  if (!claimed.length) return;

  const lists = await db.select().from(schema.lists).where(inArray(schema.lists.slug, claimed));
  const recipients = await db
    .select({
      email: schema.subscribers.email,
      token: schema.subscribers.unsubscribeToken,
      list: schema.subscriberLists.listSlug,
    })
    .from(schema.subscriberLists)
    .innerJoin(schema.subscribers, eq(schema.subscribers.id, schema.subscriberLists.subscriberId))
    .where(
      and(
        inArray(schema.subscriberLists.listSlug, claimed),
        isNull(schema.subscriberLists.unsubscribedAt),
        eq(schema.subscribers.status, "confirmed"),
      ),
    );

  // One copy per person, credited to the first of the post's lists they're on.
  const byEmail = new Map<string, { email: string; token: string; list: string }>();
  for (const list of claimed) for (const r of recipients) if (r.list === list && !byEmail.has(r.email)) byEmail.set(r.email, r);

  const base = siteUrl();
  const url = `${base}${postPath(post)}`;
  const image = await getImage(post.headerImageId);
  const mailingAddress = await getSetting<string>("mailingAddress", "");
  const from = process.env.EMAIL_FROM ?? "Blake Johnson <onboarding@resend.dev>";
  const subject = post.title || "A new post";

  const messages = [...byEmail.values()].map((r) => {
    const listName = lists.find((l) => l.slug === r.list)?.name ?? "this newsletter";
    const unsubList = `${base}/unsubscribe?token=${encodeURIComponent(r.token)}&list=${r.list}`;
    const unsubAll = `${base}/unsubscribe?token=${encodeURIComponent(r.token)}&list=all`;
    const oneClick = `${base}/api/unsubscribe?token=${encodeURIComponent(r.token)}&list=${r.list}`;
    const { html, text } = postEmail({
      base,
      url,
      kicker: post.kicker || TYPE_LABEL[post.type],
      title: post.title,
      subtitle: post.subtitle,
      dateLabel: fullDate(post.publishedAt ?? new Date()),
      headerImage: image ? (image.src.startsWith("http") ? image.src : base + image.src) : null,
      headerCaption: post.headerCaption,
      doc: asDoc(post.content),
      mailingAddress,
      listName,
      unsubscribeListUrl: unsubList,
      unsubscribeAllUrl: unsubAll,
    });
    return {
      list: r.list,
      msg: {
        from,
        to: r.email,
        subject,
        html,
        text,
        headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      },
    };
  });

  const key = process.env.RESEND_API_KEY;
  const ids: string[] = [];
  let error: string | null = null;
  try {
    if (!key) {
      for (const m of messages) console.log(`\n[newsletter] To: ${m.msg.to} · ${m.msg.subject}`);
    } else {
      const resend = new Resend(key);
      for (let i = 0; i < messages.length; i += BATCH) {
        const { data, error: err } = await resend.batch.send(messages.slice(i, i + BATCH).map((m) => m.msg));
        if (err) throw new Error(err.message);
        ids.push(...(data?.data ?? []).map((d) => d.id));
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("[newsletter] send failed:", error);
  }

  for (const list of claimed) {
    await db
      .update(schema.emailSends)
      .set({
        status: error ? "failed" : "sent",
        error,
        recipientCount: messages.filter((m) => m.list === list).length,
        resendIds: ids,
        sentAt: error ? null : new Date(),
      })
      .where(and(eq(schema.emailSends.postId, postId), eq(schema.emailSends.listSlug, list)));
  }
}
