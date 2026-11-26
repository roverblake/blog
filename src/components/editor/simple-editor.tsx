"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { BlockQuoteWithSource, FigureImage, PullQuote } from "./extensions";

/** A smaller editor for pages like About: same look, fewer tools, explicit Save. */
export function SimpleEditor({ initial, onSave, label }: { initial: JSONContent; onSave: (doc: JSONContent) => Promise<unknown>; label: string }) {
  const [state, setState] = useState<"idle" | "dirty" | "saving" | "saved">("idle");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2] }, code: false, codeBlock: false, strike: false, underline: false, blockquote: false, link: { openOnClick: false } }),
      BlockQuoteWithSource,
      PullQuote,
      FigureImage,
    ],
    content: initial,
    editorProps: { attributes: { class: "article-body", "aria-label": label, spellcheck: "true" } },
    onUpdate: () => setState("dirty"),
  });
  const btn = "inline-flex min-h-9 items-center px-2 text-[15px] hover:bg-[#efede8]";
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap gap-1 border border-rule bg-white px-2 py-1">
        <button type="button" className={`${btn} font-bold`} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className={`${btn} italic`} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>Section heading</button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Block quote</button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const href = prompt("Link address (leave empty to remove)", editor?.getAttributes("link").href ?? "");
            if (href === null) return;
            if (!href) editor?.chain().focus().unsetLink().run();
            else editor?.chain().focus().setLink({ href }).run();
          }}
        >
          Link
        </button>
      </div>
      <div className="border border-rule bg-white px-6 py-6">
        <div className="mx-auto max-w-reading">
          <EditorContent editor={editor} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="s-btn s-btn-primary"
          disabled={state === "saving" || !editor}
          onClick={async () => {
            if (!editor) return;
            setState("saving");
            await onSave(JSON.parse(JSON.stringify(editor.getJSON())));
            setState("saved");
          }}
        >
          Save
        </button>
        <span role="status" className="text-[15px] text-slate">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "dirty" ? "Unsaved changes" : ""}
        </span>
      </div>
    </div>
  );
}
