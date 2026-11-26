import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail } from "@/lib/email";
import { authUrl, isAdminEmail } from "@/lib/env";
import { signInEmail } from "@/emails/sign-in";
import { linkCapture } from "@/lib/test-signin";

/**
 * Only the admin (ADMIN_EMAIL) and confirmed subscribers may get a sign-in
 * link. Anyone else is silently ignored, so the form can't be used to send
 * mail to strangers or to discover who subscribes.
 */
async function maySignIn(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  const rows = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(
      and(
        eq(schema.subscribers.email, email.trim().toLowerCase()),
        eq(schema.subscribers.status, "confirmed"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export const auth = betterAuth({
  baseURL: authUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),
  emailAndPassword: { enabled: false },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // stay signed in for 60 days
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "subscriber" },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => ({
          data: { ...u, role: isAdminEmail(u.email) ? "admin" : "subscriber" },
        }),
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/magic-link": { window: 60 * 10, max: 5 },
      "/magic-link/verify": { window: 60, max: 10 },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        if (!(await maySignIn(email))) return;
        // Test sign-in: hand the link back instead of emailing it.
        const capture = linkCapture.getStore();
        if (capture) {
          capture.url = url;
          return;
        }
        const msg = signInEmail(url);
        await sendEmail({ to: email, ...msg });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
