/** Small helpers for reading environment variables. */
function validUrl(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().replace(/\/$/, "");
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}

/**
 * The site's public address. Uses SITE_URL; if that is missing or not a
 * real address, falls back to Railway's generated domain, then localhost.
 */
export function siteUrl(): string {
  return (
    validUrl(process.env.SITE_URL) ??
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : null) ??
    "http://localhost:3000"
  );
}

/** Address used for sign-in links; BETTER_AUTH_URL if valid, else siteUrl(). */
export function authUrl(): string {
  return validUrl(process.env.BETTER_AUTH_URL) ?? siteUrl();
}

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = adminEmail();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}
