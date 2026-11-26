import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { SignOutButton } from "./sign-out-button";

/** §4 black top strip: section line, Sign in, navy Subscribe. */
export async function TopStrip({ subscribeHref = "/subscribe" }: { subscribeHref?: string }) {
  const viewer = await getViewer();
  const item = "inline-flex min-h-11 items-center text-white hover:text-white hover:underline";
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-3 px-6 text-[13px] uppercase tracking-[0.14em] sm:text-[14px]">
        <span className="hidden py-2 sm:inline">Essays · Notes · Letters · Sermons</span>
        <div className="flex items-center gap-5">
          {viewer.isAdmin && (
            <Link href="/studio" className={item}>
              Studio
            </Link>
          )}
          {viewer.email ? (
            <SignOutButton className={`${item} cursor-pointer bg-transparent uppercase tracking-[0.14em]`} />
          ) : (
            <Link href="/sign-in" className={item}>
              Sign in
            </Link>
          )}
          {!viewer.hasAccess && (
            <Link
              href={subscribeHref}
              className="my-1.5 inline-flex min-h-9 items-center bg-navy px-3.5 text-white hover:text-white"
            >
              Subscribe
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
