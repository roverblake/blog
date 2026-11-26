import "server-only";
import { getSetting } from "@/lib/settings";

export type FooterLink = { label: string; href: string };
export type FooterColumn = { heading: string; links: FooterLink[] };
export type FooterContent = { columns: FooterColumn[]; credit: string };

export const DEFAULT_FOOTER: FooterContent = {
  columns: [
    { heading: "Read", links: [{ label: "Essays", href: "/essays" }, { label: "Notes", href: "/notes" }, { label: "Archive", href: "/archive" }] },
    { heading: "Parish", links: [{ label: "Letters", href: "/letters" }, { label: "Sermons", href: "/sermons" }] },
    { heading: "About", links: [{ label: "About Blake", href: "/about" }, { label: "Subscribe", href: "/subscribe" }, { label: "Privacy", href: "/privacy" }] },
  ],
  credit: "Scripture quotations from the ESV® Bible · esv.org",
};

/** Footer columns and credit line, as edited in Studio → Settings. Falls back to the defaults. */
export async function getFooterContent(): Promise<FooterContent> {
  try {
    const saved = await getSetting<Partial<FooterContent> | null>("footer", null);
    if (!saved) return DEFAULT_FOOTER;
    return {
      columns: Array.isArray(saved.columns) ? saved.columns.map(renameCommonplace) : DEFAULT_FOOTER.columns,
      credit: typeof saved.credit === "string" ? saved.credit : DEFAULT_FOOTER.credit,
    };
  } catch {
    return DEFAULT_FOOTER;
  }
}

/** Commonplace became Notes: update links saved before the rename. */
function renameCommonplace(col: FooterColumn): FooterColumn {
  return {
    ...col,
    links: (col.links ?? []).map((l) => {
      if (!l.href?.startsWith("/commonplace")) return l;
      return {
        label: /^commonplace$/i.test(l.label.trim()) ? "Notes" : l.label,
        href: l.href.replace(/^\/commonplace/, "/notes"),
      };
    }),
  };
}
