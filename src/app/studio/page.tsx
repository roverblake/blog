import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { dateTime, shortDate } from "@/lib/dates";
import { readingMinutes } from "@/lib/content/text";
import { TYPE_LABEL } from "@/lib/urls";
import { createPost } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "scheduled", "published"] as const;
const TYPES = ["essay", "commonplace", "parish_letter"] as const;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string }> }) {
  const sp = await searchParams;
  const { posts } = schema;
  const where: SQL[] = [];
  if (sp.q) {
    const q = `%${sp.q}%`;
    where.push(or(ilike(posts.title, q), ilike(posts.contentText, q), ilike(posts.subtitle, q))!);
  }
  if (STATUSES.includes(sp.status as never)) where.push(eq(posts.status, sp.status as (typeof STATUSES)[number]));
  if (TYPES.includes(sp.type as never)) where.push(eq(posts.type, sp.type as (typeof TYPES)[number]));

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      type: posts.type,
      status: posts.status,
      visibility: posts.visibility,
      wordCount: posts.wordCount,
      publishAt: posts.publishAt,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(sql`coalesce(${posts.publishAt}, ${posts.publishedAt}, ${posts.updatedAt})`))
    .limit(500);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 font-display text-[36px] font-normal">Posts</h1>
        <form action={createPost} className="flex items-center gap-2">
          <label htmlFor="new-type" className="sr-only">
            Type of new post
          </label>
          <select id="new-type" name="type" className="s-select w-auto">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <button className="s-btn s-btn-primary" type="submit">
            New post
          </button>
        </form>
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="s-label">
            Search
          </label>
          <input id="q" name="q" defaultValue={sp.q} className="s-input" placeholder="Title or text" />
        </div>
        <div>
          <label htmlFor="status" className="s-label">
            Status
          </label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="s-select">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="s-label">
            Type
          </label>
          <select id="type" name="type" defaultValue={sp.type ?? ""} className="s-select">
            <option value="">All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <button className="s-btn" type="submit">
          Filter
        </button>
        {(sp.q || sp.status || sp.type) && (
          <Link href="/studio" className="inline-flex min-h-10 items-center text-[15px] text-slate italic">
            Clear
          </Link>
        )}
      </form>

      <div className="s-panel overflow-x-auto p-0">
        <table className="w-full border-collapse text-left text-[16px]">
          <thead>
            <tr className="border-b border-rule text-[12px] uppercase tracking-[0.14em] text-slate">
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Length</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate italic">
                  No posts yet. Choose a type and press New post.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-[#faf9f7]">
                <td className="px-4 py-3">
                  <Link href={`/studio/posts/${r.id}`} className="font-caslon text-[18px]">
                    {r.title || <span className="text-slate italic">Untitled</span>}
                  </Link>
                  {r.visibility === "subscribers" && <span className="ml-2 text-[13px] text-slate">· Subscribers</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`s-badge s-badge-${r.status}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-slate">{TYPE_LABEL[r.type]}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate">
                  {r.status === "scheduled" && r.publishAt
                    ? dateTime(r.publishAt)
                    : r.status === "published" && r.publishedAt
                      ? shortDate(r.publishedAt)
                      : `Edited ${shortDate(r.updatedAt)}`}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate">
                  {r.wordCount.toLocaleString()} words · {readingMinutes(r.wordCount)} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
