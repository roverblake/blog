import Link from "next/link";
import { PageShell, PageTitle } from "@/components/site/page-shell";
import { confirmSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm subscription", robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await confirmSubscription(token) : false;
  return (
    <PageShell width="reading">
      {ok ? (
        <>
          <PageTitle title="You're subscribed" subtitle="Thank you. New writing will arrive in your inbox." />
          <p className="text-center text-[19px]">
            To read subscriber-only posts on the site, <Link href="/sign-in" className="underline">sign in</Link> with the same email address.
          </p>
        </>
      ) : (
        <>
          <PageTitle title="That link didn't work" subtitle="It may have expired or already been used." />
          <p className="text-center text-[19px]">
            Please <Link href="/subscribe" className="underline">subscribe again</Link> and we&apos;ll send a fresh link.
          </p>
        </>
      )}
    </PageShell>
  );
}
