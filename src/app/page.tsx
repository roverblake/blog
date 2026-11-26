import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { LeadStory } from "@/components/site/lead-story";
import { Masthead } from "@/components/site/masthead";
import { NewsletterBox } from "@/components/site/newsletter-box";
import { PostRows } from "@/components/site/post-rows";
import { getImage, getLeadPost, listPosts, openingOf } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lead = await getLeadPost();
  const [image, latest] = await Promise.all([
    getImage(lead?.headerImageId ?? null),
    listPosts({ excludeIds: lead ? [lead.id] : [], limit: 5 }),
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

        <NewsletterBox />

      </main>
      <SiteFooter />
    </>
  );
}
