"use client";

import { useActionState, useId } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";

const LISTS = [
  { slug: "essays", name: "Essays", cadence: "Every other Monday" },
  { slug: "parish", name: "Letters to the Parish", cadence: "Sundays" },
] as const;

/**
 * Subscribe form. With `showLists` it shows the two newsletter checkboxes
 * (newsletter box, /subscribe); otherwise it subscribes to `defaultLists`
 * (subscriber gate).
 */
export function SubscribeForm({
  showLists = true,
  defaultLists = ["essays"],
  className = "",
}: {
  showLists?: boolean;
  defaultLists?: ("essays" | "parish")[];
  className?: string;
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: "idle" });
  const id = useId();

  if (state.status === "ok") {
    return (
      <p role="status" className={`text-[19px] leading-normal ${className}`}>
        {state.message ?? "Thank you."}
      </p>
    );
  }

  return (
    <form action={action} className={`flex flex-col gap-3.5 ${className}`}>
      {showLists ? (
        <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
          <legend className="sr-only">Newsletters</legend>
          {LISTS.map((l) => (
            <label key={l.slug} className="flex min-h-11 cursor-pointer items-start gap-3 text-left text-[18px] leading-[1.35]">
              <input
                type="checkbox"
                name="lists"
                value={l.slug}
                defaultChecked={defaultLists.includes(l.slug)}
                className="mt-[3px] h-5 w-5 shrink-0 accent-navy"
              />
              <span>
                <b className="font-semibold">{l.name}</b>
                <br />
                <span className="text-[16px] text-slate">{l.cadence}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        defaultLists.map((l) => <input key={l} type="hidden" name="lists" value={l} />)
      )}
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="inline-form">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="Your email address" />
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Subscribe"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="m-0 text-[16px] text-ink">
          {state.message}
        </p>
      )}
    </form>
  );
}
