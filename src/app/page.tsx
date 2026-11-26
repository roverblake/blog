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

export default async function Home() {
  const lead = await getLeadPost();
  const [image, latest, notes, viewer] = await Promise.all([
    getImage(lead?.headerImageId ?? null),
    listPosts({ type: POST_TYPES, excludeIds: lead ? [lead.id] : [], limit: 5 }),
    listNotes(3),
    getViewer(),
  ]);

  return (
    <>
      <Masthead />
      <main className="mx-auto flex max-w-site flex-col gap-12 px-6 pt-9 pb-16">
        <section className="mx-auto flex w-full max-w-lead flex-col gap-11" aria-label="Latest writing">
          {lead ? <LeadStory {...openingOf(lead)} image={image} /> : <p className="text-[19px] text-slate italic">The first essay is on its way.</p>}

          <div>
            <div className="section-label">
              <h2>Recent</h2>
              <Link href="/archive">More…</Link>
            </div>
            <PostRows items={latest} />
          </div>
        </section>

        {notes.length > 0 && (
          <section className="mx-auto w-full max-w-lead" aria-labelledby="notes-heading">
            <div className="section-label">
              <h2 id="notes-heading">Notes</h2>
              <Link href="/notes">More…</Link>
            </div>
            <NoteStream notes={notes.map((n) => viewablePost(n, viewer.hasAccess)) as never} />
          </section>
        )}

        <NewsletterBox />

      </main>
      <SiteFooter />
    </>
  );
}
