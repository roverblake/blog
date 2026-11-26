"use client";

import { citeParts } from "@/lib/content/cite";
import { mergeAttributes, Node } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import { TextSelection } from "@tiptap/pm/state";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { videoThumbUrl } from "@/lib/embeds";

/** Let typing in a node's own inputs (captions, footnote box) bypass the editor. */
const ownInputs = {
  stopEvent: ({ event }: { event: Event }) => {
    const t = event.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || !!t.closest?.("[data-cite-field]"));
  },

};

/** For quotes with a source field: like ownInputs, and the field keeps its own typing and selection. */
const quoteInputs = {
  ...ownInputs,
  ignoreMutation: ({ mutation }: { mutation: MutationRecord | { type: "selection"; target: globalThis.Node } }) => {
    const t = mutation.target as HTMLElement | null;
    const el = t && (t.nodeType === 1 ? t : t.parentElement);
    if (el?.closest?.("[data-cite-field]")) return true;
    if (mutation.type === "selection") return false;
    return !el?.closest?.("[data-node-view-content-react]");
  },
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paywall: { setPaywall: () => ReturnType };
    pullQuote: { setPullQuote: () => ReturnType };
    image: { insertImage: (attrs: { src: string; mediaId?: string; alt?: string }) => ReturnType };
    footnote: { insertFootnote: (text: string) => ReturnType };
    video: { insertVideo: (attrs: { provider: "youtube" | "vimeo"; id: string }) => ReturnType };
    audio: { insertAudio: (attrs: { src: string; title?: string }) => ReturnType };
    linkCard: { insertLinkCard: (attrs: { href: string; title?: string; site?: string; author?: string }) => ReturnType };
  }
}

/** "Paywall line": everything after it is for subscribers. Only one per post. */
export const Paywall = Node.create({
  name: "paywall",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML: () => [{ tag: "div[data-paywall]" }],
  renderHTML: () => ["div", { "data-paywall": "", class: "paywall-line", contenteditable: "false" }, ["span", {}, "Subscribers only below this line"]],
  addCommands() {
    return {
      setPaywall:
        () =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return true;
          // Remove an existing line first, so there is only ever one.
          const found: number[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "paywall") found.push(pos);
            return node.type.name === "doc";
          });
          for (const pos of found.reverse()) tr.delete(pos, pos + 1);
          const { schema } = state;
          const $from = tr.selection.$from;
          const block = $from.node(1);
          const blockStart = $from.before(1);
          const line = schema.nodes.paywall.create();
          let after: number;
          if (block && block.type.name === "paragraph" && block.content.size === 0) {
            // Replace the empty paragraph the cursor is in.
            tr.replaceWith(blockStart, blockStart + block.nodeSize, line);
            after = blockStart + 1;
          } else {
            const at = blockStart + (block?.nodeSize ?? 0);
            tr.insert(at, line);
            after = at + 1;
          }
          // Make sure there is a paragraph after the line to keep typing in.
          if (!tr.doc.nodeAt(after) || tr.doc.nodeAt(after)?.type.name !== "paragraph") {
            tr.insert(after, schema.nodes.paragraph.create());
          }
          tr.setSelection(TextSelection.create(tr.doc, after + 1));
          dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },
});

/* ---------- Quote source line: plain text, book titles in italics ---------- */
const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Reads the field back as text, with italic runs marked *like this*. */
function serializeCite(root: HTMLElement): string {
  let out = "";
  const walk = (n: ChildNode, italic: boolean) => {
    if (n.nodeType === 3) {
      const t = (n.textContent ?? "").replace(/\*/g, "").replace(/\u00a0/g, " ");
      out += italic && t.trim() ? `*${t}*` : t;
      return;
    }
    if (n.nodeType !== 1) return;
    const el = n as HTMLElement;
    const it = italic || el.tagName === "I" || el.tagName === "EM" || el.style?.fontStyle === "italic";
    el.childNodes.forEach((c) => walk(c, it));
  };
  root.childNodes.forEach((c) => walk(c, false));
  // Join neighbouring italic runs and tidy spaces.
  return out.replace(/\*\*/g, "").replace(/\s+/g, " ").trimStart();
}

/** A one-line source field. Select a book title and press Cmd/Ctrl+I to italicize it. */
function CiteField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || serializeCite(el) === value) return;
    el.innerHTML = citeParts(value).map((p) => (p.italic ? `<i>${escHtml(p.text)}</i>` : escHtml(p.text))).join("");
  }, [value]);
  return (
    <div contentEditable={false} className="cite-wrap">
    <div
      ref={ref}
      data-cite-field
      className="cite-input cite-field"
      role="textbox"
      aria-label="Source of the quotation. Select a book title and press Command I to italicize it."
      title="Select a book title and press ⌘I to italicize it"
      data-placeholder={placeholder}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={(e) => onChange(serializeCite(e.currentTarget))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
          e.preventDefault();
          document.execCommand("italic");
          onChange(serializeCite(e.currentTarget));
        }
        if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "b" || e.key.toLowerCase() === "u")) e.preventDefault();
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " "));
      }}
    />
    </div>
  );
}

function PullQuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="blockquote" className="pull-quote">
      <NodeViewContent />
      <CiteField
        value={(node.attrs.cite as string) ?? ""}
        onChange={(cite) => updateAttributes({ cite })}
        placeholder="Source (e.g. Augustine, Confessions I.1)"
      />
    </NodeViewWrapper>
  );
}

/** Pull quote: centered between rules, with an optional source line. */
export const PullQuote = Node.create({
  name: "pullQuote",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes: () => ({ cite: { default: null } }),
  parseHTML: () => [{ tag: "blockquote.pull-quote" }],
  renderHTML: ({ HTMLAttributes }) => ["blockquote", mergeAttributes(HTMLAttributes, { class: "pull-quote" }), 0],
  addNodeView() {
    return ReactNodeViewRenderer(PullQuoteView, quoteInputs);
  },
  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

function ImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const a = node.attrs as { src: string; alt: string | null; caption: string | null; credit: string | null; size: string | null };
  const wide = a.size === "wide";
  return (
    <NodeViewWrapper as="figure" data-drag-handle className={`${wide ? "wide " : ""}${selected ? "ProseMirror-selectednode" : ""}`}>
      <span className="media-tools" contentEditable={false}>
        <button type="button" aria-pressed={!wide} onClick={() => updateAttributes({ size: "normal" })}>Text width</button>
        <button type="button" aria-pressed={wide} onClick={() => updateAttributes({ size: "wide" })}>Wide</button>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.src} alt={a.alt ?? ""} />
      <div className="caption-row" contentEditable={false}>
        <input className="caption" placeholder="Caption" aria-label="Caption" value={a.caption ?? ""} onChange={(e) => updateAttributes({ caption: e.target.value })} />
        <input className="credit" placeholder="Credit" aria-label="Photo credit" value={a.credit ?? ""} onChange={(e) => updateAttributes({ credit: e.target.value })} style={{ textAlign: "right", maxWidth: "40%" }} />
      </div>
      <input
        contentEditable={false}
        aria-label="Description for screen readers (alt text)"
        placeholder="Describe the image for people who can't see it"
        value={a.alt ?? ""}
        onChange={(e) => updateAttributes({ alt: e.target.value })}
        style={{ width: "100%", border: 0, borderBottom: "1px dashed #cfc9be", fontSize: 14, padding: "4px 0", background: "transparent", color: "#5c5852" }}
      />
    </NodeViewWrapper>
  );
}

/** Image with caption and credit (in-body). */
export const FigureImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({
    src: { default: null },
    alt: { default: null },
    caption: { default: null },
    credit: { default: null },
    mediaId: { default: null },
    size: { default: "normal" },
  }),
  parseHTML: () => [{ tag: "figure img", getAttrs: (el: HTMLElement | string) => ({ src: (el as HTMLElement).getAttribute("src") }) }],
  renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) => ["figure", {}, ["img", { src: HTMLAttributes.src, alt: HTMLAttributes.alt ?? "" }]],
  addNodeView() {
    return ReactNodeViewRenderer(ImageView, ownInputs);
  },
  addCommands() {
    return {
      insertImage:
        (attrs: { src: string; mediaId?: string; alt?: string }) =>
        ({ commands }: { commands: { insertContent: (c: object) => boolean } }) =>
          commands.insertContent({ type: "image", attrs }),
    };
  },
});

function VideoView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const a = node.attrs as { provider: "youtube" | "vimeo"; id: string; caption: string | null };
  const thumb = videoThumbUrl(a.provider, a.id);
  return (
    <NodeViewWrapper as="figure" data-drag-handle className={`video-block ${selected ? "ProseMirror-selectednode" : ""}`}>
      <span className="video-frame" contentEditable={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {thumb && <img src={thumb} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        <span className="video-play" aria-hidden="true" />
        <span className="video-source">{a.provider === "youtube" ? "YouTube" : "Vimeo"} video</span>
      </span>
      <div className="caption-row" contentEditable={false}>
        <input className="caption" placeholder="Caption (optional)" aria-label="Video caption" value={a.caption ?? ""} onChange={(e) => updateAttributes({ caption: e.target.value })} />
      </div>
    </NodeViewWrapper>
  );
}

/** A YouTube or Vimeo video. Readers see a still until they press play. */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ provider: { default: "youtube" }, id: { default: "" }, caption: { default: null } }),
  parseHTML: () => [{ tag: "figure[data-video]" }],
  renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) => ["figure", { "data-video": HTMLAttributes.id }],
  addNodeView() {
    return ReactNodeViewRenderer(VideoView, ownInputs);
  },
  addCommands() {
    return {
      insertVideo:
        (attrs: { provider: "youtube" | "vimeo"; id: string }) =>
        ({ commands }: { commands: { insertContent: (c: object) => boolean } }) =>
          commands.insertContent([{ type: "video", attrs }, { type: "paragraph" }]),
    };
  },
});

function AudioView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const a = node.attrs as { src: string; title: string | null; caption: string | null };
  return (
    <NodeViewWrapper as="figure" data-drag-handle className={`audio-block ${selected ? "ProseMirror-selectednode" : ""}`}>
      <input
        className="audio-title"
        placeholder="Title (e.g. Sermon for Advent Sunday)"
        aria-label="Audio title"
        value={a.title ?? ""}
        onChange={(e) => updateAttributes({ title: e.target.value })}
      />
      <audio controls preload="metadata" src={a.src} contentEditable={false} />
      <div className="caption-row" contentEditable={false}>
        <input className="caption" placeholder="Caption (optional)" aria-label="Audio caption" value={a.caption ?? ""} onChange={(e) => updateAttributes({ caption: e.target.value })} />
      </div>
    </NodeViewWrapper>
  );
}

/** An audio recording with a title and simple player. */
export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: "" }, title: { default: null }, caption: { default: null } }),
  parseHTML: () => [{ tag: "figure[data-audio]" }],
  renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) => ["figure", { "data-audio": HTMLAttributes.src }],
  addNodeView() {
    return ReactNodeViewRenderer(AudioView, { stopEvent: ({ event }: { event: Event }) => { const t = event.target as HTMLElement | null; return !!t && ["INPUT", "TEXTAREA", "BUTTON", "AUDIO"].includes(t.tagName); } });
  },
  addCommands() {
    return {
      insertAudio:
        (attrs: { src: string; title?: string }) =>
        ({ commands }: { commands: { insertContent: (c: object) => boolean } }) =>
          commands.insertContent([{ type: "audio", attrs }, { type: "paragraph" }]),
    };
  },
});

function LinkCardView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const a = node.attrs as { href: string; title: string | null; site: string | null; author: string | null };
  let host = "";
  try { host = a.href.startsWith("/") ? "" : new URL(a.href).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
  return (
    <NodeViewWrapper data-drag-handle className={`link-ref link-ref-edit ${selected ? "ProseMirror-selectednode" : ""}`}>
      <input className="link-ref-site w-full border-0 bg-transparent outline-none" placeholder="PUBLICATION" aria-label="Publication" value={a.site ?? ""} onChange={(e) => updateAttributes({ site: e.target.value })} />
      <input className="link-ref-title w-full border-0 bg-transparent outline-none" placeholder="Title" aria-label="Title" value={a.title ?? ""} onChange={(e) => updateAttributes({ title: e.target.value })} />
      <div className="link-ref-meta flex items-baseline gap-1" contentEditable={false}>
        <span>by</span>
        <input className="min-w-0 flex-1 border-0 bg-transparent italic outline-none" placeholder="Author (optional)" aria-label="Author" value={a.author ?? ""} onChange={(e) => updateAttributes({ author: e.target.value })} />
        <span className="shrink-0">{host ? `Read at ${host} →` : "Read →"}</span>
      </div>
    </NodeViewWrapper>
  );
}

/** A link shown as a reference block (publication, title, author) between black rules. */
export const LinkCard = Node.create({
  name: "linkCard",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ href: { default: "" }, title: { default: null }, site: { default: null }, author: { default: null } }),
  parseHTML: () => [{ tag: "a[data-link-card]" }],
  renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) => ["a", { "data-link-card": "", href: HTMLAttributes.href }, HTMLAttributes.title ?? ""],
  addNodeView() {
    return ReactNodeViewRenderer(LinkCardView, ownInputs);
  },
  addCommands() {
    return {
      insertLinkCard:
        (attrs: { href: string; title?: string; site?: string; author?: string }) =>
        ({ commands }: { commands: { insertContent: (c: object) => boolean } }) =>
          commands.insertContent([{ type: "linkCard", attrs }, { type: "paragraph" }]),
    };
  },
});

function FootnoteView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const [open, setOpen] = useState(!(node.attrs.text as string));
  const [value, setValue] = useState((node.attrs.text as string) ?? "");
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // Keep in step with edits made in the Notes list under the editor.
  useEffect(() => {
    if (!open) setValue((node.attrs.text as string) ?? "");
  }, [node.attrs.text, open]);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => boxRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);
  return (
    <NodeViewWrapper as="span" style={{ position: "relative" }}>
      <button
        type="button"
        className="footnote-ref"
        aria-label={`Footnote: ${node.attrs.text || "empty"}. Click to edit.`}
        onClick={() => setOpen((o) => !o)}
        style={{ border: 0, background: "none" }}
      />
      {open && (
        <span
          contentEditable={false}
          style={{ position: "absolute", left: 0, top: "1.6em", zIndex: 20, width: 360, background: "#fff", border: "1px solid #cfc9be", padding: 10, boxShadow: "0 6px 18px rgba(0,0,0,.12)", fontSize: 16, lineHeight: 1.4, display: "block" }}
        >
          <label style={{ display: "block", fontSize: 13, color: "#5c5852", marginBottom: 4 }}>Footnote text</label>
          <textarea
            ref={boxRef}
            aria-label="Footnote text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                updateAttributes({ text: value });
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            rows={3}
            style={{ width: "100%", border: "1px solid #cfc9be", padding: 6, fontFamily: "inherit", fontSize: 16 }}
          />
          <span style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="button" className="s-btn" onClick={() => { updateAttributes({ text: value }); setOpen(false); }}>Done</button>
            <button type="button" className="s-btn s-btn-danger" onClick={() => deleteNode()}>Remove</button>
          </span>
        </span>
      )}
    </NodeViewWrapper>
  );
}

/** Inline footnote marker; the note text is listed at the end of the post. */
export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ text: { default: "" } }),
  parseHTML: () => [{ tag: "span[data-footnote]" }],
  renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) => ["span", { "data-footnote": "", class: "footnote-ref", title: HTMLAttributes.text }],
  addNodeView() {
    return ReactNodeViewRenderer(FootnoteView, ownInputs);
  },
  addCommands() {
    return {
      insertFootnote:
        (text: string) =>
        ({ commands }: { commands: { insertContent: (c: object) => boolean } }) =>
          commands.insertContent({ type: "footnote", attrs: { text } }),
    };
  },
});

function BlockQuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="figure" className="block-quote">
      <blockquote>
        <NodeViewContent />
      </blockquote>
      <CiteField
        value={(node.attrs.cite as string) ?? ""}
        onChange={(cite) => updateAttributes({ cite })}
        placeholder="Source (optional), e.g. Pascal, Pensées 139"
      />
    </NodeViewWrapper>
  );
}

/** Block quote in the Commonplace style, with an optional source line. */
export const BlockQuoteWithSource = Blockquote.extend({
  addAttributes: () => ({ cite: { default: null } }),
  addNodeView() {
    return ReactNodeViewRenderer(BlockQuoteView, quoteInputs);
  },
});
