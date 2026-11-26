import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Blake Johnson", template: "%s · Blake Johnson" },
  description: "Reading, thinking, and writing in the light of faith",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  openGraph: { siteName: "Blake Johnson", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
