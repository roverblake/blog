"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminEmail } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { linkCapture, testPasswordEnabled } from "@/lib/test-signin";

/** Signs in as the admin with TEST_ADMIN_PASSWORD (testing only; remove before launch). */
export async function testSignIn(_prev: { error?: string; url?: string } | null, form: FormData): Promise<{ error?: string; url?: string }> {
  if (!testPasswordEnabled() || !adminEmail()) return { error: "Test sign-in is turned off." };
  if (!(await rateLimit(`test-signin:${await clientIp()}`, 5, 600))) {
    return { error: "Too many tries. Please wait ten minutes." };
  }
  const given = Buffer.from(String(form.get("password") ?? ""));
  const wanted = Buffer.from(process.env.TEST_ADMIN_PASSWORD!);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return { error: "That password isn't right." };

  const capture: { url?: string } = {};
  const h = await headers();
  await linkCapture.run(capture, () => auth.api.signInMagicLink({ body: { email: adminEmail(), callbackURL: "/studio" }, headers: h }));
  if (!capture.url) return { error: "Couldn't sign in. Check ADMIN_EMAIL is set." };
  return { url: capture.url };
}
