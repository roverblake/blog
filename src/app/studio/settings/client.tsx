"use client";

import type { JSONContent } from "@tiptap/core";
import { useState, useTransition } from "react";
import { removeDictionaryWord } from "@/app/studio/actions";
import { SimpleEditor } from "@/components/editor/simple-editor";
import { saveAbout, saveMailingAddress } from "./actions";

export function MailingAddressForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="addr" className="s-label">
        Mailing address (shown at the bottom of every email; the law requires one, a PO box is fine)
      </label>
      <textarea id="addr" className="s-textarea" rows={3} value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} />
      <div className="flex items-center gap-3">
        <button type="button" className="s-btn s-btn-primary" disabled={pending} onClick={() => start(async () => { await saveMailingAddress(value); setSaved(true); })}>
          Save address
        </button>
        <span role="status" className="text-[15px] text-slate">{saved ? "Saved" : ""}</span>
      </div>
    </div>
  );
}

export function AboutEditor({ initial }: { initial: JSONContent }) {
  return <SimpleEditor initial={initial} onSave={saveAbout} label="About page" />;
}

export function DictionaryList({ words }: { words: string[] }) {
  const [list, setList] = useState(words);
  const [, start] = useTransition();
  if (!list.length) return <p className="m-0 text-[15px] text-slate italic">No words yet. Use “Add to dictionary” in the spelling check.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {list.map((w) => (
        <li key={w} className="flex items-center gap-1 border border-rule bg-white px-2 py-1 text-[15px]">
          {w}
          <button
            type="button"
            aria-label={`Remove ${w} from dictionary`}
            className="min-h-6 min-w-6 text-slate"
            onClick={() => start(async () => { await removeDictionaryWord(w); setList((l) => l.filter((x) => x !== w)); })}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
