/**
 * Nightly sync for self-hosted deployments.
 *
 * Vercel deployments use Vercel Cron (see vercel.json); this is the equivalent
 * for `docker compose up`, where there is no platform scheduler. It sleeps
 * until the next SYNC_HOUR in APP_TZ, calls the sync endpoint, and repeats —
 * so nobody has to remember to press the button.
 *
 * Deliberately dependency-free: it runs inside the same image as the web app.
 */

const TARGET_URL = process.env.SYNC_URL || "http://web:3000/api/sync";
const TZ = process.env.APP_TZ || process.env.TZ || "UTC";
const HOUR = Number(process.env.SYNC_HOUR ?? 2);
const SECRET = process.env.CRON_SECRET || "";

function log(message) {
  console.log(`[scheduler] ${new Date().toISOString()} ${message}`);
}

/** Wall-clock parts at `instant` as seen in `TZ`. */
function zonedParts(instant) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map = {};
  for (const part of fmt.formatToParts(instant)) if (part.type !== "literal") map[part.type] = part.value;
  return {
    year: +map.year,
    month: +map.month,
    day: +map.day,
    hour: +map.hour % 24,
    minute: +map.minute,
    second: +map.second,
  };
}

/**
 * Milliseconds until the next HOUR:00 in TZ. Found by probing forward rather
 * than by doing offset arithmetic, so a DST jump cannot land us an hour off.
 */
function msUntilNextRun(now = new Date()) {
  const start = zonedParts(now);
  // Step in minutes from the top of the current hour until the target hour turns over.
  let cursor = now.getTime() - (start.minute * 60 + start.second) * 1000;
  for (let i = 0; i <= 60 * 26; i++) {
    cursor += 60_000;
    const p = zonedParts(new Date(cursor));
    if (p.hour === HOUR && p.minute === 0) return cursor - now.getTime();
  }
  return 24 * 60 * 60 * 1000; // Unreachable in practice; fall back to a daily tick.
}

async function sync() {
  const started = Date.now();
  try {
    const res = await fetch(TARGET_URL, {
      method: "GET",
      headers: SECRET ? { authorization: `Bearer ${SECRET}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      log(`sync failed (${res.status}): ${body.error ?? "unknown error"}`);
      return;
    }
    log(`sync ok in ${Math.round((Date.now() - started) / 1000)}s · +${body.inserted ?? 0} new · ${body.updated ?? 0} updated · ${body.removed ?? 0} removed`);
  } catch (err) {
    log(`sync unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  log(`nightly sync armed for ${String(HOUR).padStart(2, "0")}:00 ${TZ} → ${TARGET_URL}`);
  // Give the web container a moment to finish booting on a cold `compose up`.
  await new Promise((r) => setTimeout(r, 15_000));
  if (process.env.SYNC_ON_START !== "false") await sync();

  for (;;) {
    const wait = msUntilNextRun();
    log(`next run in ${Math.round(wait / 60_000)} min`);
    await new Promise((r) => setTimeout(r, wait));
    await sync();
    // Step past the target minute so the loop cannot fire twice in one minute.
    await new Promise((r) => setTimeout(r, 61_000));
  }
}

main();
