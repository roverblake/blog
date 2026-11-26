"use client";

import type { Editor, JSONContent, Range } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionProps } from "@tiptap/suggestion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveDraft, uploadImage } from "@/app/studio/actions";
import { countWords, readingMinutes } from "@/lib/content/text";
import { Audio, BlockQuoteWithSource, FigureImage, Footnote, PullQuote, Paywall, Video } from "./extensions";
import { parseVideoUrl } from "@/lib/embeds";
import { PostActions } from "./post-actions";
import { SettingsPanel, type SettingsInitial } from "./settings-panel";
import { createSlash, type SlashBridge, type SlashItem } from "./slash";
import { GrammarPanel } from "./grammar-panel";
import { Icon } from "./icons";

export type EditorInitial = {
  id: string;
  title: string;
  subtitle: string;
  content: JSONContent;
  status: "draft" | "scheduled" | "published";
  publishAtLocal: string | null;
  publishAtLabel: string | null;
  publicPath: string;
  settings: SettingsInitial;
  dictionary: string[];
};

type SaveState = "saved" | "dirty" | "saving" | "error";

/* ------------------------------------------------------------------ */
/* Inserts shared by the toolbar and the "/" menu                      */
/* ------------------------------------------------------------------ */

function pickImage(editor: Editor, onError: (m: string) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) await uploadAndInsert(editor, file, undefined, onError);
  };
  input.click();
}

async function uploadAndInsert(editor: Editor, file: File, pos: number | undefined, onError: (m: string) => void) {
  const fd = new FormData();
  fd.set("file", file);
  const res = await uploadImage(fd);
  if ("error" in res && res.error) return onError(res.error);
  if (!("image" in res) || !res.image) return;
  const node = { type: "image", attrs: { src: res.image.src, mediaId: res.image.id } };
  if (pos !== undefined) editor.chain().focus().insertContentAt(pos, node).run();
  else editor.chain().focus().insertContent(node).run();
}

function slashItems(onError: (m: string) => void): SlashItem[] {
  const del = (e: Editor, r: Range) => e.chain().focus().deleteRange(r);
  return [
    { title: "Paragraph", hint: "Plain text", run: (e, r) => del(e, r).setParagraph().run() },
    { title: "Heading", hint: "Large", run: (e, r) => del(e, r).setHeading({ level: 3 }).run() },
    { title: "Section label", hint: "Small capitals", run: (e, r) => del(e, r).setHeading({ level: 2 }).run() },
    { title: "Block quote", hint: "Commonplace style", run: (e, r) => del(e, r).toggleBlockquote().run() },
    { title: "Pull quote", hint: "Centered between rules", run: (e, r) => del(e, r).setPullQuote().run() },
    { title: "Bulleted list", hint: "• • •", run: (e, r) => del(e, r).toggleBulletList().run() },
    { title: "Numbered list", hint: "1. 2. 3.", run: (e, r) => del(e, r).toggleOrderedList().run() },
    { title: "Divider", hint: "· · ·", run: (e, r) => del(e, r).setHorizontalRule().run() },
    { title: "Image", hint: "Upload a picture", run: (e, r) => { del(e, r).run(); pickImage(e, onError); } },
    { title: "Video", hint: "YouTube or Vimeo link", run: (e, r) => { del(e, r).run(); window.dispatchEvent(new CustomEvent("editor-embed", { detail: "video" })); } },
    { title: "Audio", hint: "Upload or link a recording", run: (e, r) => { del(e, r).run(); window.dispatchEvent(new CustomEvent("editor-embed", { detail: "audio" })); } },
    { title: "Footnote", hint: "Numbered note", run: (e, r) => del(e, r).insertFootnote("").run() },
    { title: "Paywall line", hint: "Subscribers only below", run: (e, r) => del(e, r).setPaywall().run() },
  ];
}

/* ------------------------------------------------------------------ */

/** Grows a textarea to fit its text (for browsers without field-sizing). */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/* ---------------- Commonplace helpers ---------------- */
type PType = EditorInitial["settings"]["type"];

/** Pulls the leading pull quote (the commonplace quotation) out of a document. */
function splitCommonplace(doc: JSONContent): { quote: string; source: string; rest: JSONContent[] } {
  const blocks = doc.content ?? [];
  const first = blocks[0];
  if (first?.type !== "pullQuote") return { quote: "", source: "", rest: blocks };
  const quote = (first.content ?? [])
    .map((p) => (p.content ?? []).map((n) => (n.type === "hardBreak" ? "\n" : (n.text ?? ""))).join(""))
    .join("\n\n");
  return { quote, source: (first.attrs?.cite as string) ?? "", rest: blocks.slice(1) };
}

function quoteNode(quote: string, source: string): JSONContent {
  const paras = quote.split(/\n\s*\n/).map((t) => t.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  return {
    type: "pullQuote",
    attrs: { cite: source.trim() || null },
    content: paras.map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
  };
}

/** A short title from the opening words of the quote (used for links and search). */
function titleFromQuote(quote: string): string {
  const words = quote.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= 9) return words.join(" ");
  return `${words.slice(0, 9).join(" ").replace(/[,;:.!?]+$/, "")}…`;
}

export function PostEditor({ initial }: { initial: EditorInitial }) {
  const initSplit = initial.settings.type === "commonplace" ? splitCommonplace(initial.content) : null;
  const [ptype, setPtype] = useState<PType>(initial.settings.type);
  const [quote, setQuote] = useState(initSplit?.quote ?? "");
  const [source, setSource] = useState(initSplit?.source ?? "");
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [embed, setEmbed] = useState<"video" | "audio" | null>(null);
  const [embedValue, setEmbedValue] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  useEffect(() => {
    const on = (e: Event) => { setEmbedValue(""); setEmbed((e as CustomEvent<"video" | "audio">).detail); };
    window.addEventListener("editor-embed", on);
    return () => window.removeEventListener("editor-embed", on);
  }, []);
  const [slash, setSlash] = useState<{ items: SlashItem[]; rect: DOMRect | null; index: number; command: (i: SlashItem) => void } | null>(null);
  const slashRef = useRef(slash);
  slashRef.current = slash;

  const onError = useCallback((m: string) => setNotice(m), []);

  const bridge = useRef<SlashBridge | null>(null);
  bridge.current = {
    onStart: (p: SuggestionProps<SlashItem>) =>
      setSlash({ items: p.items, rect: p.clientRect?.() ?? null, index: 0, command: p.command }),
    onUpdate: (p) => setSlash((s) => ({ items: p.items, rect: p.clientRect?.() ?? null, index: Math.min(s?.index ?? 0, Math.max(0, p.items.length - 1)), command: p.command })),
    onKeyDown: ({ event }) => {
      const s = slashRef.current;
      if (!s || !s.items.length) return false;
      if (event.key === "ArrowDown") { setSlash({ ...s, index: (s.index + 1) % s.items.length }); return true; }
      if (event.key === "ArrowUp") { setSlash({ ...s, index: (s.index - 1 + s.items.length) % s.items.length }); return true; }
      if (event.key === "Enter") { s.command(s.items[s.index]); return true; }
      if (event.key === "Escape") { setSlash(null); return true; }
      return false;
    },
    onExit: () => setSlash(null),
  };

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        blockquote: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Begin writing… (type / for images, quotes, footnotes and the paywall line)" }),
      BlockQuoteWithSource,
      Paywall,
      PullQuote,
      FigureImage,
      Footnote,
      Video,
      Audio,
      createSlash(slashItems(onError), bridge),
    ],
    [onError],
  );

  const editor = useEditor({
    extensions,
    content: initSplit ? { type: "doc", content: initSplit.rest.length ? initSplit.rest : [{ type: "paragraph" }] } : initial.content,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "article-body", spellcheck: "true", "aria-label": "Post body" },
      handleDrop: (view, event, _slice, moved) => {
        const files = event.dataTransfer?.files;
        if (moved || !files?.length) return false;
        const images = [...files].filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        images.forEach((f) => editorRef.current && uploadAndInsert(editorRef.current, f, pos, onError));
        return true;
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openLinkRef.current();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        // A YouTube or Vimeo link pasted on an empty line becomes a video (as in Substack).
        const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
        const { $from, empty } = view.state.selection;
        if (text && !/\s/.test(text) && empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0) {
          const ref = parseVideoUrl(text);
          if (ref && editorRef.current) {
            event.preventDefault();
            editorRef.current.chain().focus().insertVideo(ref).run();
            return true;
          }
        }
        const images = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        images.forEach((f) => editorRef.current && uploadAndInsert(editorRef.current, f, undefined, onError));
        return true;
      },
    },
    onUpdate: () => setSaveState("dirty"),
  });
  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            code: e.isActive("code"),
            style: e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 2 }) ? "h2" : "p",
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            link: e.isActive("link"),
            heading: e.isActive("heading"),
            blockquote: e.isActive("blockquote"),
            pullQuote: e.isActive("pullQuote"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            words: countWords(e.getText()),
            notes: (() => {
              const list: { pos: number; text: string }[] = [];
              e.state.doc.descendants((n, pos) => {
                if (n.type.name === "footnote") list.push({ pos, text: (n.attrs.text as string) ?? "" });
              });
              return list;
            })(),
          }
        : null,
  });

  /* ---------------- Autosave ---------------- */
  const latest = useRef({ title, subtitle, ptype, quote, source });
  latest.current = { title, subtitle, ptype, quote, source };
  const save = useCallback(async () => {
    if (!editorRef.current) return;
    setSaveState("saving");
    try {
      // ProseMirror stores attributes in prototype-less objects, which are lost
      // when sent to the server; a JSON round-trip turns them into plain objects.
      const body = JSON.parse(JSON.stringify(editorRef.current.getJSON())) as { type: "doc"; content?: JSONContent[] };
      const L = latest.current;
      const isCp = L.ptype === "commonplace";
      const content = isCp && L.quote.trim() ? { type: "doc" as const, content: [quoteNode(L.quote, L.source), ...(body.content ?? [])] } : body;
      const res = await saveDraft(initial.id, {
        title: isCp ? (L.quote.trim() ? titleFromQuote(L.quote) : L.title) : L.title,
        subtitle: isCp ? "" : L.subtitle,
        content,
      });
      setSavedAt(res.savedAt ? new Date(res.savedAt) : new Date());
      setSaveState((s) => (s === "saving" ? "saved" : s));
    } catch {
      setSaveState("error");
    }
  }, [initial.id]);

  useEffect(() => {
    if (saveState !== "dirty" && saveState !== "error") return;
    const t = setTimeout(save, saveState === "error" ? 5000 : 1200);
    return () => clearTimeout(t);
  }, [saveState, save, title, subtitle, quote, source]);

  /* Switching to or from the Commonplace type moves the quote in or out of the text. */
  const onTypeChange = (t: PType) => {
    const e = editorRef.current;
    if (!e) return setPtype(t);
    if (t === "commonplace" && ptype !== "commonplace") {
      const sp = splitCommonplace(e.getJSON());
      if (sp.quote) {
        setQuote(sp.quote);
        setSource(sp.source);
        e.commands.setContent({ type: "doc", content: sp.rest.length ? sp.rest : [{ type: "paragraph" }] });
      }
    } else if (t !== "commonplace" && ptype === "commonplace" && quote.trim()) {
      const doc = e.getJSON();
      e.commands.setContent({ type: "doc", content: [quoteNode(quote, source), ...(doc.content ?? [])] });
      if (!title.trim() || title === titleFromQuote(quote)) setTitle(titleFromQuote(quote));
      setQuote("");
      setSource("");
    }
    setPtype(t);
    setSaveState("dirty");
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes" : saveState === "error" ? "Couldn't save. Retrying…" : savedAt ? "Saved" : "Saved";

  /* ---------------- Toolbar helpers ---------------- */
  const openLink = () => {
    if (!editor) return;
    setLinkValue((editor.getAttributes("link").href as string) ?? "");
    setLinkOpen(true);
  };
  const openLinkRef = useRef(openLink);
  openLinkRef.current = openLink;
  const applyLink = () => {
    if (!editor) return;
    const href = linkValue.trim();
    if (!href) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/|#)/.test(href) ? href : `https://${href}` }).run();
    setLinkOpen(false);
  };

  const words = st?.words ?? 0;
  const tb =
    "inline-flex h-9 min-w-9 items-center justify-center rounded px-2 text-[15px] text-[#3d3a35] hover:bg-[#efede8] disabled:opacity-35 aria-pressed:bg-[#e6e3dc] aria-pressed:text-ink";
  const sep = <span aria-hidden="true" className="mx-1 h-5 w-px bg-rule" />;
  const run = (fn: (e: Editor) => void) => () => editor && fn(editor);
  const insertFootnote = (e: Editor) => e.chain().focus().setTextSelection(e.state.selection.to).insertFootnote("").run();
  const drawerOpen = settingsOpen || grammarOpen;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar: back, save state, word count | spelling, settings, preview, publish */}
      <div className="editor-chrome sticky top-0 z-30 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-2">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/studio" className="text-[16px] text-slate">
              ← Posts
            </Link>
            <span className={`s-badge s-badge-${initial.status}`}>{initial.status === "scheduled" ? `Scheduled · ${initial.publishAtLabel}` : initial.status}</span>
            <span role="status" aria-live="polite" className={`text-[15px] ${saveState === "error" ? "text-[#8a2a22]" : "text-slate"}`}>
              {saveLabel}
            </span>
            <span className="hidden text-[15px] text-slate sm:inline">
              {words.toLocaleString()} words · {readingMinutes(words)} min read
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="s-btn" onClick={() => { setGrammarOpen((o) => !o); setSettingsOpen(false); }} aria-expanded={grammarOpen}>
              Spelling &amp; grammar
            </button>
            <button type="button" className="s-btn" onClick={() => { setSettingsOpen((o) => !o); setGrammarOpen(false); }} aria-expanded={settingsOpen}>
              Settings
            </button>
            <PostActions
              id={initial.id}
              status={initial.status}
              publishAtLocal={initial.publishAtLocal}
              publicPath={initial.publicPath}
              beforeAction={async () => {
                if (saveState !== "saved") await save();
              }}
            />
          </div>
        </div>

        {/* Formatting toolbar, centered like Substack's */}
        <div className="border-b border-rule">
          <div
            role="toolbar"
            aria-label="Formatting"
            className="mx-auto flex max-w-[900px] flex-wrap items-center justify-center gap-0.5 px-4 py-1.5"
            // Keep the cursor in the text when a button is clicked (as Substack does).
            onMouseDown={(ev) => { if (!(ev.target as HTMLElement).closest("select")) ev.preventDefault(); }}
          >
            <button type="button" className={tb} aria-label="Undo" title="Undo (⌘Z)" disabled={!st?.canUndo} onClick={run((e) => e.chain().focus().undo().run())}><Icon name="undo" /></button>
            <button type="button" className={tb} aria-label="Redo" title="Redo (⌘⇧Z)" disabled={!st?.canRedo} onClick={run((e) => e.chain().focus().redo().run())}><Icon name="redo" /></button>
            {sep}
            <label htmlFor="pstyle" className="sr-only">Text style</label>
            <select
              id="pstyle"
              className="h-9 w-[140px] rounded border-0 bg-transparent px-2 text-[15px] hover:bg-[#efede8]"
              value={st?.style ?? "p"}
              onChange={(ev) => {
                const v = ev.target.value;
                const c = editor?.chain().focus();
                if (v === "h3") c?.setHeading({ level: 3 }).run();
                else if (v === "h2") c?.setHeading({ level: 2 }).run();
                else c?.setParagraph().run();
              }}
            >
              <option value="p">Normal text</option>
              <option value="h3">Heading</option>
              <option value="h2">Section label</option>
            </select>
            {sep}
            <button type="button" className={tb} aria-label="Bold" title="Bold (⌘B)" aria-pressed={!!st?.bold} onClick={run((e) => e.chain().focus().toggleBold().run())}><Icon name="bold" /></button>
            <button type="button" className={tb} aria-label="Italic" title="Italic (⌘I)" aria-pressed={!!st?.italic} onClick={run((e) => e.chain().focus().toggleItalic().run())}><Icon name="italic" /></button>
            <button type="button" className={tb} aria-label="Underline" title="Underline (⌘U)" aria-pressed={!!st?.underline} onClick={run((e) => e.chain().focus().toggleUnderline().run())}><Icon name="underline" /></button>
            <button type="button" className={tb} aria-label="Strikethrough" title="Strikethrough (⌘⇧S)" aria-pressed={!!st?.strike} onClick={run((e) => e.chain().focus().toggleStrike().run())}><Icon name="strike" /></button>
            <button type="button" className={tb} aria-label="Code" title="Code (⌘E)" aria-pressed={!!st?.code} onClick={run((e) => e.chain().focus().toggleCode().run())}><Icon name="code" /></button>
            {sep}
            <button type="button" className={tb} aria-label="Link" title="Link (⌘K)" aria-pressed={!!st?.link} onClick={openLink}><Icon name="link" /></button>
            <button type="button" className={tb} aria-label="Image" title="Image" onClick={run((e) => pickImage(e, onError))}><Icon name="image" /></button>
            <button type="button" className={tb} aria-label="Block quote" title="Quote" aria-pressed={!!st?.blockquote} onClick={run((e) => e.chain().focus().toggleBlockquote().run())}><Icon name="quote" /></button>
            {sep}
            <button type="button" className={tb} aria-label="Bulleted list" title="Bulleted list" aria-pressed={!!st?.bullet} onClick={run((e) => e.chain().focus().toggleBulletList().run())}><Icon name="bullets" /></button>
            <button type="button" className={tb} aria-label="Numbered list" title="Numbered list" aria-pressed={!!st?.ordered} onClick={run((e) => e.chain().focus().toggleOrderedList().run())}><Icon name="numbers" /></button>
            {sep}
            <div className="relative">
              <button type="button" className={`${tb} gap-1`} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((o) => !o)}>
                <Icon name="more" /> More
              </button>
              {moreOpen && (
                <div role="menu" className="absolute right-0 z-40 mt-1 w-64 border border-[#cfc9be] bg-white py-1 shadow-xl" onMouseLeave={() => setMoreOpen(false)}>
                  {[
                    ["Video", "YouTube or Vimeo", () => { setEmbedValue(""); setEmbed("video"); }],
                    ["Audio", "Upload or link", () => { setEmbedValue(""); setEmbed("audio"); }],
                    ["Divider", "· · ·", (e: Editor) => e.chain().focus().setHorizontalRule().run()],
                    ["Pull quote", "Centered between rules", (e: Editor) => e.chain().focus().setPullQuote().run()],
                    ["Footnote", "Numbered note", insertFootnote],
                    ["Paywall line", "Subscribers only below", (e: Editor) => e.chain().focus().setPaywall().run()],
                  ].map(([label, hint, fn]) => (
                    <button
                      key={label as string}
                      type="button"
                      role="menuitem"
                      className="flex w-full items-baseline justify-between px-3.5 py-2 text-left text-[16px] hover:bg-warm"
                      onClick={() => { setMoreOpen(false); if (editor) (fn as (e: Editor) => void)(editor); }}
                    >
                      <span>{label as string}</span>
                      <span className="text-[13px] text-slate">{hint as string}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {linkOpen && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-rule px-6 py-2">
            <label htmlFor="link-url" className="text-[15px] text-slate">Link address</label>
            <input
              id="link-url"
              autoFocus
              className="s-input max-w-[420px]"
              value={linkValue}
              placeholder="https://…"
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); applyLink(); }
                if (e.key === "Escape") setLinkOpen(false);
              }}
            />
            <button type="button" className="s-btn" onClick={applyLink}>Apply</button>
            <button type="button" className="s-btn" onClick={() => { setLinkValue(""); editor?.chain().focus().unsetLink().run(); setLinkOpen(false); }}>Remove link</button>
          </div>
        )}
        {embed && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-rule px-6 py-2">
            <label htmlFor="embed-url" className="text-[15px] text-slate">
              {embed === "video" ? "Paste a YouTube or Vimeo link" : "Paste a link to an MP3, or"}
            </label>
            {embed === "audio" && (
              <label className="s-btn cursor-pointer">
                {uploadingAudio ? "Uploading…" : "Upload a file"}
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  disabled={uploadingAudio}
                  onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file || !editor) return;
                    setUploadingAudio(true);
                    const fd = new FormData();
                    fd.set("file", file);
                    const res = await fetch("/studio/upload-audio", { method: "POST", body: fd }).then((r) => r.json()).catch(() => ({ error: "Upload failed." }));
                    setUploadingAudio(false);
                    if (res.error) return setNotice(res.error);
                    editor.chain().focus().insertAudio({ src: res.src, title: res.title }).run();
                    setEmbed(null);
                  }}
                />
              </label>
            )}
            <input
              id="embed-url"
              autoFocus
              className="s-input max-w-[420px]"
              value={embedValue}
              placeholder={embed === "video" ? "https://www.youtube.com/watch?v=…" : "https://…/recording.mp3"}
              onChange={(e) => setEmbedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); (document.getElementById("embed-add") as HTMLButtonElement | null)?.click(); }
                if (e.key === "Escape") setEmbed(null);
              }}
            />
            <button
              id="embed-add"
              type="button"
              className="s-btn"
              onClick={() => {
                if (!editor) return;
                const v = embedValue.trim();
                if (embed === "video") {
                  const ref = parseVideoUrl(v);
                  if (!ref) return setNotice("That doesn't look like a YouTube or Vimeo link.");
                  editor.chain().focus().insertVideo(ref).run();
                } else {
                  if (!/^https:\/\/\S+$/.test(v)) return setNotice("Please paste a full link starting with https://");
                  editor.chain().focus().insertAudio({ src: v }).run();
                }
                setEmbed(null);
              }}
            >
              Add
            </button>
            <button type="button" className="s-btn" onClick={() => setEmbed(null)}>Cancel</button>
          </div>
        )}
        {notice && (
          <div role="alert" className="flex items-center justify-between border-b border-rule bg-[#fbeeee] px-6 py-2 text-[15px]">
            {notice}
            <button type="button" className="s-btn" onClick={() => setNotice(null)}>Dismiss</button>
          </div>
        )}
      </div>

      {/* Writing surface: one clean centered column */}
      <main className="writing flex-1 px-6 pt-12 pb-32">
        <div className="mx-auto max-w-reading">
          {ptype === "commonplace" ? (
            <>
              <div className="text-center text-[13px] uppercase tracking-[0.26em] text-slate">Commonplace</div>
              <div className="mt-6 border-t border-b border-ink py-7 text-center">
                <label htmlFor="cp-quote" className="sr-only">Quotation</label>
                <textarea
                  id="cp-quote"
                  ref={autoGrow}
                  onInput={(e) => autoGrow(e.currentTarget)}
                  rows={2}
                  value={quote}
                  onChange={(e) => { setQuote(e.target.value); setSaveState("dirty"); }}
                  placeholder="Type or paste the quotation…"
                  className="field-sizing-content w-full resize-none border-0 bg-transparent text-center font-caslon text-[28px] leading-[1.45] text-ink italic outline-none placeholder:text-[#b9b4ab] sm:text-[30px]"
                />
                <label htmlFor="cp-source" className="sr-only">Source</label>
                <input
                  id="cp-source"
                  value={source}
                  onChange={(e) => { setSource(e.target.value); setSaveState("dirty"); }}
                  placeholder="Author · Work, chapter"
                  className="mt-3 w-full border-0 bg-transparent text-center text-[14px] uppercase tracking-[0.16em] text-slate outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[#b9b4ab]"
                />
              </div>
              <p className="mt-6 mb-0 text-center text-[14px] text-slate italic">Your note goes below. Leave it empty to post the quotation on its own.</p>
            </>
          ) : (
            <>
              <label htmlFor="title" className="sr-only">Title</label>
              <textarea
                id="title"
                ref={autoGrow}
                onInput={(e) => autoGrow(e.currentTarget)}
                rows={1}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSaveState("dirty"); }}
                placeholder="Title"
                className="field-sizing-content w-full resize-none border-0 bg-transparent font-display text-[40px] leading-[1.1] outline-none placeholder:text-[#b9b4ab] sm:text-[48px]"
              />
              <label htmlFor="subtitle" className="sr-only">Subtitle</label>
              <textarea
                id="subtitle"
                ref={autoGrow}
                onInput={(e) => autoGrow(e.currentTarget)}
                rows={1}
                value={subtitle}
                onChange={(e) => { setSubtitle(e.target.value); setSaveState("dirty"); }}
                placeholder="Add a subtitle…"
                className="field-sizing-content mt-2 w-full resize-none border-0 bg-transparent text-[22px] leading-[1.4] text-subtle outline-none placeholder:text-[#b9b4ab]"
              />
            </>
          )}
          <div className="mt-8">
            <EditorContent editor={editor} />
          </div>
          {/* Notes, listed as they will appear at the end of the published post */}
          {editor && (st?.notes.length ?? 0) > 0 && (
            <section className="footnotes mt-12" aria-labelledby="ed-notes">
              <div className="section-label">
                <h2 id="ed-notes">Notes</h2>
              </div>
              <ol>
                {st!.notes.map((n, i) => (
                  <li key={n.pos}>
                    <label htmlFor={`note-${i}`} className="sr-only">Note {i + 1}</label>
                    <textarea
                      id={`note-${i}`}
                      ref={autoGrow}
                      onInput={(ev) => autoGrow(ev.currentTarget)}
                      rows={1}
                      value={n.text}
                      placeholder="Type the note here…"
                      onChange={(ev) => {
                        const v = ev.target.value;
                        editor.chain().command(({ tr }) => { tr.setNodeAttribute(n.pos, "text", v); return true; }).run();
                      }}
                      className="field-sizing-content w-full resize-none border-0 bg-transparent align-top outline-none placeholder:text-[#b9b4ab] placeholder:italic"
                    />
                  </li>
                ))}
              </ol>
              <p className="m-0 mt-2 text-[14px] text-slate">Notes left empty are not shown on the site.</p>
            </section>
          )}
        </div>
      </main>

      {/* Right-hand drawer for post settings and the spelling check */}
      {(
        <aside
          aria-label={settingsOpen ? "Post settings" : "Spelling and grammar"}
          hidden={!drawerOpen}
          className="editor-chrome fixed top-0 right-0 bottom-0 z-40 flex w-full max-w-[400px] flex-col gap-4 overflow-y-auto border-l border-rule bg-[#faf9f7] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-[18px] font-semibold">{settingsOpen ? "Post settings" : "Spelling & grammar"}</h2>
            <button type="button" className="s-btn" onClick={() => { setSettingsOpen(false); setGrammarOpen(false); }}>
              Done
            </button>
          </div>
          {grammarOpen && editor && <GrammarPanel editor={editor} dictionary={initial.dictionary} onClose={() => setGrammarOpen(false)} />}
          <div className={settingsOpen ? "" : "hidden"}>
            <SettingsPanel id={initial.id} title={ptype === "commonplace" && quote.trim() ? titleFromQuote(quote) : title} status={initial.status} initial={initial.settings} onTypeChange={onTypeChange} />
          </div>
        </aside>
      )}

      {/* Floating toolbar on text selection */}
      {editor && (
        <BubbleMenu editor={editor} shouldShow={({ editor: e, state }) => !state.selection.empty && !e.isActive("image") && !e.isActive("paywall")}>
          <div role="toolbar" aria-label="Selection formatting" className="flex rounded bg-ink text-white shadow-lg" onMouseDown={(ev) => ev.preventDefault()}>
            <button type="button" className="h-10 w-10" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><span className="inline-flex justify-center"><Icon name="bold" /></span></button>
            <button type="button" className="h-10 w-10" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><span className="inline-flex justify-center"><Icon name="italic" /></span></button>
            <button type="button" className="h-10 w-10" aria-label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><span className="inline-flex justify-center"><Icon name="underline" /></span></button>
            <button type="button" className="h-10 w-10" aria-label="Link" onClick={openLink}><span className="inline-flex justify-center"><Icon name="link" /></span></button>
            <button type="button" className="h-10 w-10" aria-label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><span className="inline-flex justify-center"><Icon name="quote" /></span></button>
            <button type="button" className="h-10 px-3 text-[15px]" onClick={() => insertFootnote(editor)}>Footnote</button>
          </div>
        </BubbleMenu>
      )}

      {/* "/" menu */}
      {slash && slash.items.length > 0 && slash.rect && (
        <div
          role="listbox"
          aria-label="Insert"
          className="fixed z-50 w-72 border border-[#cfc9be] bg-white shadow-xl"
          style={{ left: slash.rect.left, top: slash.rect.bottom + 6 }}
        >
          {slash.items.map((item, i) => (
            <button
              key={item.title}
              type="button"
              role="option"
              aria-selected={i === slash.index}
              onMouseDown={(e) => { e.preventDefault(); slash.command(item); }}
              className={`flex w-full items-baseline justify-between px-3.5 py-2 text-left text-[17px] ${i === slash.index ? "bg-warm" : ""}`}
            >
              <span>{item.title}</span>
              <span className="text-[13px] text-slate">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
