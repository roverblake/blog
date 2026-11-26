import Link from "next/link";
import { longDate } from "@/lib/dates";
import { TAGLINE } from "@/lib/site";
import { NAV } from "./nav";

/** §4 homepage masthead: date line, name, italic tagline, ruled nav. */
export function Masthead() {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto max-w-site px-6 pt-9 text-center">
        <div className="text-[12px] uppercase tracking-[0.3em] text-slate sm:text-[14px]">{longDate(new Date())}</div>
        <h1 className="mt-3.5 font-display text-[52px] leading-none font-normal tracking-[0.01em] sm:text-[72px] lg:text-[88px]">
          <Link href="/" className="hover:text-ink">
            Blake Johnson
          </Link>
        </h1>
        <p className="mx-auto mt-3.5 text-[17px] text-subtle italic sm:text-[19px]">{TAGLINE}</p>
        <nav
          aria-label="Main"
          className="mt-6 flex flex-wrap justify-center gap-x-8 border-t border-b-[3px] border-t-ink border-b-ink py-0.5 text-[14px] uppercase tracking-[0.18em] [border-bottom-style:double] sm:text-[15px]"
        >
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
