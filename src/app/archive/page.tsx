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

function group(items: PostListItem[]) {
  const years = new Map<number, Map<string, PostListItem[]>>();
  for (const p of items) {
    if (!p.publishedAt) continue;
    const { year, monthName } = yearMonth(p.publishedAt);
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year)!;
    if (!months.has(monthName)) months.set(monthName, []);
    months.get(monthName)!.push(p);
  }
  return years;
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
  const years = group(items);

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center border px-3 text-[15px] ${active ? "border-ink text-ink" : "border-rule text-slate"}`;

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="section-label">
          <h1>Archive</h1>
        </div>
        <form role="search" action="/archive" className="inline-form inline-form-sm max-w-reading">
          <label htmlFor="archive-q" className="sr-only">Search the archive</label>
          <input id="archive-q" name="q" type="search" defaultValue={search ?? ""} placeholder="Search the archive" />
          {type && <input type="hidden" name="type" value={type} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button type="submit" className="btn-primary">Search</button>
        </form>
        {search && (
          <p className="m-0 text-[17px] text-slate">
            {items.length === 1 ? "1 result" : `${items.length} results`} for “{search}” ·{" "}
            <Link href={filterHref(type, tag)} className="italic">Clear search</Link>
          </p>
        )}
        <nav aria-label="Filter by type" className="flex flex-wrap items-center gap-2.5">
          <span className="mr-1.5 text-[14px] uppercase tracking-[0.16em] text-slate">Type</span>
          <Link href={filterHref(undefined, tag, search)} className={chip(!type)} aria-current={!type ? "page" : undefined}>
            All
          </Link>
          {TYPES.map((t) => (
            <Link key={t} href={filterHref(t, tag, search)} className={chip(type === t)} aria-current={type === t ? "page" : undefined}>
              {TYPE_PLURAL[t]}
            </Link>
          ))}
        </nav>
        {tags.length > 0 && (
          <nav aria-label="Filter by tag" className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1.5 text-[14px] uppercase tracking-[0.16em] text-slate">Tag</span>
            <Link href={filterHref(type, undefined, search)} className={chip(!tag)} aria-current={!tag ? "page" : undefined}>
              All
            </Link>
            {tags.map((t) => (
              <Link key={t.slug} href={filterHref(type, t.slug, search)} className={chip(tag === t.slug)} aria-current={tag === t.slug ? "page" : undefined}>
                {t.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {years.size === 0 && <p className="text-[18px] text-slate italic">{search ? "Nothing matches that search." : "Nothing here yet."}</p>}

      {[...years.entries()].map(([year, months]) => (
        <section key={year} aria-labelledby={`y-${year}`}>
          <h2 id={`y-${year}`} className="m-0 font-display text-[38px] font-normal">
            {year}
          </h2>
          {[...months.entries()].map(([month, posts]) => (
            <div key={month} className="mt-6">
              <div className="section-label">
                <h3 className="m-0 text-[15px] font-semibold uppercase tracking-[0.24em]">{month}</h3>
              </div>
              <PostRows items={posts} />
            </div>
          ))}
        </section>
      ))}
    </PageShell>
  );
}
