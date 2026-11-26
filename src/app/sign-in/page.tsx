import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in · Blake Johnson" };

// Layout and styling to follow docs/design-spec.md once it is filled in.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main>
      <h1>Sign in</h1>
      <p>Enter your email and we&apos;ll send you a link to sign in. No password needed.</p>
      <SignInForm next={safeNext} />
    </main>
  );
}
