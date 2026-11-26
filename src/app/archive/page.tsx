import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { PostRows } from "@/components/site/post-rows";
import { yearMonth } from "@/lib/dates";
import { listAllTags, listPosts, type PostListItem, type PostType } from "@/lib/posts";
import { TYPE_PLURAL } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archive", alternates: { canonical: "/archive" } };

const TYPES: PostType[] = ["essay", "commonplace", "parish_letter"];

type Search = Promise<{ type?: string; tag?: string; q?: string }>;

/** Posts grouped by month, newest first: [["November 2026", posts], ...]. */
function group(items: PostListItem[]) {
  const months = new Map<string, PostListItem[]>();
  for (const p of items) {
    if (!p.publishedAt) continue;
    const { year, monthName } = yearMonth(p.publishedAt);
    const key = `${monthName} ${year}`;
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(p);
  }
  return months;
}

function filterHref(type?: string, tag?: string, search?: string) {
  const q = new URLSearchParams();
  if (search) q.set("q", search);
  if (type) q.set("type", type);
  if (tag) q.set("tag", tag);
  const s = q.toString();
  return s ? `/archive?${s}` : "/archive";
}

export default async function ArchivePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const type = TYPES.includes(sp.type as PostType) ? (sp.type as PostType) : undefined;
  const tag = sp.tag || undefined;
  const search = sp.q?.trim().slice(0, 100) || undefined;
  const [items, tags] = await Promise.all([listPosts({ type, tagSlug: tag, search, limit: 2000 }), listAllTags()]);
  const months = group(items);

  const tab = (active: boolean) =>
    `inline-flex min-h-11 items-center border-b text-[13px] uppercase tracking-[0.2em] sm:min-h-0 sm:pb-1 ${active ? "border-ink text-ink" : "border-transparent text-slate hover:text-navy"}`;

  return (
    <PageShell>
      <div className="flex flex-col gap-7">
        <div className="section-label">
          <h1>Archive</h1>
        </div>
        <form role="search" action="/archive" className="max-w-reading">
          <label htmlFor="archive-q" className="sr-only">Search the archive</label>
          <input
            id="archive-q"
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search the archive…"
            className="w-full border-0 border-b border-rule bg-transparent py-2 text-[19px] outline-none placeholder:text-slate placeholder:italic focus:border-ink"
          />
          {type && <input type="hidden" name="type" value={type} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button type="submit" className="sr-only">Search</button>
        </form>
        <div className="flex flex-col gap-3">
          <nav aria-label="Filter by type" className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link href={filterHref(undefined, tag, search)} className={tab(!type)} aria-current={!type ? "page" : undefined}>
              All
            </Link>
            {TYPES.map((t) => (
              <Link key={t} href={filterHref(t, tag, search)} className={tab(type === t)} aria-current={type === t ? "page" : undefined}>
                {TYPE_PLURAL[t]}
              </Link>
            ))}
          </nav>
          {tags.length > 0 && (
            <nav aria-label="Filter by tag" className="flex flex-wrap items-baseline gap-x-2 text-[16px] text-slate">
              <span className="italic">Tags:</span>
              {tags.map((t, i) => (
                <span key={t.slug}>
                  <Link
                    href={tag === t.slug ? filterHref(type, undefined, search) : filterHref(type, t.slug, search)}
                    className={tag === t.slug ? "text-ink underline decoration-1 underline-offset-4" : "text-slate hover:text-navy"}
                    aria-current={tag === t.slug ? "page" : undefined}
                  >
                    {t.name}
                  </Link>
                  {i < tags.length - 1 && <span aria-hidden="true">&nbsp;·</span>}
                </span>
              ))}
            </nav>
          )}
        </div>
        {(search || tag) && (
          <p className="m-0 text-[17px] text-slate">
            {items.length === 1 ? "1 post" : `${items.length} posts`}
            {search ? ` matching “${search}”` : ""}
            {tag ? ` tagged ${tags.find((t) => t.slug === tag)?.name ?? tag}` : ""} ·{" "}
            <Link href={filterHref(type)} className="italic">Clear</Link>
          </p>
        )}
      </div>

      {months.size === 0 && <p className="text-[18px] text-slate italic">{search ? "Nothing matches that search." : "Nothing here yet."}</p>}

      {[...months.entries()].map(([month, posts]) => (
        <section key={month} aria-label={month}>
          <div className="section-label">
            <h2>{month}</h2>
          </div>
          <PostRows items={posts} />
        </section>
      ))}
    </PageShell>
  );
}
