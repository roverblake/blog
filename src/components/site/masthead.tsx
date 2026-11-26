import Link from "next/link";
import { getSiteIdentity } from "@/lib/site-identity";
import { TaperedRule } from "./fleuron-rule";
import { NAV } from "./nav";

/** Homepage masthead: name, italic tagline, and a short tapered rule (Nov 25 amendment). */
export async function Masthead() {
  const site = await getSiteIdentity();
  return (
    <header>
      <div className="mx-auto max-w-site px-6 pt-12 text-center">
        <h1 className="m-0 font-display text-[52px] leading-none font-normal tracking-[0.01em] sm:text-[72px] lg:text-[88px]">
          <Link href="/" className="hover:text-ink">
            {site.title}
          </Link>
        </h1>
        <p className="mx-auto mt-3.5 text-[17px] text-subtle italic sm:text-[19px]">{site.tagline}</p>
        <TaperedRule className="mt-7" />
        <nav aria-label="Main" className="mt-2 flex flex-wrap justify-center gap-x-6 text-[13px] uppercase tracking-[0.2em] text-slate">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center text-slate hover:text-ink">
              {n.short}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
