import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CompactHeader } from "@/components/site/compact-header";
import { CompactFooter } from "@/components/site/footer";
import { PostArticle } from "@/components/site/post-article";
import { TopStrip } from "@/components/site/top-strip";
import { getImage, getMoreToRead, getPostTags, getPublishedPost, viewablePost } from "@/lib/posts";
import { postPath, typeFromPath } from "@/lib/urls";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

type Params = Promise<{ section: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  const image = await getImage(post.headerImageId);
  const description = post.summary || post.subtitle || undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: postPath(post) },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: postPath(post),
      publishedTime: post.publishedAt?.toISOString(),
      images: image ? [{ url: image.src, alt: image.alt }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { section, slug } = await params;
  const type = typeFromPath(section);
  if (!type) notFound();
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  // If the post's type changed, send readers to its current address.
  if (post.type !== type) permanentRedirect(postPath(post));

  const [viewer, image, tags, more] = await Promise.all([
    getViewer(),
    getImage(post.headerImageId),
    getPostTags(post.id),
    getMoreToRead(post.id),
  ]);

  return (
    <>
      <TopStrip />
      <CompactHeader />
      <main>
        <PostArticle {...viewablePost(post, viewer.hasAccess)} image={image} tags={tags} more={more} />
      </main>
      <CompactFooter />
    </>
  );
}
