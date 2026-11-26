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
