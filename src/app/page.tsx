import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { LeadStory } from "@/components/site/lead-story";
import { Masthead } from "@/components/site/masthead";
import { NewsletterBox } from "@/components/site/newsletter-box";
import { PostRows } from "@/components/site/post-rows";
import { getImage, getLeadPost, listPosts, openingOf, POST_TYPES } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lead = await getLeadPost();
  const [image, latest] = await Promise.all([
    getImage(lead?.headerImageId ?? null),
    listPosts({ type: POST_TYPES, excludeIds: lead ? [lead.id] : [], limit: 5 }),
  ]);

  return (
    <>
      <Masthead />
      <main className="mx-auto flex max-w-site flex-col gap-20 px-6 pt-12 pb-24 sm:gap-24">
        <section className="mx-auto flex w-full max-w-lead flex-col gap-20 sm:gap-24" aria-label="Latest writing">
          {lead ? <LeadStory {...openingOf(lead)} image={image} /> : <p className="text-[19px] text-slate italic">The first essay is on its way.</p>}

          {latest.length > 0 && (
            <div>
              <div className="section-label">
                <h2>Latest</h2>
                <Link href="/posts">All posts</Link>
              </div>
              <PostRows items={latest} />
            </div>
          )}
        </section>

        <NewsletterBox />
      </main>
      <SiteFooter />
    </>
  );
}
