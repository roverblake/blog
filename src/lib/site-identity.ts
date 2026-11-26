import "server-only";
import { getSetting } from "@/lib/settings";
import { TAGLINE } from "@/lib/site";

export type SiteIdentity = { title: string; tagline: string };
export const DEFAULT_IDENTITY: SiteIdentity = { title: "Blake Johnson", tagline: TAGLINE };

/**
 * Site name and tagline, as edited in Studio → Settings. An empty name falls back
 * to the default; an empty tagline (once saved) means no tagline is shown.
 */
export async function getSiteIdentity(): Promise<SiteIdentity> {
  let saved: Partial<SiteIdentity> = {};
  try {
    saved = await getSetting<Partial<SiteIdentity>>("siteIdentity", {});
  } catch {
    // The database isn't reachable while Railway builds the site; use the defaults.
  }
  const pick = (k: keyof SiteIdentity) => (typeof saved[k] === "string" && saved[k]!.trim()) || DEFAULT_IDENTITY[k];
  const tagline = typeof saved.tagline === "string" ? saved.tagline.trim() : DEFAULT_IDENTITY.tagline;
  return { title: pick("title"), tagline };
}
