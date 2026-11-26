import Link from "next/link";
import { monthDay, shortDate } from "@/lib/dates";
import { withShortQuotes, withThumbs, type PostListItem } from "@/lib/posts";
import { postPath, TYPE_LABEL } from "@/lib/urls";

function meta(p: PostListItem, withYear: boolean) {
  const parts: string[] = [];
  if (p.publishedAt) parts.push(withYear ? shortDate(p.publishedAt) : monthDay(p.publishedAt));
  if (p.visibility === "subscribers") parts.push("Subscribers");
  return parts.join(" · ");
}

/** §4 "The Latest" rows: type label, title in Caslon Text, date/meta, hairlines. */
/**
 * Post rows, Substack-style: a small meta line (type · date), then the title in
 * Caslon Text and its italic subtitle, with a square thumbnail at the right when
 * the post has a header image. Short commonplace quotations show in full
 * instead of a title (Nov 26 amendments).
 */
export async function PostRows({ items, withYear = false, showType = true }: { items: PostListItem[]; withYear?: boolean; showType?: boolean }) {
  if (!items.length) return <p className="py-6 text-[18px] text-slate italic">Nothing here yet.</p>;
  const rows = await withThumbs(await withShortQuotes(items));
  return (
    <ul>
      {rows.map((p) => {
        const line = [showType ? p.kicker || TYPE_LABEL[p.type] : null, meta(p, withYear)].filter(Boolean).join(" · ");
        return (
          <li key={p.id} className="border-b border-rule last:border-b-0">
            <Link href={postPath(p)} className="group flex items-start gap-5 py-6 sm:gap-8">
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                {line && <span className="text-[13px] uppercase tracking-[0.18em] text-label">{line}</span>}
                {p.quote ? (
                  <>
                    <span className="font-caslon text-[21px] leading-[1.4] whitespace-pre-line italic">“{p.quote.replace(/^[“"]|[”"]$/g, "")}”</span>
                    {p.cite && <span className="text-[16px] text-slate">{p.cite}</span>}
                  </>
                ) : (
                  <>
                    <span className="font-caslon text-[22px] leading-[1.25]">{p.title}</span>
                    {p.subtitle && <span className="text-[17px] leading-[1.45] text-slate italic">{p.subtitle}</span>}
                  </>
                )}
              </span>
              {p.thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb} alt="" loading="lazy" className="mt-1 block h-[72px] w-[72px] shrink-0 object-cover sm:h-24 sm:w-24" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "More to read": three items with label, title and italic subtitle. */
export function MoreToRead({ items }: { items: PostListItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto mt-6 box-border max-w-site px-6 pb-16" aria-labelledby="more-heading">
      <div className="section-label">
        <h2 id="more-heading">More to read</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-10">
        {items.map((p) => (
          <Link key={p.id} href={postPath(p)} className="flex flex-col gap-1.5 py-4.5">
            <span className="text-[13px] uppercase tracking-[0.18em] text-label">{p.kicker || TYPE_LABEL[p.type]}</span>
            <span className="font-caslon text-[21px] leading-[1.25]">{p.title}</span>
            {p.subtitle && <span className="text-[17px] text-slate italic">{p.subtitle}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
