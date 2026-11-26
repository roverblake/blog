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
 * Post rows: type label, title in Caslon Text with its italic subtitle, date,
 * and a small square thumbnail when the post has a header image. Short
 * commonplace quotations show in full instead of a title (Nov 26 amendments).
 */
export async function PostRows({ items, withYear = false, showType = true }: { items: PostListItem[]; withYear?: boolean; showType?: boolean }) {
  if (!items.length) return <p className="py-6 text-[18px] text-slate italic">Nothing here yet.</p>;
  const rows = await withThumbs(await withShortQuotes(items));
  return (
    <ul>
      {rows.map((p) => (
        <li key={p.id}>
          <Link href={postPath(p)} className="flex items-start gap-4 border-b border-rule py-4 sm:gap-6">
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
              {showType && (
                <span className="flex-[0_0_170px] text-[13px] uppercase tracking-[0.18em] text-label">{p.kicker || TYPE_LABEL[p.type]}</span>
              )}
              <span className="flex flex-[1_1_260px] flex-col gap-1">
                {p.quote ? (
                  <>
                    <span className="font-caslon text-[20px] leading-[1.4] whitespace-pre-line italic">“{p.quote.replace(/^[“"]|[”"]$/g, "")}”</span>
                    {p.cite && <span className="text-[16px] text-slate">{p.cite}</span>}
                  </>
                ) : (
                  <>
                    <span className="font-caslon text-[20px] leading-[1.3]">{p.title}</span>
                    {p.subtitle && <span className="text-[17px] leading-[1.4] text-slate italic">{p.subtitle}</span>}
                  </>
                )}
              </span>
              <span className="text-[16px] text-slate">{meta(p, withYear)}</span>
            </span>
            {p.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.thumb} alt="" loading="lazy" className="block h-16 w-16 shrink-0 object-cover sm:h-[88px] sm:w-[88px]" />
            )}
          </Link>
        </li>
      ))}
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
          <Link key={p.id} href={postPath(p)} className="flex flex-col gap-1.5 border-b border-rule py-4.5">
            <span className="text-[13px] uppercase tracking-[0.18em] text-label">{p.kicker || TYPE_LABEL[p.type]}</span>
            <span className="font-caslon text-[21px] leading-[1.25]">{p.title}</span>
            {p.subtitle && <span className="text-[17px] text-slate italic">{p.subtitle}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
