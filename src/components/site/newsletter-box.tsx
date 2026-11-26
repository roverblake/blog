import { getListOptions, getNewsletterCopy } from "@/lib/newsletter-copy";
import { SubscribeForm } from "./subscribe-form";

/**
 * Newsletter box: a quiet, compact signup between thin rules. Wording and
 * choices are edited in Studio → Settings (Nov 25 amendment).
 */
export async function NewsletterBox() {
  const [copy, options] = await Promise.all([getNewsletterCopy(), getListOptions()]);
  const lists = options.filter((o) => o.show);
  if (!lists.length) return null;
  return (
    <section
      id="subscribe"
      aria-labelledby="newsletter-heading"
      className="mx-auto flex w-full max-w-lead scroll-mt-6 flex-col gap-3 border-t border-b border-rule py-7"
    >
      <div className="kicker">{copy.label}</div>
      <h2 id="newsletter-heading" className="m-0 font-display text-[24px] leading-[1.2] font-normal sm:text-[26px]">
        {copy.heading}
      </h2>
      {copy.body && <p className="m-0 max-w-reading text-[17px] leading-normal text-subtle">{copy.body}</p>}
      <SubscribeForm compact lists={lists} buttonLabel={copy.button} className="mt-1 max-w-reading" />
    </section>
  );
}
