import "server-only";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSetting } from "@/lib/settings";

export type NewsletterCopy = { label: string; heading: string; body: string; button: string };
export type ListOption = { slug: "essays" | "parish"; name: string; cadence: string; show: boolean; checked: boolean };

export const DEFAULT_COPY: NewsletterCopy = {
  label: "Newsletters",
  heading: "Read along, free",
  body: "Choose what arrives in your inbox. Subscribers can read every essay and the full archive.",
  button: "Subscribe",
};

const DEFAULT_OPTIONS: Record<string, Omit<ListOption, "slug" | "name">> = {
  essays: { cadence: "Every other Monday", show: true, checked: true },
  parish: { cadence: "Sundays", show: true, checked: false },
};

/** Wording for the newsletter box, as edited in Studio → Settings. */
export async function getNewsletterCopy(): Promise<NewsletterCopy> {
  const saved = await getSetting<Partial<NewsletterCopy>>("newsletterCopy", {});
  // An empty label, heading or button falls back to the default; an empty
  // description is allowed (it hides the description).
  const pick = (k: keyof NewsletterCopy) => {
    const v = saved[k];
    if (typeof v !== "string") return DEFAULT_COPY[k];
    return v.trim() || k === "body" ? v.trim() : DEFAULT_COPY[k];
  };
  return { label: pick("label"), heading: pick("heading"), body: pick("body"), button: pick("button") };
}

/** The newsletter choices, with names from the lists table and display options from settings. */
export async function getListOptions(): Promise<ListOption[]> {
  const [rows, saved] = await Promise.all([
    db.select().from(schema.lists).orderBy(asc(schema.lists.position)),
    getSetting<Record<string, Partial<ListOption>>>("newsletterOptions", {}),
  ]);
  return rows
    .filter((r): r is typeof r & { slug: "essays" | "parish" } => r.slug === "essays" || r.slug === "parish")
    .map((r) => {
      const d = DEFAULT_OPTIONS[r.slug];
      const s = saved[r.slug] ?? {};
      return {
        slug: r.slug,
        name: r.name,
        cadence: r.description ?? d.cadence,
        show: s.show ?? d.show,
        checked: s.checked ?? d.checked,
      };
    });
}
