import { db, schema } from "@/db";
import { getAboutDoc, getSetting } from "@/lib/settings";
import { getListOptions, getNewsletterCopy } from "@/lib/newsletter-copy";
import { getSiteIdentity } from "@/lib/site-identity";
import { getFooterContent } from "@/lib/footer-content";
import { AboutEditor, DictionaryList, FooterForm, MailingAddressForm, NewsletterBoxForm, SiteIdentityForm } from "./client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [address, about, words, copy, options, site, footer] = await Promise.all([
    getSetting<string>("mailingAddress", ""),
    getAboutDoc(),
    db.select({ word: schema.dictionaryWords.word }).from(schema.dictionaryWords).orderBy(schema.dictionaryWords.word),
    getNewsletterCopy(),
    getListOptions(),
    getSiteIdentity(),
    getFooterContent(),
  ]);
  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 py-8">
      <h1 className="s-h1">Settings</h1>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="site-h">
        <h2 id="site-h" className="s-panel-title m-0">Site name</h2>
        <SiteIdentityForm initial={site} />
      </section>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="email-h">
        <h2 id="email-h" className="s-panel-title m-0">Emails</h2>
        <MailingAddressForm initial={address} />
      </section>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="nl-h">
        <h2 id="nl-h" className="s-panel-title m-0">Signup box</h2>
        <NewsletterBoxForm initialCopy={copy} initialOptions={options} />
      </section>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="footer-h">
        <h2 id="footer-h" className="s-panel-title m-0">Footer</h2>
        <FooterForm initial={footer} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="about-h">
        <h2 id="about-h" className="s-panel-title m-0">About page</h2>
        <AboutEditor initial={about as never} />
      </section>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="dict-h">
        <h2 id="dict-h" className="s-panel-title m-0">Personal dictionary</h2>
        <DictionaryList words={words.map((w) => w.word)} />
      </section>

      <section className="s-panel flex flex-col gap-3" aria-labelledby="data-h">
        <h2 id="data-h" className="s-panel-title m-0">Your data</h2>
        <p className="m-0 text-[16px]">
          Download everything: every post as a Markdown file, all images, and your subscribers as a spreadsheet (CSV), in one zip file.
        </p>
        <div>
          <a download className="s-btn s-btn-primary" href="/studio/export">Export everything</a>
        </div>
        <p className="m-0 text-[15px] text-slate">
          Reminder: turn on daily backups for your database in Railway (open the Postgres service, then Backups). See the README for steps.
        </p>
      </section>
    </main>
  );
}
