import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { PostRows } from "@/components/site/post-rows";
import { getTag, listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const tag = await getTag((await params).slug);
  return tag ? { title: tag.name, alternates: { canonical: `/tags/${tag.slug}` } } : {};
}

export default async function TagPage({ params }: { params: Params }) {
  const tag = await getTag((await params).slug);
  if (!tag) notFound();
  const items = await listPosts({ tagSlug: tag.slug, limit: 500 });
  return (
    <PageShell>
      <section aria-labelledby="tag-heading">
        <div className="section-label">
          <h1 id="tag-heading">Filed under: {tag.name}</h1>
          <Link href={`/archive?tag=${tag.slug}`}>Archive…</Link>
        </div>
        <PostRows items={items} withYear />
      </section>
    </PageShell>
  );
}
