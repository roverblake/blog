import Link from "next/link";
import { ArticleBody } from "@/components/article-body";
import { readingMinutes } from "@/lib/content/text";
import type { Doc } from "@/lib/content/types";
import { fullDate } from "@/lib/dates";
import type { Image, PostListItem } from "@/lib/posts";
import type { posts } from "@/db/schema";
import { postPath, TYPE_LABEL } from "@/lib/urls";
import { MoreToRead } from "./post-rows";
import { SubscriberGate } from "./subscriber-gate";

/** A post without its full text; pass the gated document separately. */
export type PostMeta = Omit<typeof posts.$inferSelect, "content" | "contentText">;

/**
 * The public post layout (§4 Post page). It only ever receives the already
 * gated document (see viewablePost), so text past the paywall line cannot
 * reach readers without access. Also used by the Studio preview.
 */
export function PostArticle({
  post,
  doc,
  truncated,
  image,
  tags,
  more,
}: {
  post: PostMeta;
  doc: Doc;
  truncated: boolean;
  image: Image | null;
  tags: { name: string; slug: string }[];
  more: PostListItem[];
}) {
  const date = post.publishedAt ?? post.publishAt ?? post.updatedAt;
  const kicker = post.kicker || TYPE_LABEL[post.type];
  const minutes = readingMinutes(post.wordCount);

  return (
    <article>
      <div className="mx-auto flex max-w-title flex-col items-center gap-4.5 px-6 pt-12 pb-10 text-center sm:pt-16">
        <div className="text-[13px] uppercase tracking-[0.26em] text-slate sm:text-[14px]">{kicker}</div>
        <h1 className="m-0 font-display text-[44px] leading-[1.05] font-normal tracking-[-0.005em] sm:text-[60px] lg:text-[72px] lg:leading-[1.02]">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="m-0 max-w-[640px] text-[21px] leading-[1.4] text-subtle italic sm:text-[26px]">{post.subtitle}</p>
        )}
        <div className="my-1.5 h-px w-12 bg-ink" aria-hidden="true" />
        <div className="text-[13px] uppercase tracking-[0.16em] text-slate sm:text-[15px]">
          by <span className="text-ink">Blake Johnson</span> · <time dateTime={date.toISOString()}>{fullDate(date)}</time> · {minutes}{" "}
          min read
        </div>
      </div>

      {image && (
        <figure className="mx-auto box-border max-w-site px-0 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 1180px) 1132px, 100vw"
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="block aspect-[21/9] w-full object-cover"
            fetchPriority="high"
          />
          {(post.headerCaption || post.headerCredit) && (
            <figcaption className="caption-row px-6 sm:px-0">
              <span className="caption">{post.headerCaption}</span>
              {post.headerCredit && <span className="credit">{post.headerCredit}</span>}
            </figcaption>
          )}
        </figure>
      )}

      <div className="article-body mx-auto max-w-reading px-6 pt-12 pb-6">
        <ArticleBody doc={doc} dropCap={post.type === "essay"} fadeLast={truncated} />

        {truncated && <SubscriberGate list={post.type === "parish_letter" ? "parish" : "essays"} returnTo={postPath(post)} />}

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-rule pt-4.5 text-[15px] leading-normal">
            <span className="mr-1.5 uppercase tracking-[0.16em] text-slate">Filed under</span>
            {tags.map((t) => (
              <Link key={t.slug} href={`/tags/${t.slug}`} className="inline-flex min-h-11 items-center border border-rule px-3 no-underline sm:min-h-0 sm:py-1">
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <MoreToRead items={more} />
    </article>
  );
}
