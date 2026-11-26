import type { Metadata } from "next";
import { ArticleBody } from "@/components/article-body";
import { PageShell, PageTitle } from "@/components/site/page-shell";
import { getAboutDoc } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

/** About page; its text is edited in the Studio (Settings). */
export default async function AboutPage() {
  const doc = await getAboutDoc();
  return (
    <PageShell width="reading">
      <PageTitle title="About" />
      <div className="article-body">
        {(doc.content?.length ?? 0) > 0 ? (
          <ArticleBody doc={doc} dropCap={false} />
        ) : (
          <p className="text-slate italic">This page is being written.</p>
        )}
      </div>
    </PageShell>
  );
}
