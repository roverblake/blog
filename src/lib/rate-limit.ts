import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";

/**
 * Fixed-window rate limit stored in the database (shared with Better Auth's
 * table). Returns true if the action is allowed.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const id = `app:${key}`;
  const rows = await db
    .insert(schema.rateLimit)
    .values({ id, key: id, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: schema.rateLimit.key,
      set: {
        count: sql`case when ${schema.rateLimit.lastRequest} < ${windowStart} then 1 else ${schema.rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${schema.rateLimit.lastRequest} < ${windowStart} then ${now} else ${schema.rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: schema.rateLimit.count });
  return (rows[0]?.count ?? 1) <= max;
}

/** Best guess at the visitor's IP address (Railway sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
