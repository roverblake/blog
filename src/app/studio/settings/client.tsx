"use client";

import type { JSONContent } from "@tiptap/core";
import { useState, useTransition } from "react";
import { removeDictionaryWord } from "@/app/studio/actions";
import { SimpleEditor } from "@/components/editor/simple-editor";
import { saveAbout, saveMailingAddress, saveNewsletterBox, saveSiteIdentity } from "./actions";

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

export function SiteIdentityForm({ initial }: { initial: { title: string; tagline: string } }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: "title" | "tagline") => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); setSaved(false); };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="site-title" className="s-label">Site name</label>
      <input id="site-title" className="s-input" maxLength={80} value={v.title} onChange={set("title")} />
      <label htmlFor="site-tagline" className="s-label mt-2">Tagline (the line under the name)</label>
      <input id="site-tagline" className="s-input" maxLength={200} value={v.tagline} onChange={set("tagline")} />
      <p className="m-0 text-[14px] text-slate">Leave a field empty to go back to the original wording.</p>
      <div className="flex items-center gap-3">
        <button type="button" className="s-btn s-btn-primary" disabled={pending} onClick={() => start(async () => { await saveSiteIdentity(v); setSaved(true); })}>
          Save
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

type Copy = { label: string; heading: string; body: string; button: string };
type Option = { slug: "essays" | "parish"; name: string; cadence: string; show: boolean; checked: boolean };

export function NewsletterBoxForm({ initialCopy, initialOptions }: { initialCopy: Copy; initialOptions: Option[] }) {
  const [copy, setCopy] = useState(initialCopy);
  const [options, setOptions] = useState(initialOptions);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const edit = (k: keyof Copy, v: string) => { setCopy((c) => ({ ...c, [k]: v })); setMsg(""); };
  const editOpt = (i: number, patch: Partial<Option>) => {
    setOptions((list) => list.map((o, j) => (j === i ? { ...o, ...patch } : o)));
    setMsg("");
  };
  const field = (k: keyof Copy, label: string, multiline = false) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={`nl-${k}`} className="s-label">{label}</label>
      {multiline ? (
        <textarea id={`nl-${k}`} className="s-textarea" rows={2} value={copy[k]} onChange={(e) => edit(k, e.target.value)} />
      ) : (
        <input id={`nl-${k}`} className="s-input" value={copy[k]} onChange={(e) => edit(k, e.target.value)} />
      )}
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      {field("label", "Small label above the heading")}
      {field("heading", "Heading")}
      {field("body", "Short description (leave empty to hide)", true)}
      {field("button", "Button wording")}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="s-label mb-1">Newsletter choices</legend>
        {options.map((o, i) => (
          <div key={o.slug} className="flex flex-col gap-2 border border-rule bg-white p-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-[1_1_220px] flex-col gap-1">
                <label htmlFor={`nl-name-${o.slug}`} className="s-label">Name</label>
                <input id={`nl-name-${o.slug}`} className="s-input" value={o.name} onChange={(e) => editOpt(i, { name: e.target.value })} />
              </div>
              <div className="flex flex-[1_1_220px] flex-col gap-1">
                <label htmlFor={`nl-cad-${o.slug}`} className="s-label">How often (optional)</label>
                <input id={`nl-cad-${o.slug}`} className="s-input" value={o.cadence} onChange={(e) => editOpt(i, { cadence: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-5 text-[15px]">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={o.show} onChange={(e) => editOpt(i, { show: e.target.checked })} /> Show on the signup form
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={o.checked} onChange={(e) => editOpt(i, { checked: e.target.checked })} /> Ticked by default
              </label>
            </div>
          </div>
        ))}
      </fieldset>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="s-btn s-btn-primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (options.some((o) => !o.name.trim())) { setMsg("Each newsletter needs a name."); return; }
              await saveNewsletterBox({ copy, options });
              setMsg("Saved");
            })
          }
        >
          Save signup box
        </button>
        <span role="status" className="text-[15px] text-slate">{msg}</span>
      </div>
      <p className="m-0 text-[14px] text-slate">If you hide every choice, the signup box disappears from the home page.</p>
    </div>
  );
}
