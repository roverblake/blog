import "server-only";
import { db, schema } from "@/db";

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Subscribers as CSV: email, status, lists, dates. Optionally one list only. */
export async function subscribersCsv(list?: string) {
  const { subscribers: s, subscriberLists: sl } = schema;
  const subs = await db.select().from(s).orderBy(s.createdAt);
  const memberships = await db.select().from(sl);
  const lines = [["email", "status", "essays", "parish", "subscribed_at", "confirmed_at", "source"].join(",")];
  for (const sub of subs) {
    const m = memberships.filter((x) => x.subscriberId === sub.id);
    const on = (l: string) => m.some((x) => x.listSlug === l && !x.unsubscribedAt);
    if (list && !on(list)) continue;
    lines.push(
      [sub.email, sub.status, on("essays") ? "yes" : "no", on("parish") ? "yes" : "no", sub.createdAt.toISOString(), sub.confirmedAt?.toISOString() ?? "", sub.source]
        .map(cell)
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}
