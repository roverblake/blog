import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { getSiteIdentity } from "@/lib/site-identity";
import { fontVariables } from "./fonts";
import "./globals.css";

// Read the site name from the database on every request, never at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteIdentity();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: site.title, template: `%s · ${site.title}` },
    description: site.tagline,
    alternates: { types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { siteName: site.title, type: "website" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
