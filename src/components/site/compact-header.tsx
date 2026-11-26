import Link from "next/link";
import { getSiteIdentity } from "@/lib/site-identity";

/** §4 post page header: name only, over a double rule. */
export async function CompactHeader() {
  const site = await getSiteIdentity();
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-3.5">
        <Link href="/" className="font-display text-[28px] leading-none sm:text-[34px]">
          {site.title}
        </Link>
      </div>
    </header>
  );
}
