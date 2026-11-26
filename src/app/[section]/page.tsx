import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { CompactHeader } from "@/components/site/compact-header";
import { PostRows } from "@/components/site/post-rows";
import { NoteStream } from "@/components/site/note-stream";
import { listNotes, listPosts, viewablePost } from "@/lib/posts";
import { getViewer } from "@/lib/viewer";
import { TYPE_PLURAL, typeFromPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Params = Promise<{ section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const type = typeFromPath((await params).section);
  return type ? { title: TYPE_PLURAL[type], alternates: { canonical: `/${(await params).section}` } } : {};
}

/** Index pages: /essays, /notes, /letters, /sermons. Notes show as a stream. */
export default async function SectionIndex({ params }: { params: Params }) {
  const { section } = await params;
  const type = typeFromPath(section);
  if (!type) notFound();
  const isNotes = type === "commonplace";
  const [items, notes, viewer] = await Promise.all([
    isNotes ? Promise.resolve([]) : listPosts({ type, limit: 200 }),
    isNotes ? listNotes(100) : Promise.resolve([]),
    isNotes ? getViewer() : Promise.resolve(null),
  ]);

  return (
    <>
      <CompactHeader />
      <main className={`mx-auto flex ${isNotes ? "max-w-reading" : "max-w-lead"} flex-col gap-12 px-6 pt-12 pb-16`}>
        <section aria-labelledby="index-heading">
          <div className="section-label">
            <h1 id="index-heading">{TYPE_PLURAL[type]}</h1>
            <Link href="/archive">Archive…</Link>
          </div>
          {isNotes ? (
            <NoteStream notes={notes.map((n) => viewablePost(n, viewer?.hasAccess ?? false)) as never} />
          ) : type === "sermon" && items.length === 0 ? (
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
