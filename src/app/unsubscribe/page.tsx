import { PageShell, PageTitle } from "@/components/site/page-shell";
import { UnsubscribeClient } from "./unsubscribe-client";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

/** One-click unsubscribe from the link in every email. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; list?: string }> }) {
  const { token, list = "all" } = await searchParams;
  return (
    <PageShell width="reading">
      {token ? <UnsubscribeClient token={token} list={list} /> : <PageTitle title="That link didn't work" />}
    </PageShell>
  );
}
