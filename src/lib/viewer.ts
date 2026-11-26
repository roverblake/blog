import "server-only";
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { isAdminEmail } from "@/lib/env";
import { getSession } from "@/lib/session";

export type Viewer = {
  email: string | null;
  isAdmin: boolean;
  /** May read Subscribers-only posts. */
  hasAccess: boolean;
};

/** Who is looking at this page. Cached for the length of one request. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const s = await getSession();
  const email = s?.user.email?.toLowerCase() ?? null;
  if (!email) return { email: null, isAdmin: false, hasAccess: false };
  if (isAdminEmail(email)) return { email, isAdmin: true, hasAccess: true };
  const rows = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(and(eq(schema.subscribers.email, email), eq(schema.subscribers.status, "confirmed")))
    .limit(1);
  return { email, isAdmin: false, hasAccess: rows.length > 0 };
});
