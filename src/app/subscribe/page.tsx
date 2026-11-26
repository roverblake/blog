import type { Metadata } from "next";
import { PageShell, PageTitle } from "@/components/site/page-shell";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { getListOptions, getNewsletterCopy } from "@/lib/newsletter-copy";

export const metadata: Metadata = { title: "Subscribe", alternates: { canonical: "/subscribe" } };
export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const [copy, options] = await Promise.all([getNewsletterCopy(), getListOptions()]);
  const shown = options.filter((o) => o.show);
  return (
    <PageShell width="reading">
      <PageTitle kicker={copy.label} title={copy.heading} subtitle={copy.body} />
      <SubscribeForm lists={shown.length ? shown : options} buttonLabel={copy.button} />
    </PageShell>
  );
}
