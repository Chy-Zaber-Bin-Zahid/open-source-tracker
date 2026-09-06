/**
 * Timezone handling.
 *
 * Every day boundary in this app — week and month windows, sparkline buckets,
 * day streaks — must agree with the timezone Postgres is using, or counts land
 * in the wrong bucket. Two rules follow from that:
 *
 *   1. Never use `toISOString().slice(0, 10)` for a day key. That is always UTC,
 *      regardless of the process timezone, so it disagrees with Postgres for
 *      however many hours the office timezone is offset from UTC.
 *   2. Never rely on the process timezone (`TZ`). Vercel reserves that variable
 *      and pins functions to UTC, so it cannot be set there at all.
 *
 * The office timezone therefore comes from APP_TZ and is applied explicitly.
 */

export const APP_TZ = process.env.APP_TZ || process.env.TZ || "UTC";

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Civil (wall-clock) date and time at `instant`, as seen in `tz`. */
export function zonedParts(instant: Date, tz: string = APP_TZ): Parts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24, // some locales render midnight as 24
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** "YYYY-MM-DD" for `instant` in `tz`. Matches Postgres `occurred_at::date`. */
export function dayKey(instant: Date, tz: string = APP_TZ): string {
  const p = zonedParts(instant, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function offsetMs(instant: Date, tz: string): number {
  const p = zonedParts(instant, tz);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - (instant.getTime() - instant.getMilliseconds());
}

/**
 * The instant at which the given civil date begins in `tz`.
 * Resolved twice so a day that starts across a DST transition still lands on
 * the correct offset (Asia/Dhaka has no DST, but the app should not assume it).
 */
export function startOfZonedDay(year: number, month: number, day: number, tz: string = APP_TZ): Date {
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);
  const first = new Date(naive - offsetMs(new Date(naive), tz));
  const settled = offsetMs(first, tz);
  return new Date(naive - settled);
}

/** Civil date `n` days before `from` (may be negative), as {year, month, day}. */
export function shiftDays(from: Pick<Parts, "year" | "month" | "day">, n: number) {
  const d = new Date(Date.UTC(from.year, from.month - 1, from.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** "YYYY-MM-DD" for a civil date, with no timezone conversion applied. */
export function civilKey(c: Pick<Parts, "year" | "month" | "day">): string {
  return `${c.year}-${String(c.month).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`;
}
