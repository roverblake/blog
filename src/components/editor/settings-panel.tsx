"use client";

import { useEffect, useRef, useState } from "react";
import { saveSettings, setImageAlt, uploadImage, type PostSettings } from "@/app/studio/actions";
import { slugify, TYPE_PATH } from "@/lib/urls";

export type SettingsInitial = PostSettings & { headerImageSrc: string | null; headerImageAlt: string };

const TYPES = [
  ["essay", "Essay"],
  ["commonplace", "Note"],
  ["parish_letter", "Parish letter"],
] as const;

export function SettingsPanel({ id, title, status, initial, onTypeChange }: { id: string; title: string; status: string; initial: SettingsInitial; onTypeChange?: (t: PostSettings["type"]) => void }) {
  const [s, setS] = useState<PostSettings>(initial);
  const [tagText, setTagText] = useState(initial.tags.join(", "));
  const [imgSrc, setImgSrc] = useState(initial.headerImageSrc);
  const [imgAlt, setImgAlt] = useState(initial.headerImageAlt);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Auto web address from the title until it is edited by hand or the post goes live.
  const slugTouched = useRef(status !== "draft" || !initial.slug.startsWith("untitled-"));
  const first = useRef(true);

  useEffect(() => {
    if (!slugTouched.current && title.trim()) setS((p) => ({ ...p, slug: slugify(title) }));
  }, [title]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await saveSettings(id, { ...s, tags: tagText.split(",").map((x) => x.trim()).filter(Boolean) });
        if (res.slug !== s.slug) setS((p) => ({ ...p, slug: res.slug }));
        setState("saved");
      } catch {
        setState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [s, tagText, id]);

  const set = <K extends keyof PostSettings>(k: K, v: PostSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const toggleList = (l: "essays" | "parish") =>
    set("emailLists", s.emailLists.includes(l) ? s.emailLists.filter((x) => x !== l) : [...s.emailLists, l]);

  async function onImage(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if ("error" in res && res.error) return setError(res.error);
    if ("image" in res && res.image) {
      set("headerImageId", res.image.id);
      setImgSrc(res.image.src);
      setImgAlt("");
    }
  }

  return (
    <section className="s-panel flex flex-col gap-4" aria-labelledby="settings-title">
      <div className="flex items-baseline justify-between">
        <h2 id="settings-title" className="s-panel-title m-0">
          Post settings
        </h2>
        <span className="text-[13px] text-slate" role="status">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Couldn't save" : ""}
        </span>
      </div>

      <div>
        <label htmlFor="ps-type" className="s-label">Type</label>
        <select id="ps-type" className="s-select" value={s.type} onChange={(e) => { const t = e.target.value as PostSettings["type"]; set("type", t); onTypeChange?.(t); }}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="s-label">Who can read</legend>
        <div className="flex border border-ink">
          {(["everyone", "subscribers"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={s.visibility === v}
              onClick={() => set("visibility", v)}
              className={`min-h-10 flex-1 text-[15px] ${s.visibility === v ? "bg-ink text-white" : ""}`}
            >
              {v === "everyone" ? "Everyone" : "Subscribers"}
            </button>
          ))}
        </div>
        {s.visibility === "subscribers" && (
          <div className="mt-2 flex flex-col gap-1.5 text-[14px]">
            <span className="text-slate">What non-subscribers see:</span>
            <label className="flex items-start gap-2">
              <input type="radio" name="ps-locked" className="mt-1" checked={!s.fullyLocked} onChange={() => set("fullyLocked", false)} />
              <span>The opening (everything above the paywall line, or the first few paragraphs)</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="ps-locked" className="mt-1" checked={s.fullyLocked} onChange={() => set("fullyLocked", true)} />
              <span>Title and subtitle only</span>
            </label>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="ps-slug" className="s-label">Web address</label>
        <div className="flex items-center gap-1 text-[14px] text-slate">
          <span>/{TYPE_PATH[s.type]}/</span>
          <input
            id="ps-slug"
            className="s-input"
            value={s.slug}
            onChange={(e) => {
              slugTouched.current = true;
              set("slug", slugify(e.target.value) || e.target.value.toLowerCase());
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ps-kicker" className="s-label">Kicker (small line above the title)</label>
        <input id="ps-kicker" className="s-input" placeholder="e.g. Essay · Advent" value={s.kicker} onChange={(e) => set("kicker", e.target.value)} />
      </div>

      <div>
        <label htmlFor="ps-summary" className="s-label">Summary (for search engines and sharing)</label>
        <textarea id="ps-summary" className="s-textarea" value={s.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>

      <div>
        <label htmlFor="ps-tags" className="s-label">Tags (separate with commas)</label>
        <input id="ps-tags" className="s-input" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Augustine, Advent" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="s-label">Header image</span>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt="" className="aspect-[21/9] w-full object-cover" />
        ) : null}
        <label
          className="flex min-h-16 cursor-pointer items-center justify-center border border-dashed border-[#b5aea2] text-center text-[15px] text-slate"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) onImage(f);
          }}
        >
          {uploading ? "Uploading…" : imgSrc ? "Replace image (drop or click)" : "Drop an image or click to upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
        </label>
        {imgSrc && (
          <>
            <label htmlFor="ps-alt" className="s-label">Image description (for screen readers)</label>
            <input
              id="ps-alt"
              className="s-input"
              value={imgAlt}
              onChange={(e) => setImgAlt(e.target.value)}
              onBlur={() => s.headerImageId && setImageAlt(s.headerImageId, imgAlt)}
            />
            <label htmlFor="ps-caption" className="s-label">Caption</label>
            <input id="ps-caption" className="s-input" value={s.headerCaption} onChange={(e) => set("headerCaption", e.target.value)} />
            <label htmlFor="ps-credit" className="s-label">Credit</label>
            <input id="ps-credit" className="s-input" value={s.headerCredit} onChange={(e) => set("headerCredit", e.target.value)} placeholder="Photo: …" />
            <button type="button" className="s-btn" onClick={() => { set("headerImageId", null); setImgSrc(null); }}>
              Remove image
            </button>
          </>
        )}
        {error && <p role="alert" className="text-[14px] text-[#8a2a22]">{error}</p>}
      </div>

      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
        <legend className="s-label">Email when published</legend>
        <label className="flex min-h-9 items-center gap-2.5 text-[16px]">
          <input type="checkbox" className="h-4.5 w-4.5 accent-navy" checked={s.emailLists.includes("essays")} onChange={() => toggleList("essays")} />
          Essays list
        </label>
        <label className="flex min-h-9 items-center gap-2.5 text-[16px]">
          <input type="checkbox" className="h-4.5 w-4.5 accent-navy" checked={s.emailLists.includes("parish")} onChange={() => toggleList("parish")} />
          Letters to the Parish list
        </label>
      </fieldset>
    </section>
  );
}
