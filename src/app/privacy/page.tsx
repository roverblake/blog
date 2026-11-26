import type { Metadata } from "next";
import { PageShell, PageTitle } from "@/components/site/page-shell";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <PageShell width="reading">
      <PageTitle title="Privacy" subtitle="What this site keeps about you, in plain words" />
      <div className="article-body">
        <h2>What we store</h2>
        <p>
          If you subscribe, we store your email address, which newsletters you chose, and when you subscribed. That is all. We
          don&apos;t ask for your name, and we don&apos;t sell, share or rent your address to anyone.
        </p>
        <h2>Signing in</h2>
        <p>
          When you sign in, we email you a one-time link. Clicking it sets a small cookie so the site remembers you are signed in.
          It is used for nothing else.
        </p>
        <h2>No tracking</h2>
        <p>
          This site has no advertising, no third-party analytics and no tracking pixels. Our email provider, Resend, may count
          whether a newsletter was opened, so we can see roughly how many people read it.
        </p>
        <h2>How to unsubscribe</h2>
        <p>
          Every email has an unsubscribe link at the bottom. One click removes you from that newsletter straight away. You can
          also reply to any email and ask to be removed entirely, and we will delete your address.
        </p>
        <h2>Who runs this site</h2>
        <p>
          Blake Johnson. Emails are sent with Resend and the site runs on Railway, who process data only to deliver the service.
        </p>
      </div>
    </PageShell>
  );
}
