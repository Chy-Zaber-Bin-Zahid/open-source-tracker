import { APP_TZ, civilKey, shiftDays, startOfZonedDay, zonedParts } from "./tz";

export const PERIODS = ["week", "month", "all"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = {
  week: "Last 7 days",
  month: "This month",
  all: "All time",
};

/** Falls back to the rolling week: the default view is "what has the team merged lately". */
export const DEFAULT_PERIOD: Period = "week";

export function parsePeriod(value: unknown, fallback: Period = DEFAULT_PERIOD): Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value) ? (value as Period) : fallback;
}

/** How many whole days the rolling window covers, today included. */
export const WEEK_DAYS = 7;

/**
 * Civil date on which the current period began, in the office timezone.
 *
 * "week" is a rolling window of the last WEEK_DAYS days rather than a calendar
 * Monday-to-Sunday one. A calendar week made the default view nearly empty every
 * Monday morning, and — worse — previousWindow compared that partial week against
 * a full previous one, so the "vs last week" delta read negative for most of the
 * week regardless of how much shipped. A rolling window is always the same
 * length, so the comparison is finally like for like, and it matches the day
 * buckets the sparkline and the per-member week count already use.
 */
function startCivil(period: Exclude<Period, "all">, now: Date) {
  const today = zonedParts(now);
  if (period === "month") return { year: today.year, month: today.month, day: 1 };
  return shiftDays(today, -(WEEK_DAYS - 1));
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
  const prev =
    period === "week"
      ? shiftDays(c, -WEEK_DAYS)
      : { year: c.month === 1 ? c.year - 1 : c.year, month: c.month === 1 ? 12 : c.month - 1, day: 1 };
  return { start: startOfZonedDay(prev.year, prev.month, prev.day), end: startOfZonedDay(c.year, c.month, c.day) };
}

export function periodTitle(period: Period, now = new Date()): string {
  if (period === "all") return "All time";
  if (period === "week") {
    const c = startCivil("week", now);
    const d = new Date(`${civilKey(c)}T12:00:00Z`);
    return `Since ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  }
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: APP_TZ });
}
