"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/studio", "Posts"],
  ["/studio/subscribers", "Subscribers"],
  ["/studio/settings", "Settings"],
] as const;

/**
 * Left-hand dashboard menu, as in Substack. Hidden while writing, so the
 * editor has the whole screen.
 */
export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/studio/posts/")) return <>{children}</>;
  return (
    <div className="flex min-h-[calc(100vh-36px)] flex-col md:flex-row">
      <aside className="border-b border-[var(--ui-border)] bg-[#faf9f7] md:sticky md:top-0 md:h-screen md:w-[232px] md:flex-none md:border-r md:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:flex-col md:items-stretch md:py-6">
          <Link href="/studio" className="px-3 font-display text-[22px] leading-none text-ink md:mb-6">
            Blake Johnson
          </Link>
          <nav aria-label="Studio" className="flex gap-1 md:flex-col">
            {LINKS.map(([href, label]) => {
              const active = href === "/studio" ? path === "/studio" : path.startsWith(href);
              return (
                <Link key={href} href={href} className="s-nav-link" aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="s-nav-link text-slate md:mt-6">
            View site ↗
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-white">{children}</div>
    </div>
  );
}
