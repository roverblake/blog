import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { LeadStory } from "@/components/site/lead-story";
import { Masthead } from "@/components/site/masthead";
import { NewsletterBox } from "@/components/site/newsletter-box";
import { PostRows } from "@/components/site/post-rows";
import { NoteStream } from "@/components/site/note-stream";
import { getImage, getLeadPost, listNotes, listPosts, openingOf, POST_TYPES, viewablePost } from "@/lib/posts";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

type FeedGroup = { kind: "posts"; items: Awaited<ReturnType<typeof listPosts>> } | { kind: "notes"; items: Awaited<ReturnType<typeof listNotes>> };

const FEED_LENGTH = 8;

export default async function Home() {
  const lead = await getLeadPost();
  const [image, latest, notes, viewer] = await Promise.all([
    getImage(lead?.headerImageId ?? null),
    listPosts({ type: POST_TYPES, excludeIds: lead ? [lead.id] : [], limit: FEED_LENGTH }),
    listNotes(FEED_LENGTH),
    getViewer(),
  ]);

  // One feed, newest first: posts and notes together. Runs of the same kind are grouped.
  const time = (d: Date | null) => (d ? new Date(d).getTime() : 0);
  const merged = [
    ...latest.map((p) => ({ kind: "posts" as const, at: time(p.publishedAt), p })),
    ...notes.map((n) => ({ kind: "notes" as const, at: time(n.publishedAt), n })),
  ]
    .sort((x, y) => y.at - x.at)
    .slice(0, FEED_LENGTH);
  const groups: FeedGroup[] = [];
  for (const it of merged) {
    const last = groups.at(-1);
    if (it.kind === "posts") {
      if (last?.kind === "posts") last.items.push(it.p);
      else groups.push({ kind: "posts", items: [it.p] });
    } else {
      if (last?.kind === "notes") last.items.push(it.n);
      else groups.push({ kind: "notes", items: [it.n] });
    }
  }

  return (
    <>
      <Masthead />
      <main className="mx-auto flex max-w-site flex-col gap-20 px-6 pt-12 pb-24 sm:gap-24">
        <section className="mx-auto flex w-full max-w-lead flex-col gap-20 sm:gap-24" aria-label="Latest writing">
          {lead ? <LeadStory {...openingOf(lead)} image={image} /> : <p className="text-[19px] text-slate italic">The first essay is on its way.</p>}

          {groups.length > 0 && (
            <div>
              <div className="section-label">
                <h2>Latest</h2>
              </div>
              {groups.map((g, i) => (
                <div key={i} className={i < groups.length - 1 ? "border-b border-rule" : ""}>
                  {g.kind === "posts" ? (
                    <PostRows items={g.items} />
                  ) : (
                    <NoteStream labelled notes={g.items.map((n) => viewablePost(n, viewer.hasAccess)) as never} />
                  )}
                </div>
              ))}
              <p className="mt-8 mb-0 text-[17px] text-slate italic">
                <Link href="/posts">All posts</Link>
                <span aria-hidden="true">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
                <Link href="/notes">All notes</Link>
              </p>
            </div>
          )}
        </section>

        <NewsletterBox />
      </main>
      <SiteFooter />
    </>
  );
}
