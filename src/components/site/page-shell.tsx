import { CompactHeader } from "./compact-header";
import { SiteFooter } from "./footer";
import { TopStrip } from "./top-strip";

/** Standard inner-page frame: top strip, compact header, footer. */
export function PageShell({ children, width = "lead" }: { children: React.ReactNode; width?: "lead" | "reading" }) {
  return (
    <>
      <TopStrip />
      <CompactHeader />
      <main className={`mx-auto flex ${width === "lead" ? "max-w-lead" : "max-w-reading"} flex-col gap-12 px-6 pt-12 pb-16`}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export { PageTitle } from "./page-title";
