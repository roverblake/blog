/**
 * The TipTap document shape stored in posts.content.
 * The editor (Stage 1, Studio step) produces exactly these node types.
 */
export type Mark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "strike" }
  | { type: "underline" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string } };

export type TextNode = { type: "text"; text: string; marks?: Mark[] };
export type HardBreak = { type: "hardBreak" };
/** Inline footnote; its text is shown in the Notes list at the end. */
export type FootnoteNode = { type: "footnote"; attrs?: { text?: string } };
export type InlineNode = TextNode | HardBreak | FootnoteNode;

export type Paragraph = { type: "paragraph"; content?: InlineNode[] };
export type Heading = { type: "heading"; attrs?: { level?: number }; content?: InlineNode[] };
export type Blockquote = { type: "blockquote"; attrs?: { cite?: string | null }; content?: BlockNode[] };
export type PullQuote = { type: "pullQuote"; attrs?: { cite?: string | null }; content?: Paragraph[] };
export type ListItem = { type: "listItem"; content?: BlockNode[] };
export type BulletList = { type: "bulletList"; content?: ListItem[] };
export type OrderedList = { type: "orderedList"; attrs?: { start?: number }; content?: ListItem[] };
export type HorizontalRule = { type: "horizontalRule" };
export type ImageNode = {
  type: "image";
  attrs: {
    src: string;
    alt?: string | null;
    caption?: string | null;
    credit?: string | null;
    mediaId?: string | null;
  };
};
/** Everything after this node is for subscribers only. */
export type PaywallNode = { type: "paywall" };

export type BlockNode =
  | Paragraph
  | Heading
  | Blockquote
  | PullQuote
  | BulletList
  | OrderedList
  | ListItem
  | HorizontalRule
  | ImageNode
  | PaywallNode;

export type Doc = { type: "doc"; content?: BlockNode[] };

export const emptyDoc: Doc = { type: "doc", content: [] };

export function asDoc(value: unknown): Doc {
  if (value && typeof value === "object" && (value as Doc).type === "doc") return value as Doc;
  return emptyDoc;
}
