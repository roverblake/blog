/** All public dates are shown in Blake's time zone. */
export const SITE_TZ = "America/Chicago";

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: SITE_TZ, ...opts });

/** "Wednesday, November 25, 2026" */
export const longDate = (d: Date) =>
  fmt({ weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(d);
/** "November 25, 2026" */
export const fullDate = (d: Date) => fmt({ year: "numeric", month: "long", day: "numeric" }).format(d);
/** "Nov 25, 2026" */
export const shortDate = (d: Date) => fmt({ year: "numeric", month: "short", day: "numeric" }).format(d);
/** "Nov 25" */
export const monthDay = (d: Date) => fmt({ month: "short", day: "numeric" }).format(d);
/** { year: 2026, month: 11, monthName: "November" } in Chicago time */
export function yearMonth(d: Date) {
  const parts = fmt({ year: "numeric", month: "numeric" }).formatToParts(d);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const monthName = fmt({ month: "long" }).format(d);
  return { year, month, monthName };
}

/** Offset in minutes of SITE_TZ from UTC at a given instant (e.g. -360). */
function tzOffsetMinutes(at: Date): number {
  const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    .formatToParts(at)
    .reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-12-01T09:00" typed in Chicago time → the real moment (UTC Date). */
export function chicagoLocalToUtc(local: string): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle the daylight-saving changeover correctly.
  let ts = guess - tzOffsetMinutes(new Date(guess)) * 60000;
  ts = guess - tzOffsetMinutes(new Date(ts)) * 60000;
  return new Date(ts);
}

/** A UTC Date → "2026-12-01T09:00" in Chicago time (for datetime inputs). */
export function utcToChicagoLocal(d: Date): string {
  const shifted = new Date(d.getTime() + tzOffsetMinutes(d) * 60000);
  return shifted.toISOString().slice(0, 16);
}

/** "Dec 1, 2026, 9:00 AM" in Chicago time. */
export const dateTime = (d: Date) =>
  fmt({ year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
