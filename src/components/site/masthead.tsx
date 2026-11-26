import Link from "next/link";
import { longDate } from "@/lib/dates";
import { TAGLINE } from "@/lib/site";

/** §4 homepage masthead: date line, name, italic tagline, no menu bar (Nov 25 amendment). */
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
        <p className="mx-auto mt-3.5 pb-8 text-[17px] text-subtle italic sm:text-[19px]">{TAGLINE}</p>
      </div>
    </header>
  );
}
