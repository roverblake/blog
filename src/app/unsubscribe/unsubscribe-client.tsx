"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { doUnsubscribe } from "@/app/actions/unsubscribe";
import { PageTitle } from "@/components/site/page-title";

/**
 * Unsubscribes as soon as the page opens in a browser. Doing it from the
 * browser (not on page load at the server) stops email security scanners,
 * which pre-open links, from unsubscribing people by accident.
 */
export function UnsubscribeClient({ token, list }: { token: string; list: string }) {
  const [state, setState] = useState<{ done: boolean; ok?: boolean; email?: string; listName?: string }>({ done: false });
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    doUnsubscribe(token, list).then((r) => setState({ done: true, ...r }));
  }, [token, list]);

  if (!state.done) return <PageTitle title="Unsubscribing…" />;
  if (!state.ok) return <PageTitle title="That link didn't work" subtitle="Reply to any email and we'll remove you by hand." />;
  return (
    <>
      <PageTitle title="You're unsubscribed" subtitle={`${state.email} won't receive ${state.listName} any more.`} />
      <p className="text-center text-[19px]">
        Changed your mind? You can{" "}
        <Link href="/subscribe" className="underline">
          subscribe again
        </Link>{" "}
        at any time.
      </p>
    </>
  );
}
