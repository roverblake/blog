import type { BlockNode, Doc, InlineNode } from "./types";

/** Converts a stored post document to Markdown (for "Export everything"). */
export function docToMarkdown(doc: Doc, mapImage: (src: string) => string = (s) => s): string {
  const notes: string[] = [];
  const esc = (t: string) => t.replace(/([\\`*_[\]#])/g, "\\$1");

  const inline = (nodes: InlineNode[] | undefined): string =>
    (nodes ?? [])
      .map((n) => {
        if (!n || typeof n !== "object") return "";
        if (n.type === "hardBreak") return "  \n";
        if (n.type === "footnote") {
          const t = n.attrs?.text?.trim();
          if (!t) return "";
          notes.push(t);
          return `[^${notes.length}]`;
        }
        if (n.type !== "text") return "";
        let t = esc(n.text);
        for (const m of n.marks ?? []) {
          if (m.type === "bold") t = `**${t}**`;
          else if (m.type === "italic") t = `*${t}*`;
          else if (m.type === "strike") t = `~~${t}~~`;
          else if (m.type === "code") t = `\`${t}\``;
          else if (m.type === "link") t = `[${t}](${m.attrs.href})`;
        }
        return t;
      })
      .join("");

  const block = (b: BlockNode, prefix = ""): string => {
    switch (b.type) {
      case "paragraph":
        return prefix + inline(b.content);
      case "video": {
        const a = (b as { attrs?: { provider?: string; id?: string; caption?: string | null } }).attrs ?? {};
        const url = a.provider === "vimeo" ? `https://vimeo.com/${a.id}` : `https://www.youtube.com/watch?v=${a.id}`;
        return `[Video${a.caption ? `: ${a.caption}` : ""}](${url})`;
      }
      case "linkCard": {
        const a = (b as { attrs?: { href?: string; title?: string | null; site?: string | null; author?: string | null } }).attrs ?? {};
        return `> [${a.title || a.href}](${a.href})${a.site || a.author ? `  \n> ${[a.site, a.author].filter(Boolean).join(" · ")}` : ""}`;
      }
      case "audio": {
        const a = (b as { attrs?: { src?: string; title?: string | null } }).attrs ?? {};
        return `[Audio${a.title ? `: ${a.title}` : ""}](${a.src})`;
      }
      case "heading":
        return `${b.attrs?.level === 3 ? "###" : "##"} ${inline(b.content)}`;
      case "blockquote":
      case "pullQuote": {
        const inner = (b.content ?? []).map((c) => block(c as BlockNode)).join("\n\n");
        const cite = b.attrs?.cite ? `\n\n— ${b.attrs.cite}` : "";
        return (inner + cite)
          .split("\n")
          .map((l) => `> ${l}`.trimEnd())
          .join("\n");
      }
      case "bulletList":
        return (b.content ?? []).map((li) => "- " + (li.content ?? []).map((c) => block(c)).join("\n  ")).join("\n");
      case "orderedList":
        return (b.content ?? []).map((li, i) => `${i + 1}. ` + (li.content ?? []).map((c) => block(c)).join("\n   ")).join("\n");
      case "horizontalRule":
        return "* * *";
      case "image": {
        const a = b.attrs ?? { src: "" };
        const cap = [a.caption, a.credit].filter(Boolean).join(" · ");
        return `![${a.alt ?? ""}](${mapImage(a.src)})${cap ? `\n*${cap}*` : ""}`;
      }
      case "paywall":
        return "<!-- paywall: subscribers only below this line -->";
      default:
        return "";
    }
  };

  const body = (doc.content ?? []).map((b) => block(b)).filter(Boolean).join("\n\n");
  const fn = notes.length ? "\n\n" + notes.map((t, i) => `[^${i + 1}]: ${t}`).join("\n") : "";
  return body + fn + "\n";
}
