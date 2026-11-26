import type { Metadata } from "next";
import { PageShell, PageTitle } from "@/components/site/page-shell";
import { SubscribeForm } from "@/components/site/subscribe-form";

export const metadata: Metadata = { title: "Subscribe", alternates: { canonical: "/subscribe" } };

export default function SubscribePage() {
  return (
    <PageShell width="reading">
      <PageTitle
        kicker="Newsletters"
        title="Read along, free"
        subtitle="Choose what arrives in your inbox. Subscribers can read every essay and the full archive."
      />
      <div className="bg-warm p-6 sm:p-10">
        <SubscribeForm />
      </div>
    </PageShell>
  );
}
