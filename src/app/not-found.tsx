import Link from "next/link";
import { PageShell, PageTitle } from "@/components/site/page-shell";

export default function NotFound() {
  return (
    <PageShell width="reading">
      <PageTitle title="Page not found" subtitle="The page you were looking for isn't here." />
      <p className="text-center text-[19px]">
        Try the <Link href="/archive" className="underline">archive</Link> or go back to the <Link href="/" className="underline">front page</Link>.
      </p>
    </PageShell>
  );
}
