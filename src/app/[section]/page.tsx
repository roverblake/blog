import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { CompactHeader } from "@/components/site/compact-header";
import { PostRows } from "@/components/site/post-rows";
import { QuoteGrid } from "@/components/site/quotes";
import { TopStrip } from "@/components/site/top-strip";
import { getCommonplaceQuotes, listPosts } from "@/lib/posts";
import { TYPE_PLURAL, typeFromPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Params = Promise<{ section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const type = typeFromPath((await params).section);
  return type ? { title: TYPE_PLURAL[type], alternates: { canonical: `/${(await params).section}` } } : {};
}

/** Index pages: /essays, /commonplace, /letters, /sermons. */
export default async function SectionIndex({ params }: { params: Params }) {
  const { section } = await params;
  const type = typeFromPath(section);
  if (!type) notFound();
  const items = await listPosts({ type, limit: 200 });
  const quotes = type === "commonplace" ? await getCommonplaceQuotes(6) : [];

  return (
    <>
      <TopStrip />
      <CompactHeader />
      <main className="mx-auto flex max-w-lead flex-col gap-12 px-6 pt-12 pb-16">
        {type === "commonplace" && quotes.length > 0 && (
          <section aria-labelledby="quotes-heading">
            <div className="section-label">
              <h2 id="quotes-heading">From the Commonplace Book</h2>
            </div>
            <QuoteGrid quotes={quotes} />
          </section>
        )}
        <section aria-labelledby="index-heading">
          <div className="section-label">
            <h1 id="index-heading">{type === "commonplace" ? "All notes" : TYPE_PLURAL[type]}</h1>
            <Link href="/archive">Archive…</Link>
          </div>
          {type === "sermon" && items.length === 0 ? (
            <p className="py-6 text-[18px] text-slate italic">Sermons will appear here.</p>
          ) : (
            <PostRows items={items} withYear showType={false} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
