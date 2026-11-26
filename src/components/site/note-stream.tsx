import Link from "next/link";
import { ArticleBody } from "@/components/article-body";
import type { Doc } from "@/lib/content/types";
import { noteDate } from "@/lib/dates";
import { postPath } from "@/lib/urls";

type NoteItem = {
  post: { id: string; type: "commonplace" | "essay" | "parish_letter" | "sermon"; slug: string; publishedAt: Date | null };
  doc: Doc;
  truncated: boolean;
};

/**
 * Notes shown as a quiet stream: the day and date (linking to the note's own
 * page), then the note itself. Each doc has already been gated on the server.
 */
export function NoteStream({ notes }: { notes: NoteItem[] }) {
  if (!notes.length) return <p className="py-6 text-[18px] text-slate italic">No notes yet.</p>;
  return (
    <div>
      {notes.map(({ post, doc, truncated }) => (
        <article key={post.id} className="border-b border-rule py-8 last:border-b-0">
          <Link href={postPath(post)} className="text-[13px] uppercase tracking-[0.18em] text-label hover:text-navy">
            {post.publishedAt ? noteDate(post.publishedAt) : "Note"}
          </Link>
          {(doc.content?.length ?? 0) > 0 && (
            <div className="article-body note-body mt-4">
              <ArticleBody doc={doc} dropCap={false} fadeLast={truncated} />
            </div>
          )}
          {truncated && (
            <Link href={postPath(post)} className="continue-link mt-3 inline-block text-[17px] italic">
              For subscribers · Continue reading →
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
