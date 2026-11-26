import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { getSiteIdentity } from "@/lib/site-identity";
import { fontVariables } from "./fonts";
import "./globals.css";

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
