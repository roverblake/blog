"use client";

import { useState } from "react";

/** End-of-post sharing: copy the link, or open an email. No outside scripts. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const link = "inline-flex min-h-11 items-center text-ink no-underline hover:underline sm:min-h-0";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-[17px] leading-normal">
      <span className="mr-1 text-[13px] uppercase tracking-[0.16em] text-slate">Share</span>
      <button
        type="button"
        className={`${link} cursor-pointer border-0 bg-transparent p-0 font-[inherit]`}
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
      <span aria-hidden="true" className="text-slate">·</span>
      <a className={link} href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>
        Email
      </a>
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </div>
  );
}
