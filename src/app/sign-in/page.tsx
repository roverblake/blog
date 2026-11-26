import { PageShell, PageTitle } from "@/components/site/page-shell";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <PageShell width="reading">
      <PageTitle title="Sign in" subtitle="Enter your email and we'll send you a link. No password needed." />
      <SignInForm next={safeNext} />
    </PageShell>
  );
}
