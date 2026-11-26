import Link from "next/link";
import { PageShell, PageTitle } from "@/components/site/page-shell";
import { unsubscribeByToken } from "@/lib/subscriptions";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe", robots: { index: false } };

/** One-click unsubscribe from the link in every email. */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; list?: string }>;
}) {
  const { token, list = "all" } = await searchParams;
  const result = token ? await unsubscribeByToken(token, list) : null;
  const listName =
    list === "all" ? "all newsletters" : (await db.select().from(schema.lists).where(eq(schema.lists.slug, list)).limit(1))[0]?.name;

  return (
    <PageShell width="reading">
      {result ? (
        <>
          <PageTitle title="You're unsubscribed" subtitle={`${result.email} won't receive ${listName ?? "this newsletter"} any more.`} />
          <p className="text-center text-[19px]">
            Changed your mind? You can <Link href="/subscribe" className="underline">subscribe again</Link> at any time.
          </p>
        </>
      ) : (
        <PageTitle title="That link didn't work" subtitle="Reply to any email and we'll remove you by hand." />
      )}
    </PageShell>
  );
}
