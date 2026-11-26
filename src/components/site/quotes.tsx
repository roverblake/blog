import Link from "next/link";
import { postPath } from "@/lib/urls";

type Q = { id: string; type: "commonplace"; slug: string; title: string; quote: string; cite: string | null };

/** "From the Commonplace Book" quotes with sources. */
export function QuoteGrid({ quotes }: { quotes: { id: string; type: string; slug: string; title: string; quote: string; cite: string | null }[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-10">
      {(quotes as Q[]).map((q) => (
        <figure key={q.id} className="m-0 flex flex-col gap-2.5 border-b border-rule py-6">
          <blockquote className="m-0 font-caslon text-[22px] leading-[1.45] italic">
            <Link href={postPath(q)}>“{q.quote.replace(/^[“"]|[”"]$/g, "")}”</Link>
          </blockquote>
          <figcaption className="text-[16px] text-slate">
            {q.cite ? `${q.cite} · ` : ""}
            <Link href={postPath(q)} className="italic">
              {q.title}
            </Link>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
