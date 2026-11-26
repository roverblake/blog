/**
 * Renders a stored TipTap document as the public article body (server only).
 * Pass a document that has already been through gateDoc().
 */
import { Fragment, type ReactNode } from "react";
import type { BlockNode, Doc, InlineNode, Mark, Paragraph, TextNode } from "@/lib/content/types";
import { safeHref } from "@/lib/urls";

type Ctx = { footnotes: string[] };

/** Number of words set in small capitals after the drop cap (§5). */
const LEAD_IN_WORDS = 5;

function applyMarks(text: ReactNode, marks: Mark[] | undefined, key: string): ReactNode {
  let out = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") out = <strong key={key + "b"}>{out}</strong>;
    else if (m.type === "italic") out = <em key={key + "i"}>{out}</em>;
    else if (m.type === "link") {
      const href = safeHref(m.attrs.href);
      if (href) {
        const external = /^https?:/.test(href);
        out = (
          <a key={key + "a"} href={href} {...(external ? { rel: "noopener" } : {})}>
            {out}
          </a>
        );
      }
    }
  }
  return out;
}

function renderInline(nodes: InlineNode[] | undefined, ctx: Ctx, keyPrefix = ""): ReactNode[] {
  return (nodes ?? []).map((n, i) => {
    const key = `${keyPrefix}${i}`;
    if (!n || typeof n !== "object") return null;
    if (n.type === "text") return <Fragment key={key}>{applyMarks(n.text, n.marks, key)}</Fragment>;
    if (n.type === "hardBreak") return <br key={key} />;
    if (n.type === "footnote") {
      const text = n.attrs?.text?.trim();
      if (!text) return null;
      ctx.footnotes.push(text);
      const num = ctx.footnotes.length;
      return (
        <sup key={key} id={`fnref-${num}`}>
          <a href={`#fn-${num}`} aria-label={`Note ${num}`}>
            {num}
          </a>
        </sup>
      );
    }
    return null;
  });
}

/**
 * Splits the opening of a paragraph into: drop-cap letter, small-caps lead-in
 * (rest of the first few words), and the remaining inline nodes.
 */
function splitOpening(p: Paragraph): { cap: string; leadIn: TextNode[]; rest: InlineNode[] } | null {
  const nodes = p.content ?? [];
  const first = nodes[0];
  if (!first || first.type !== "text") return null;
  const m = first.text.match(/^\s*([“"‘'(\[]?)(\p{L}|\p{N})/u);
  if (!m) return null;
  const cap = m[1] + m[2];
  const afterCap = first.text.slice(m[0].length);
  const remaining: InlineNode[] = [{ ...first, text: afterCap }, ...nodes.slice(1)];

  // Take the rest of the first word plus the next words, across text nodes.
  const leadIn: TextNode[] = [];
  let words = 0;
  let restStart = remaining.length;
  let restHead: TextNode | null = null;
  for (let i = 0; i < remaining.length; i++) {
    const n = remaining[i];
    if (words >= LEAD_IN_WORDS || n.type !== "text") {
      restStart = i;
      break;
    }
    // A leading space means the first word was a single letter (e.g. "I am").
    if (i === 0 && /^\s/.test(n.text)) words = 1;
    const re = /\S+\s*/g;
    let consumed = 0;
    while (words < LEAD_IN_WORDS && re.exec(n.text)) {
      consumed = re.lastIndex;
      words++;
    }
    if (consumed >= n.text.length) {
      leadIn.push(n);
      continue;
    }
    // Keep the space between the lead-in and the rest outside the small caps.
    const head = n.text.slice(0, consumed).replace(/\s+$/, "");
    leadIn.push({ ...n, text: head });
    restHead = { ...n, text: n.text.slice(head.length) };
    restStart = i + 1;
    break;
  }
  const rest: InlineNode[] = restHead ? [restHead, ...remaining.slice(restStart)] : remaining.slice(restStart);
  return { cap, leadIn, rest };
}

export function DropCapParagraph({ p, ctx, after }: { p: Paragraph; ctx: Ctx; after?: ReactNode }) {
  const parts = splitOpening(p);
  if (!parts) {
    return (
      <p>
        {renderInline(p.content, ctx)}
        {after}
      </p>
    );
  }
  return (
    <p>
      <span className="dropcap" aria-hidden="true">
        {parts.cap}
      </span>
      <span className="sr-only">{parts.cap}</span>
      <span className="lead-in">{renderInline(parts.leadIn, ctx, "l")}</span>
      {renderInline(parts.rest, ctx, "r")}
      {after}
    </p>
  );
}

function renderBlock(b: BlockNode, i: number, ctx: Ctx): ReactNode {
  switch (b.type) {
    case "paragraph":
      return <p key={i}>{renderInline(b.content, ctx)}</p>;
    case "heading":
      return <h2 key={i}>{renderInline(b.content, ctx)}</h2>;
    case "blockquote":
      return (
        <figure key={i} className="block-quote">
          <blockquote>{(b.content ?? []).map((c, j) => renderBlock(c, j, ctx))}</blockquote>
          {b.attrs?.cite ? <figcaption>{b.attrs.cite}</figcaption> : null}
        </figure>
      );
    case "pullQuote":
      return (
        <blockquote key={i} className="pull-quote">
          {(b.content ?? []).map((c, j) => (
            <p key={j}>{renderInline(c.content, ctx)}</p>
          ))}
          {b.attrs?.cite ? <cite>{b.attrs.cite}</cite> : null}
        </blockquote>
      );
    case "bulletList":
      return <ul key={i}>{(b.content ?? []).map((c, j) => renderBlock(c, j, ctx))}</ul>;
    case "orderedList":
      return (
        <ol key={i} start={b.attrs?.start}>
          {(b.content ?? []).map((c, j) => renderBlock(c, j, ctx))}
        </ol>
      );
    case "listItem":
      return (
        <li key={i}>
          {(b.content ?? []).map((c, j) =>
            c.type === "paragraph" ? <Fragment key={j}>{renderInline(c.content, ctx)}</Fragment> : renderBlock(c, j, ctx),
          )}
        </li>
      );
    case "horizontalRule":
      return (
        <div key={i} className="divider" role="separator">
          <span aria-hidden="true">· · ·</span>
        </div>
      );
    case "image": {
      const { src, alt, caption, credit } = b.attrs ?? { src: "" };
      const href = safeHref(src);
      if (!href) return null;
      return (
        <figure key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={href} alt={alt ?? ""} loading="lazy" decoding="async" />
          {caption || credit ? (
            <figcaption className="caption-row">
              <span className="caption">{caption}</span>
              {credit ? <span className="credit">{credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    default:
      return null;
  }
}

export function ArticleBody({
  doc,
  dropCap,
  fadeLast = false,
}: {
  doc: Doc;
  dropCap: boolean;
  /** Fade out the last block (used right before the subscriber gate). */
  fadeLast?: boolean;
}) {
  const ctx: Ctx = { footnotes: [] };
  const blocks = doc.content ?? [];
  const firstParaIdx = dropCap ? blocks.findIndex((b) => b.type === "paragraph" && (b.content?.length ?? 0) > 0) : -1;

  const rendered = blocks.map((b, i) => {
    let el: ReactNode =
      i === firstParaIdx && b.type === "paragraph" ? <DropCapParagraph key={i} p={b} ctx={ctx} /> : renderBlock(b, i, ctx);
    if (fadeLast && i === blocks.length - 1) {
      el = (
        <div key={i} className="gate-fade">
          {el}
        </div>
      );
    }
    return el;
  });

  return (
    <>
      {rendered}
      {ctx.footnotes.length > 0 && (
        <section className="footnotes" aria-labelledby="notes-heading">
          <div className="section-label">
            <h2 id="notes-heading">Notes</h2>
          </div>
          <ol>
            {ctx.footnotes.map((t, n) => (
              <li key={n} id={`fn-${n + 1}`}>
                {t}
                <a className="backref" href={`#fnref-${n + 1}`} aria-label={`Back to note ${n + 1} in the text`}>
                  ↩
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
