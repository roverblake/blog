import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { asDoc, type Doc } from "@/lib/content/types";

export const TAGLINE = "Reading, thinking, and writing in the light of faith";

export const getSetting = cache(async <T>(key: string, fallback: T): Promise<T> => {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  const v = rows[0]?.value;
  return (v === undefined || v === null || v === "" ? fallback : v) as T;
});

export async function setSetting(key: string, value: unknown) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}

export async function getAboutDoc(): Promise<Doc> {
  return asDoc(await getSetting<unknown>("about", null));
}
