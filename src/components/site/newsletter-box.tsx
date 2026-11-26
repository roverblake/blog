import { SubscribeForm } from "./subscribe-form";

/** §4 newsletter box (warm grey) with Essays / Letters checkboxes. */
export function NewsletterBox() {
  return (
    <section id="subscribe" aria-labelledby="newsletter-heading" className="flex scroll-mt-6 flex-wrap items-center gap-10 bg-warm p-6 sm:p-10">
      <div className="flex flex-[1_1_320px] flex-col gap-2.5">
        <div className="kicker">Newsletters</div>
        <h2 id="newsletter-heading" className="m-0 font-display text-[32px] leading-[1.1] font-normal sm:text-[38px]">
          Read along, free
        </h2>
        <p className="m-0 text-[19px] leading-normal text-subtle">
          Choose what arrives in your inbox. Subscribers can read every essay and the full archive.
        </p>
      </div>
      <SubscribeForm className="flex-[1_1_380px]" />
    </section>
  );
}
