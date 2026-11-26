import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import "./studio.css";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };

const LINKS = [
  ["/studio", "Posts"],
  ["/studio/subscribers", "Subscribers"],
  ["/studio/settings", "Settings"],
];

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="studio min-h-screen bg-[#f7f6f3] text-ink">
      <header className="border-b border-rule bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-6">
            <Link href="/studio" className="font-display text-[22px]">
              Studio
            </Link>
            <nav aria-label="Studio" className="flex gap-5 text-[13px] uppercase tracking-[0.14em]">
              {LINKS.map(([href, label]) => (
                <Link key={href} href={href} className="inline-flex min-h-12 items-center">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-[15px] text-slate italic">
            View site →
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
