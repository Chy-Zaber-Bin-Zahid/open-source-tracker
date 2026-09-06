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

/** Start of the period, or null for all time. */
export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = (start.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - day);
  } else {
    start.setDate(1);
  }
  return start;
}

/** Same-length window immediately before the current one, for comparisons. */
export function previousWindow(period: Period, now = new Date()): { start: Date; end: Date } | null {
  const start = periodStart(period, now);
  if (!start) return null;
  const prevStart = new Date(start);
  if (period === "week") prevStart.setDate(prevStart.getDate() - 7);
  else prevStart.setMonth(prevStart.getMonth() - 1);
  return { start: prevStart, end: start };
}

export function periodTitle(period: Period, now = new Date()): string {
  if (period === "all") return "All time";
  if (period === "week") {
    const start = periodStart("week", now)!;
    return `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
