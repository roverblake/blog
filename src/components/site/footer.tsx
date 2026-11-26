import Link from "next/link";
import { TAGLINE } from "@/lib/site";
import { AccountLinks } from "./account-links";

const year = () => new Date().getFullYear();
const ESV = "Scripture quotations from the ESV® Bible · esv.org";

const COLUMNS = [
  { label: "Read", links: [["Essays", "/essays"], ["Commonplace", "/commonplace"], ["Archive", "/archive"]] },
  { label: "Parish", links: [["Letters", "/letters"], ["Sermons", "/sermons"]] },
  { label: "About", links: [["About Blake", "/about"], ["Subscribe", "/subscribe"], ["Privacy", "/privacy"]] },
];

/** §4 black footer: name, tagline, link columns, © line, ESV credit. */
export function SiteFooter() {
  return (
    <footer className="bg-ink text-footer-text">
      <div className="mx-auto flex max-w-site flex-col gap-8 px-6 pt-12 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex flex-[1_1_260px] flex-col gap-2">
            <span className="font-display text-[32px] text-white">Blake Johnson</span>
            <span className="text-[17px] text-[#b5b9bf] italic">{TAGLINE}</span>
          </div>
          <nav aria-label="Footer" className="grid flex-[2_1_480px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6 text-[17px]">
            {COLUMNS.map((c) => (
              <div key={c.label} className="flex flex-col">
                <span className="mb-1 text-[13px] uppercase tracking-[0.2em] text-footer-label">{c.label}</span>
                {c.links.map(([label, href]) => (
                  <Link key={href} href={href} className="inline-flex min-h-11 items-center text-footer-text hover:text-white hover:underline">
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-footer-rule pt-4 text-[14px] text-footer-muted">
          <span>© {year()} Blake Johnson</span>
          <span className="inline-flex flex-wrap gap-3">
            <span>{ESV}</span>
            <span aria-hidden="true">·</span>
            <AccountLinks />
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Post page footer (compact). */
export function CompactFooter() {
  return (
    <footer className="bg-ink text-footer-text">
      <div className="mx-auto flex max-w-site flex-wrap items-baseline justify-between gap-3 px-6 py-8">
        <Link href="/" className="font-display text-[26px] text-white hover:text-white">
          Blake Johnson
        </Link>
        <span className="text-[14px] text-footer-muted">
          © {year()} Blake Johnson · {ESV} ·{" "}
          <Link href="/privacy" className="text-footer-muted hover:text-white hover:underline">
            Privacy
          </Link>{" "}
          · <AccountLinks />
        </span>
      </div>
    </footer>
  );
}
