import Link from "next/link";
import { getFooterContent } from "@/lib/footer-content";
import { getSiteIdentity } from "@/lib/site-identity";
import { AccountLinks } from "./account-links";

const year = () => new Date().getFullYear();
/** §4 footer: name, tagline, link columns, © line, credit line (columns and credit edited in Studio → Settings). */
export async function SiteFooter() {
  const [site, footer] = await Promise.all([getSiteIdentity(), getFooterContent()]);
  return (
    <footer className="border-t border-rule bg-white text-footer-text">
      <div className="mx-auto flex max-w-site flex-col gap-8 px-6 pt-12 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex flex-[1_1_260px] flex-col gap-2">
            <span className="font-display text-[32px] text-ink">{site.title}</span>
            <span className="text-[17px] text-subtle italic">{site.tagline}</span>
          </div>
          <nav aria-label="Footer" className="grid flex-[2_1_480px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6 text-[17px]">
            {footer.columns.map((c, ci) => (
              <div key={ci} className="flex flex-col">
                {c.heading && <span className="mb-1 text-[13px] uppercase tracking-[0.2em] text-footer-label">{c.heading}</span>}
                {c.links.map(({ label, href }, li) => (
                  <Link key={li} href={href} className="inline-flex min-h-11 items-center text-footer-text hover:text-ink hover:underline">
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-footer-rule pt-4 text-[14px] text-footer-muted">
          <span>© {year()} {site.title}</span>
          <span className="inline-flex flex-wrap gap-3">
            {footer.credit && (
              <>
                <span>{footer.credit}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <AccountLinks />
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Post page footer (compact). */
export async function CompactFooter() {
  const [site, footer] = await Promise.all([getSiteIdentity(), getFooterContent()]);
  return (
    <footer className="border-t border-rule bg-white text-footer-text">
      <div className="mx-auto flex max-w-site flex-wrap items-baseline justify-between gap-3 px-6 py-8">
        <Link href="/" className="font-display text-[26px] text-ink hover:text-ink">
          {site.title}
        </Link>
        <span className="text-[14px] text-footer-muted">
          © {year()} {site.title} · {footer.credit ? `${footer.credit} · ` : ""}
          <Link href="/privacy" className="text-footer-muted hover:text-ink hover:underline">
            Privacy
          </Link>{" "}
          · <AccountLinks />
        </span>
      </div>
    </footer>
  );
}
