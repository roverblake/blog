import Link from "next/link";
import { notFound } from "next/navigation";
import { CompactHeader } from "@/components/site/compact-header";
import { CompactFooter } from "@/components/site/footer";
import { PostArticle } from "@/components/site/post-article";
import { getImage, getMoreToRead, getPostById, getPostTags, viewablePost } from "@/lib/posts";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Exact public look of a post (any status). ?as=visitor shows what non-subscribers see. */
export default async function PreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ as?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { as } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const post = await getPostById(id);
  if (!post) notFound();
  const asVisitor = as === "visitor";
  const [image, tags, more] = await Promise.all([getImage(post.headerImageId), getPostTags(post.id), getMoreToRead(post.id)]);

  return (
    <div className="bg-white">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-navy px-6 py-2 text-[14px] text-white">
        <span>
          Preview{post.status !== "published" ? " · not yet published" : ""} · showing what {asVisitor ? "non-subscribers" : "subscribers"} see
        </span>
        <span className="flex gap-4">
          {post.visibility === "subscribers" && (
            <Link className="text-white underline hover:text-white" href={`?as=${asVisitor ? "subscriber" : "visitor"}`}>
              Show as {asVisitor ? "subscriber" : "non-subscriber"}
            </Link>
          )}
          <Link className="text-white underline hover:text-white" href={`/studio/posts/${post.id}`}>
            Back to editing
          </Link>
        </span>
      </div>
      <CompactHeader />
      <main>
        <PostArticle {...viewablePost(post, !asVisitor)} image={image} tags={tags} more={more} />
      </main>
      <CompactFooter />
    </div>
  );
}
