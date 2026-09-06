import { APP_TZ, civilKey, shiftDays, startOfZonedDay, zonedParts } from "./tz";

export const PERIODS = ["week", "month", "all"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  all: "All time",
};

export function parsePeriod(value: unknown): Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value) ? (value as Period) : "all";
}

/** Civil date on which the current period began, in the office timezone. */
function startCivil(period: Exclude<Period, "all">, now: Date) {
  const today = zonedParts(now);
  if (period === "month") return { year: today.year, month: today.month, day: 1 };
  // Week runs Monday to Sunday.
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  return shiftDays(today, -((weekday + 6) % 7));
}

/** Start of the period, or null for all time. Anchored to the office timezone. */
export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  const c = startCivil(period, now);
  return startOfZonedDay(c.year, c.month, c.day);
}

/** Same-length window immediately before the current one, for comparisons. */
export function previousWindow(period: Period, now = new Date()): { start: Date; end: Date } | null {
  if (period === "all") return null;
  const c = startCivil(period, now);
  const prev = period === "week" ? shiftDays(c, -7) : { year: c.month === 1 ? c.year - 1 : c.year, month: c.month === 1 ? 12 : c.month - 1, day: 1 };
  return { start: startOfZonedDay(prev.year, prev.month, prev.day), end: startOfZonedDay(c.year, c.month, c.day) };
}

export function periodTitle(period: Period, now = new Date()): string {
  if (period === "all") return "All time";
  if (period === "week") {
    const c = startCivil("week", now);
    const d = new Date(`${civilKey(c)}T12:00:00Z`);
    return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  }
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: APP_TZ });
}
