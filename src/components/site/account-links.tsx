import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { SignOutButton } from "./sign-out-button";

/** Quiet footer links: Sign in, or Studio / Sign out when signed in. */
export async function AccountLinks() {
  const viewer = await getViewer();
  const cls = "text-footer-muted hover:text-white hover:underline";
  if (!viewer.email) {
    return (
      <Link href="/sign-in" className={cls}>
        Sign in
      </Link>
    );
  }
  return (
    <span className="inline-flex gap-3">
      {viewer.isAdmin && (
        <Link href="/studio" className={cls}>
          Studio
        </Link>
      )}
      <SignOutButton className={`${cls} cursor-pointer bg-transparent p-0`} />
    </span>
  );
}
