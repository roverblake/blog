"use client";

import { useActionState, useId } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";

export type FormList = { slug: "essays" | "parish"; name: string; cadence: string; checked: boolean };

const FALLBACK: FormList[] = [
  { slug: "essays", name: "Essays", cadence: "Every other Monday", checked: true },
  { slug: "parish", name: "Letters to the Parish", cadence: "Sundays", checked: false },
];

/**
 * Subscribe form. With `showLists` it shows the two newsletter checkboxes
 * (newsletter box, /subscribe); otherwise it subscribes to `defaultLists`
 * (subscriber gate).
 */
export function SubscribeForm({
  showLists = true,
  defaultLists = ["essays"],
  lists = FALLBACK,
  buttonLabel = "Subscribe",
  compact = false,
  className = "",
}: {
  showLists?: boolean;
  defaultLists?: ("essays" | "parish")[];
  lists?: FormList[];
  buttonLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  // With only one choice shown, skip the checkbox and subscribe to it directly.
  const single = showLists && lists.length === 1;
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
      {showLists && !single ? (
        <fieldset className={`m-0 flex border-0 p-0 ${compact ? "flex-row flex-wrap gap-x-6 gap-y-1" : "flex-col gap-3.5"}`}>
          <legend className="sr-only">Newsletters</legend>
          {lists.map((l) => (
            <label
              key={l.slug}
              className={`flex min-h-11 cursor-pointer gap-2.5 text-left leading-[1.35] ${compact ? "items-center text-[16px]" : "items-start text-[18px]"}`}
            >
              <input
                type="checkbox"
                name="lists"
                value={l.slug}
                defaultChecked={l.checked}
                className={`shrink-0 accent-navy ${compact ? "h-4 w-4" : "mt-[3px] h-5 w-5"}`}
              />
              {compact ? (
                <span>
                  {l.name}
                  {l.cadence && <span className="text-slate"> · {l.cadence}</span>}
                </span>
              ) : (
                <span>
                  <b className="font-semibold">{l.name}</b>
                  {l.cadence && (
                    <>
                      <br />
                      <span className="text-[16px] text-slate">{l.cadence}</span>
                    </>
                  )}
                </span>
              )}
            </label>
          ))}
        </fieldset>
      ) : (
        (single ? [lists[0].slug] : defaultLists).map((l) => <input key={l} type="hidden" name="lists" value={l} />)
      )}
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={`inline-form ${compact ? "inline-form-sm" : ""}`}>
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="Your email address" />
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Sending…" : buttonLabel}
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
