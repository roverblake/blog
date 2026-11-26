import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { shortDate } from "@/lib/dates";
import { AddSubscriberForm, RowActions } from "./client";

export const dynamic = "force-dynamic";

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ q?: string; list?: string }> }) {
  const sp = await searchParams;
  const { subscribers: s, subscriberLists: sl } = schema;

  const counts = await db
    .select({ list: sl.listSlug, n: sql<number>`count(*)::int` })
    .from(sl)
    .innerJoin(s, eq(s.id, sl.subscriberId))
    .where(and(isNull(sl.unsubscribedAt), eq(s.status, "confirmed")))
    .groupBy(sl.listSlug);
  const pending = (await db.select({ n: sql<number>`count(*)::int` }).from(s).where(eq(s.status, "pending")))[0]?.n ?? 0;
  const count = (l: string) => counts.find((c) => c.list === l)?.n ?? 0;

  const rows = await db
    .select({
      id: s.id,
      email: s.email,
      status: s.status,
      createdAt: s.createdAt,
      source: s.source,
      lists: sql<string[]>`coalesce(array_agg(${sl.listSlug}) filter (where ${sl.unsubscribedAt} is null), '{}')`,
    })
    .from(s)
    .leftJoin(sl, eq(sl.subscriberId, s.id))
    .where(sp.q ? ilike(s.email, `%${sp.q}%`) : undefined)
    .groupBy(s.id)
    .orderBy(desc(s.createdAt))
    .limit(1000);
  const shown = sp.list ? rows.filter((r) => r.lists.includes(sp.list!)) : rows;

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 font-display text-[36px] font-normal">Subscribers</h1>
        <div className="flex gap-2">
          <a download className="s-btn" href="/studio/subscribers/export">Export all (CSV)</a>
          <a download className="s-btn" href="/studio/subscribers/export?list=essays">Essays CSV</a>
          <a download className="s-btn" href="/studio/subscribers/export?list=parish">Parish CSV</a>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          ["Essays", count("essays")],
          ["Letters to the Parish", count("parish")],
          ["Waiting to confirm", pending],
        ].map(([label, n]) => (
          <div key={label} className="s-panel">
            <div className="s-panel-title m-0">{label}</div>
            <div className="font-display text-[40px]">{n}</div>
          </div>
        ))}
      </div>

      <AddSubscriberForm />

      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="s-label">Search by email</label>
          <input id="q" name="q" defaultValue={sp.q} className="s-input" />
        </div>
        <div>
          <label htmlFor="list" className="s-label">List</label>
          <select id="list" name="list" defaultValue={sp.list ?? ""} className="s-select">
            <option value="">All</option>
            <option value="essays">Essays</option>
            <option value="parish">Letters to the Parish</option>
          </select>
        </div>
        <button className="s-btn">Filter</button>
      </form>

      <div className="s-panel overflow-x-auto p-0">
        <table className="w-full border-collapse text-left text-[16px]">
          <thead>
            <tr className="border-b border-rule text-[12px] uppercase tracking-[0.14em] text-slate">
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Lists</th>
              <th className="px-4 py-3 font-normal">Since</th>
              <th className="px-4 py-3 font-normal"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate italic">No subscribers yet.</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3 text-slate">{r.status === "confirmed" ? "Confirmed" : "Waiting to confirm"}</td>
                <td className="px-4 py-3 text-slate">
                  {r.lists.length ? r.lists.map((l) => (l === "essays" ? "Essays" : "Parish")).join(", ") : "None (unsubscribed)"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate">{shortDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <RowActions id={r.id} email={r.email} lists={r.lists} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
