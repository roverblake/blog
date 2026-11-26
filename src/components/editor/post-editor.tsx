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
import { BlockQuoteWithSource, FigureImage, Footnote, PullQuote, Paywall } from "./extensions";
import { PostActions } from "./post-actions";
import { SettingsPanel, type SettingsInitial } from "./settings-panel";
import { createSlash, type SlashBridge, type SlashItem } from "./slash";
import { GrammarPanel } from "./grammar-panel";

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
    { title: "Section heading", hint: "Small capitals", run: (e, r) => del(e, r).setHeading({ level: 2 }).run() },
    { title: "Block quote", hint: "Commonplace style", run: (e, r) => del(e, r).toggleBlockquote().run() },
    { title: "Pull quote", hint: "Centered between rules", run: (e, r) => del(e, r).setPullQuote().run() },
    { title: "Bulleted list", hint: "• • •", run: (e, r) => del(e, r).toggleBulletList().run() },
    { title: "Numbered list", hint: "1. 2. 3.", run: (e, r) => del(e, r).toggleOrderedList().run() },
    { title: "Divider", hint: "· · ·", run: (e, r) => del(e, r).setHorizontalRule().run() },
    { title: "Image", hint: "Upload a picture", run: (e, r) => { del(e, r).run(); pickImage(e, onError); } },
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

export function PostEditor({ initial }: { initial: EditorInitial }) {
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [grammarOpen, setGrammarOpen] = useState(false);
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
        heading: { levels: [2] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        blockquote: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Begin writing… (type / for images, quotes, footnotes and the paywall line)" }),
      BlockQuoteWithSource,
      Paywall,
      PullQuote,
      FigureImage,
      Footnote,
      createSlash(slashItems(onError), bridge),
    ],
    [onError],
  );

  const editor = useEditor({
    extensions,
    content: initial.content,
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
      handlePaste: (_view, event) => {
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
            link: e.isActive("link"),
            heading: e.isActive("heading"),
            blockquote: e.isActive("blockquote"),
            pullQuote: e.isActive("pullQuote"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            words: countWords(e.getText()),
          }
        : null,
  });

  /* ---------------- Autosave ---------------- */
  const latest = useRef({ title, subtitle });
  latest.current = { title, subtitle };
  const save = useCallback(async () => {
    if (!editorRef.current) return;
    setSaveState("saving");
    try {
      // ProseMirror stores attributes in prototype-less objects, which are lost
      // when sent to the server; a JSON round-trip turns them into plain objects.
      const content = JSON.parse(JSON.stringify(editorRef.current.getJSON())) as { type: "doc" };
      const res = await saveDraft(initial.id, { ...latest.current, content });
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
  }, [saveState, save, title, subtitle]);

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
  const applyLink = () => {
    if (!editor) return;
    const href = linkValue.trim();
    if (!href) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/|#)/.test(href) ? href : `https://${href}` }).run();
    setLinkOpen(false);
  };

  const words = st?.words ?? 0;
  const tb = "inline-flex min-h-9 min-w-9 items-center justify-center px-2 text-[15px] hover:bg-[#efede8] aria-pressed:bg-ink aria-pressed:text-white";

  return (
    <div className="flex min-h-[calc(100vh-49px)] flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-rule bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/studio" className="text-[16px] text-slate italic">
              ← Posts
            </Link>
            <span className={`s-badge s-badge-${initial.status}`}>{initial.status === "scheduled" ? `Scheduled · ${initial.publishAtLabel}` : initial.status}</span>
            <span role="status" aria-live="polite" className={`text-[15px] ${saveState === "error" ? "text-[#8a2a22]" : "text-slate"}`}>
              {saveLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="s-btn" onClick={() => setGrammarOpen((o) => !o)} aria-expanded={grammarOpen}>
              Check spelling &amp; grammar
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

        {/* Formatting toolbar */}
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-t border-rule px-6 py-1.5">
          <label htmlFor="pstyle" className="sr-only">
            Paragraph style
          </label>
          <select
            id="pstyle"
            className="s-select mr-2 w-auto"
            value={st?.heading ? "h2" : "p"}
            onChange={(e) =>
              e.target.value === "h2" ? editor?.chain().focus().setHeading({ level: 2 }).run() : editor?.chain().focus().setParagraph().run()
            }
          >
            <option value="p">Paragraph</option>
            <option value="h2">Section heading</option>
          </select>
          <button type="button" className={`${tb} font-bold`} aria-label="Bold" aria-pressed={!!st?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={`${tb} italic`} aria-label="Italic" aria-pressed={!!st?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" className={tb} aria-pressed={!!st?.link} onClick={openLink}>Link</button>
          <button type="button" className={tb} aria-label="Block quote" aria-pressed={!!st?.blockquote} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>“ ”</button>
          <button type="button" className={tb} aria-pressed={!!st?.pullQuote} onClick={() => editor?.chain().focus().setPullQuote().run()}>Pull quote</button>
          <button type="button" className={tb} aria-label="Bulleted list" aria-pressed={!!st?.bullet} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" className={tb} aria-label="Numbered list" aria-pressed={!!st?.ordered} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
          <button type="button" className={tb} aria-label="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>· · ·</button>
          <button type="button" className={tb} onClick={() => editor && pickImage(editor, onError)}>Image</button>
          <button type="button" className={tb} onClick={() => editor?.chain().focus().setTextSelection(editor.state.selection.to).insertFootnote("").run()}>Footnote</button>
          <button type="button" className={`${tb} text-navy`} onClick={() => editor?.chain().focus().setPaywall().run()}>Paywall line</button>
        </div>
        {linkOpen && (
          <div className="flex flex-wrap items-center gap-2 border-t border-rule px-6 py-2">
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
        {notice && (
          <div role="alert" className="flex items-center justify-between border-t border-rule bg-[#fbeeee] px-6 py-2 text-[15px]">
            {notice}
            <button type="button" className="s-btn" onClick={() => setNotice(null)}>Dismiss</button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-wrap items-start gap-6 px-6 pt-7 pb-12">
        {/* Writing surface, styled like the public post */}
        <main className="min-w-0 flex-[999_1_560px] border border-rule bg-white px-6 py-12 sm:px-16">
          <div className="mx-auto max-w-reading">
            <div className="mb-8 flex flex-col items-center gap-3 border-b border-rule pb-6 text-center">
              <label htmlFor="title" className="sr-only">Title</label>
              <textarea
                id="title"
                ref={autoGrow}
                onInput={(e) => autoGrow(e.currentTarget)}
                rows={1}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSaveState("dirty"); }}
                placeholder="Title"
                className="field-sizing-content w-full resize-none border-0 bg-transparent text-center font-display text-[44px] leading-[1.05] outline-none sm:text-[56px]"
              />
              <label htmlFor="subtitle" className="sr-only">Subtitle</label>
              <textarea
                id="subtitle"
                ref={autoGrow}
                onInput={(e) => autoGrow(e.currentTarget)}
                rows={1}
                value={subtitle}
                onChange={(e) => { setSubtitle(e.target.value); setSaveState("dirty"); }}
                placeholder="Subtitle"
                className="field-sizing-content w-full resize-none border-0 bg-transparent text-center text-[22px] leading-[1.4] text-subtle italic outline-none sm:text-[24px]"
              />
            </div>
            <EditorContent editor={editor} />
          </div>
        </main>

        <aside className="flex w-full flex-col gap-5 lg:w-[320px] lg:flex-none">
          {grammarOpen && editor && <GrammarPanel editor={editor} dictionary={initial.dictionary} onClose={() => setGrammarOpen(false)} />}
          <SettingsPanel id={initial.id} title={title} status={initial.status} initial={initial.settings} />
          <div className="flex justify-between px-1 text-[15px] text-slate">
            <span>{words.toLocaleString()} words</span>
            <span>About {readingMinutes(words)} min read</span>
          </div>
        </aside>
      </div>

      {/* Floating toolbar on text selection */}
      {editor && (
        <BubbleMenu editor={editor} shouldShow={({ editor: e, state }) => !state.selection.empty && !e.isActive("image") && !e.isActive("paywall")}>
          <div role="toolbar" aria-label="Selection formatting" className="flex bg-ink text-white shadow-lg">
            <button type="button" className="h-10 w-10 font-bold" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button type="button" className="h-10 w-10 italic" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
            <button type="button" className="h-10 px-3 text-[15px]" onClick={openLink}>Link</button>
            <button type="button" className="h-10 px-3 text-[15px]" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
            <button type="button" className="h-10 px-3 text-[15px]" onClick={() => editor.chain().focus().setTextSelection(editor.state.selection.to).insertFootnote("").run()}>Footnote</button>
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
