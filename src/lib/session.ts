import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";

/** The signed-in user's session on the server, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** True if the visitor is the admin. ADMIN_EMAIL is the single source of truth. */
export async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  return isAdminEmail(s?.user.email);
}

/** Use at the top of every /studio page and server action. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/sign-in?next=/studio");
  if (!isAdminEmail(s.user.email)) redirect("/");
  return s;
}
