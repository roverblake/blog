import Link from "next/link";
import { monthDay, shortDate } from "@/lib/dates";
import type { PostListItem } from "@/lib/posts";
import { postPath, TYPE_LABEL } from "@/lib/urls";

function meta(p: PostListItem, withYear: boolean) {
  const parts: string[] = [];
  if (p.publishedAt) parts.push(withYear ? shortDate(p.publishedAt) : monthDay(p.publishedAt));
  if (p.visibility === "subscribers") parts.push("Subscribers");
  return parts.join(" · ");
}

/** §4 "The Latest" rows: type label, title in Caslon Text, date/meta, hairlines. */
export function PostRows({ items, withYear = false, showType = true }: { items: PostListItem[]; withYear?: boolean; showType?: boolean }) {
  if (!items.length) return <p className="py-6 text-[18px] text-slate italic">Nothing here yet.</p>;
  return (
    <ul>
      {items.map((p) => (
        <li key={p.id}>
          <Link href={postPath(p)} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule py-3.5">
            {showType && (
              <span className="flex-[0_0_170px] text-[13px] uppercase tracking-[0.18em] text-label">{p.kicker || TYPE_LABEL[p.type]}</span>
            )}
            <span className="flex-[1_1_260px] font-caslon text-[20px] leading-[1.3]">{p.title}</span>
            <span className="text-[16px] text-slate">{meta(p, withYear)}</span>
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
