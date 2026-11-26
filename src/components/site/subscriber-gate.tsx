import Link from "next/link";
import { SubscribeForm } from "./subscribe-form";

/** §4.5 subscriber gate panel, shown after the faded text. */
export function SubscriberGate({ list, returnTo }: { list: "essays" | "parish"; returnTo: string }) {
  return (
    <section
      aria-labelledby="gate-heading"
      className="mt-2 flex flex-col items-center gap-3.5 border-t border-ink bg-warm px-6 py-9 text-center sm:px-8"
    >
      <div className="kicker">For subscribers</div>
      <h2 id="gate-heading" className="m-0 font-display text-[28px] font-normal sm:text-[32px]">
        Subscribe to keep reading
      </h2>
      <p className="m-0 max-w-[440px] text-[18px] leading-normal text-subtle">
        It&apos;s free. You&apos;ll get every essay by email and the full archive.
      </p>
      <SubscribeForm showLists={false} defaultLists={[list]} className="mt-1.5 w-full max-w-[440px]" />
      <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center text-[16px] text-slate italic no-underline">
        Already subscribed? Sign in
      </Link>
    </section>
  );
}
