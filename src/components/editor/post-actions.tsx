"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost, publishNow, schedulePost, unpublish } from "@/app/studio/actions";

export function PostActions({
  id,
  status,
  publishAtLocal,
  publicPath,
  beforeAction,
}: {
  id: string;
  status: "draft" | "scheduled" | "published";
  publishAtLocal: string | null;
  publicPath: string;
  beforeAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [when, setWhen] = useState(publishAtLocal ?? "");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError(null);
      await beforeAction();
      const res = (await fn()) as { error?: string } | undefined;
      if (res?.error) setError(res.error);
      else {
        setScheduleOpen(false);
        router.refresh();
      }
    });

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <a className="s-btn" href={`/preview/${id}`} target="_blank" rel="noopener">
        Preview
      </a>
      {status === "published" ? (
        <>
          <a className="s-btn" href={publicPath} target="_blank" rel="noopener">
            View live
          </a>
          <button type="button" className="s-btn" disabled={pending} onClick={() => confirm("Take this post off the site? It goes back to being a draft.") && run(() => unpublish(id))}>
            Unpublish
          </button>
        </>
      ) : (
        <>
          <button type="button" className="s-btn" disabled={pending} onClick={() => setScheduleOpen((o) => !o)} aria-expanded={scheduleOpen}>
            {status === "scheduled" ? "Reschedule…" : "Schedule…"}
          </button>
          {status === "scheduled" && (
            <button type="button" className="s-btn" disabled={pending} onClick={() => run(() => unpublish(id))}>
              Cancel schedule
            </button>
          )}
          <button
            type="button"
            className="s-btn s-btn-primary"
            disabled={pending}
            onClick={() => confirm("Publish this post on the site now? If email lists are ticked, it will also be emailed.") && run(() => publishNow(id))}
          >
            Publish now
          </button>
        </>
      )}
      <button type="button" className="s-btn s-btn-danger" disabled={pending} onClick={() => confirm("Delete this post for good? This can't be undone.") && run(() => deletePost(id))}>
        Delete
      </button>

      {scheduleOpen && (
        <div className="absolute top-full right-0 z-40 mt-2 w-[320px] border border-[#cfc9be] bg-white p-4 shadow-xl">
          <label htmlFor="when" className="s-label">
            Publish on (Chicago time)
          </label>
          <input id="when" type="datetime-local" className="s-input" value={when} onChange={(e) => setWhen(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button type="button" className="s-btn s-btn-primary" disabled={pending || !when} onClick={() => run(() => schedulePost(id, when))}>
              Schedule
            </button>
            <button type="button" className="s-btn" onClick={() => setScheduleOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="w-full text-[15px] text-[#8a2a22]">
          {error}
        </p>
      )}
    </div>
  );
}
