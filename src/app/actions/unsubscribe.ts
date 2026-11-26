"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { unsubscribeByToken } from "@/lib/subscriptions";

export async function doUnsubscribe(token: string, list: string) {
  if (!/^(all|essays|parish)$/.test(list)) return { ok: false as const };
  const res = await unsubscribeByToken(token, list);
  if (!res) return { ok: false as const };
  const listName =
    list === "all" ? "any newsletters" : ((await db.select().from(schema.lists).where(eq(schema.lists.slug, list)).limit(1))[0]?.name ?? "this newsletter");
  return { ok: true as const, email: res.email, listName };
}
