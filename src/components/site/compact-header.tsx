import Link from "next/link";
import { NAV } from "./nav";

/** §4 post page header: name left, nav right, over a double rule. */
export function CompactHeader() {
  return (
    <header className="border-b-[3px] border-ink [border-bottom-style:double]">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-3.5">
        <Link href="/" className="font-display text-[28px] leading-none sm:text-[34px]">
          Blake Johnson
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-7 text-[14px] uppercase tracking-[0.18em]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center">
              {n.short}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
