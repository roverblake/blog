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

/** Rough "size" of a block in words, so pictures and previews count toward a clip. */
function blockWeight(b: BlockNode): number {
  if (b.type === "image" || b.type === "video") return 60;
  if (b.type === "audio") return 20;
  if (b.type === "linkCard") return 25;
  return countWords(blockText(b));
}

/** Cuts a paragraph's inline content after `words` words, ending with "…". */
function cutInline(nodes: InlineNode[], words: number): InlineNode[] {
  const out: InlineNode[] = [];
  let left = words;
  for (const n of nodes) {
    if (n.type !== "text") {
      if (n.type === "hardBreak") out.push(n);
      continue;
    }
    const count = countWords(n.text);
    if (count <= left) {
      out.push(n);
      left -= count;
      continue;
    }
    // Keep the first `left` words of this text run.
    const re = /[\p{L}\p{N}'’-]+/gu;
    let m: RegExpExecArray | null;
    let end = 0;
    for (let i = 0; i < left && (m = re.exec(n.text)); i++) end = m.index + m[0].length;
    out.push({ ...n, text: n.text.slice(0, end).replace(/[\s,;:.—–-]+$/, "") + "…" });
    return out;
  }
  return out;
}

/**
 * A shortened copy of a note for lists: whole blocks up to about `maxWords`,
 * then the next paragraph cut mid-way. Runs on the server, so the rest of the
 * note is never sent with the list.
 */
export function clipDoc(doc: Doc, maxWords = 80): { doc: Doc; clipped: boolean } {
  const blocks = doc.content ?? [];
  const kept: BlockNode[] = [];
  let used = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const w = blockWeight(b);
    if (used + w <= maxWords) {
      kept.push(b);
      used += w;
      continue;
    }
    const left = maxWords - used;
    if (b.type === "paragraph" && left >= 12) {
      kept.push({ ...b, content: cutInline(b.content ?? [], left) });
      return { doc: { ...doc, content: kept }, clipped: true };
    }
    if (kept.length === 0) {
      // Never show an empty note: keep the first block whole.
      kept.push(b);
      return { doc: { ...doc, content: kept }, clipped: blocks.slice(i + 1).some((r) => blockWeight(r) > 0) };
    }
    return { doc: { ...doc, content: kept }, clipped: true };
  }
  return { doc, clipped: false };
}
