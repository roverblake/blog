import Link from "next/link";
import { DropCapParagraph } from "@/components/article-body";
import type { Paragraph } from "@/lib/content/types";
import { shortDate } from "@/lib/dates";
import type { Image } from "@/lib/posts";
import type { posts } from "@/db/schema";
import { postPath, TYPE_LABEL } from "@/lib/urls";

type PostMeta = Omit<typeof posts.$inferSelect, "content" | "contentText">;

/** §4 homepage lead story: one centered column, 2:1 image, drop-cap teaser. */
export function LeadStory({ post, opening, image }: { post: PostMeta; opening: Paragraph | null; image: Image | null }) {
  const href = postPath(post);
  const date = post.publishedAt ?? post.updatedAt;

  return (
    <article className="flex min-w-0 flex-col gap-4">
      {image && (
        <Link href={href} aria-label={`Read ${post.title}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 860px) 812px, 100vw"
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="block aspect-[2/1] w-full object-cover"
            fetchPriority="high"
          />
        </Link>
      )}
      <div className="kicker font-semibold">{post.kicker || TYPE_LABEL[post.type]}</div>
      <h2 className="m-0 font-display text-[40px] leading-[1.05] font-normal sm:text-[54px]">
        <Link href={href}>{post.title}</Link>
      </h2>
      {post.subtitle && <p className="m-0 text-[20px] leading-[1.4] text-subtle italic sm:text-[24px]">{post.subtitle}</p>}
      <div className="text-[14px] uppercase tracking-[0.12em] text-slate sm:text-[16px]">
        by <Link href="/about" className="text-ink">Blake Johnson</Link> · {shortDate(date)}
        {post.visibility === "subscribers" && <> · Subscribers</>}
      </div>
      <div className="article-body mt-1.5">
        {opening ? (
          <DropCapParagraph
            p={opening}
            ctx={{ footnotes: [] }}
            after={
              <>
                {" "}
                <Link href={href} className="continue-link no-underline">
                  Continue reading →
                </Link>
              </>
            }
          />
        ) : (
          <p>
            <Link href={href} className="continue-link no-underline">
              {post.visibility === "subscribers" ? "For subscribers · Continue reading →" : "Continue reading →"}
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
