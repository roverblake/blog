"use client";

import { useState } from "react";

/** End-of-post sharing: copy the link, or open an email. No outside scripts. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const chip = "inline-flex min-h-11 items-center border border-rule px-3 text-ink no-underline sm:min-h-0 sm:py-1";
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-[15px] leading-normal">
      <span className="mr-1.5 uppercase tracking-[0.16em] text-slate">Share</span>
      <button
        type="button"
        className={chip}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link:", url);
          }
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a className={chip} href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>
        Email
      </a>
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </div>
  );
}
