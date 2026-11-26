import type { BlockNode, Doc, InlineNode } from "./types";

function inlineText(nodes: InlineNode[] | undefined): string {
  if (!nodes) return "";
  return nodes.map((n) => (n.type === "text" ? n.text : n.type === "hardBreak" ? "\n" : "")).join("");
}

function blockText(node: BlockNode): string {
  switch (node.type) {
    case "paragraph":
    case "heading":
      return inlineText(node.content);
    case "blockquote":
    case "listItem":
    case "bulletList":
    case "orderedList":
    case "pullQuote":
      return (node.content ?? []).map((c) => blockText(c as BlockNode)).join("\n");
    case "linkCard":
      return node.attrs?.title ?? "";
    default:
      return "";
  }
}

/** Plain text of a document, one block per line. */
export function docToText(doc: Doc): string {
  return (doc.content ?? []).map(blockText).filter(Boolean).join("\n\n");
}

export function countWords(text: string): number {
  const m = text.trim().match(/[\p{L}\p{N}'’-]+/gu);
  return m ? m.length : 0;
}

/** Minutes to read at ~230 words a minute, at least 1. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}

/** Text of the first paragraph (used as a teaser when there is no summary). */
export function firstParagraphText(doc: Doc): string {
  const p = (doc.content ?? []).find((b) => b.type === "paragraph" && inlineText(b.content).trim());
  return p && p.type === "paragraph" ? inlineText(p.content) : "";
}

/** First pull quote (or block quote) in a document, with its citation. */
export function firstQuote(doc: Doc): { text: string; cite: string | null } | null {
  for (const b of doc.content ?? []) {
    if (b.type === "pullQuote") return { text: blockText(b).trim(), cite: b.attrs?.cite ?? null };
    if (b.type === "blockquote") return { text: blockText(b).trim(), cite: b.attrs?.cite ?? null };
  }
  return null;
}
