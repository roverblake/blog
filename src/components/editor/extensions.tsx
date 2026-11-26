"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import { TextSelection } from "@tiptap/pm/state";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

/** Let typing in a node's own inputs (captions, footnote box) bypass the editor. */
const ownInputs = {
  stopEvent: ({ event }: { event: Event }) => {
    const t = event.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON");
  },
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paywall: { setPaywall: () => ReturnType };
    pullQuote: { setPullQuote: () => ReturnType };
    image: { insertImage: (attrs: { src: string; mediaId?: string; alt?: string }) => ReturnType };
    footnote: { insertFootnote: (text: string) => ReturnType };
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

function PullQuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="blockquote" className="pull-quote">
      <NodeViewContent />
      <input
        className="cite-input"
        aria-label="Source of the quotation"
        placeholder="Source (e.g. Augustine, Confessions I.1)"
        value={(node.attrs.cite as string) ?? ""}
        onChange={(e) => updateAttributes({ cite: e.target.value })}
        contentEditable={false}
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
    return ReactNodeViewRenderer(PullQuoteView, ownInputs);
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
  const a = node.attrs as { src: string; alt: string | null; caption: string | null; credit: string | null };
  return (
    <NodeViewWrapper as="figure" data-drag-handle className={selected ? "ProseMirror-selectednode" : ""}>
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

function FootnoteView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const [open, setOpen] = useState(!(node.attrs.text as string));
  const [value, setValue] = useState((node.attrs.text as string) ?? "");
  const boxRef = useRef<HTMLTextAreaElement>(null);
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
      <input
        className="cite-input"
        aria-label="Source of the quotation"
        placeholder="Source (optional), e.g. Pascal, Pensées 139"
        value={(node.attrs.cite as string) ?? ""}
        onChange={(e) => updateAttributes({ cite: e.target.value })}
        style={{ display: "block", width: "100%", border: 0, background: "transparent" }}
      />
    </NodeViewWrapper>
  );
}

/** Block quote in the Commonplace style, with an optional source line. */
export const BlockQuoteWithSource = Blockquote.extend({
  addAttributes: () => ({ cite: { default: null } }),
  addNodeView() {
    return ReactNodeViewRenderer(BlockQuoteView, ownInputs);
  },
});
