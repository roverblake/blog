import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { listAllTags } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const tags = await listAllTags();
  return (
    <PageShell>
      <section aria-labelledby="tags-heading">
        <div className="section-label">
          <h1 id="tags-heading">Tags</h1>
        </div>
        <ul>
          {tags.map((t) => (
            <li key={t.slug}>
              <Link href={`/tags/${t.slug}`} className="flex items-baseline justify-between border-b border-rule py-3.5">
                <span className="font-caslon text-[20px]">{t.name}</span>
                <span className="text-[16px] text-slate">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
