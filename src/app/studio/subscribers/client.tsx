"use client";

import { useActionState, useTransition } from "react";
import { addSubscriber, deleteSubscriber, removeFromList } from "./actions";

export function AddSubscriberForm() {
  const [state, action, pending] = useActionState(addSubscriber, null);
  return (
    <form action={action} className="s-panel flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1">
        <label htmlFor="add-email" className="s-label">
          Add someone by hand (they&apos;re added as confirmed)
        </label>
        <input id="add-email" name="email" type="email" required className="s-input" placeholder="name@example.com" />
      </div>
      <label className="flex min-h-10 items-center gap-2 text-[16px]">
        <input type="checkbox" name="lists" value="essays" defaultChecked className="accent-navy" /> Essays
      </label>
      <label className="flex min-h-10 items-center gap-2 text-[16px]">
        <input type="checkbox" name="lists" value="parish" className="accent-navy" /> Letters to the Parish
      </label>
      <button className="s-btn s-btn-primary" disabled={pending}>
        Add
      </button>
      {state?.message && (
        <p role="status" className="w-full text-[15px] text-slate">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function RowActions({ id, email, lists }: { id: string; email: string; lists: string[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {lists.map((l) => (
        <button
          key={l}
          type="button"
          className="s-btn min-h-8 px-2 text-[11px]"
          disabled={pending}
          onClick={() => start(() => removeFromList(id, l))}
          aria-label={`Remove ${email} from ${l === "essays" ? "Essays" : "Letters to the Parish"}`}
        >
          − {l === "essays" ? "Essays" : "Parish"}
        </button>
      ))}
      <button
        type="button"
        className="s-btn s-btn-danger min-h-8 px-2 text-[11px]"
        disabled={pending}
        onClick={() => confirm(`Delete ${email} completely? This removes their address from the database.`) && start(() => deleteSubscriber(id))}
      >
        Delete
      </button>
    </div>
  );
}
