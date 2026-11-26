import "server-only";
import { getSetting } from "@/lib/settings";
import { TAGLINE } from "@/lib/site";

export type SiteIdentity = { title: string; tagline: string };
export const DEFAULT_IDENTITY: SiteIdentity = { title: "Blake Johnson", tagline: TAGLINE };

/** Site name and tagline, as edited in Studio → Settings. Empty fields fall back to the defaults. */
export async function getSiteIdentity(): Promise<SiteIdentity> {
  const saved = await getSetting<Partial<SiteIdentity>>("siteIdentity", {});
  const pick = (k: keyof SiteIdentity) => (typeof saved[k] === "string" && saved[k]!.trim()) || DEFAULT_IDENTITY[k];
  return { title: pick("title"), tagline: pick("tagline") };
}
