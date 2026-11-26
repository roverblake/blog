import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blake Johnson",
  description: "Essays, commonplace notes, and letters to the parish.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
