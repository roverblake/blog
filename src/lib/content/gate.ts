import type { BlockNode, Doc } from "./types";

/** How many blocks to show when a gated post has no paywall line placed. */
const DEFAULT_PREVIEW_BLOCKS = 3;

export type GatedDoc = { doc: Doc; truncated: boolean };

/**
 * Server-only. Returns the part of a document a visitor may receive.
 * Readers without access get everything before the paywall line and nothing
 * after it. The removed blocks never leave the server.
 */
export function gateDoc(doc: Doc, opts: { gated: boolean; hasAccess: boolean; locked?: boolean }): GatedDoc {
  const blocks = doc.content ?? [];
  const withoutMarker = (bs: BlockNode[]) => bs.filter((b) => b.type !== "paywall");

  if (!opts.gated || opts.hasAccess) {
    return { doc: { type: "doc", content: withoutMarker(blocks) }, truncated: false };
  }
  // A fully locked post shows nothing but its title and subtitle.
  if (opts.locked) return { doc: { type: "doc", content: [] }, truncated: true };
  const idx = blocks.findIndex((b) => b.type === "paywall");
  const visible = idx >= 0 ? blocks.slice(0, idx) : blocks.slice(0, DEFAULT_PREVIEW_BLOCKS);
  return { doc: { type: "doc", content: withoutMarker(visible) }, truncated: true };
}
