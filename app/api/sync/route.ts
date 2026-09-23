import { NextResponse } from "next/server";
import { authConfigured, canSync, getViewer } from "@/lib/auth";
import { query } from "@/lib/db";
import { syncAll } from "@/lib/github";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Minimum gap between on-demand syncs, shared by every visitor. */
const COOLDOWN_SEC = 5 * 60;

/**
 * One global cooldown kept in the database rather than per IP in memory: an IP
 * bucket is dodged by rotating addresses or spoofing X-Forwarded-For, and on
 * serverless each instance has its own memory. The gap counts from when the
 * last run finished, and a run still going refuses outright.
 */
async function coolingDown() {
  const [row] = await query<{ running: boolean; wait: number }>(
    `SELECT finished_at IS NULL AS running,
            CEIL(EXTRACT(EPOCH FROM (COALESCE(finished_at, now()) + make_interval(secs => $1) - now())))::int AS wait
     FROM sync_runs
     WHERE status <> 'aborted' AND (finished_at IS NOT NULL OR started_at > now() - interval '30 minutes')
     ORDER BY started_at DESC LIMIT 1`,
    [COOLDOWN_SEC],
  );
  if (row?.running) return NextResponse.json({ error: "A sync is already running" }, { status: 409 });
  if (!row || row.wait <= 0) return null;
  return NextResponse.json(
    { error: `Synced recently — try again in ${Math.ceil(row.wait / 60)} min` },
    { status: 429, headers: { "Retry-After": String(row.wait) } },
  );
}

async function run() {
  try {
    return NextResponse.json(await syncAll());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/** Triggered by the Sync now button in the header. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }
  if (authConfigured()) {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({ error: "Sign in with GitHub to sync" }, { status: 401 });
    if (!(await canSync(viewer.login))) {
      return NextResponse.json({ error: `@${viewer.login} is not on the board` }, { status: 403 });
    }
  }
  return (await coolingDown()) ?? run();
}

/**
 * Nightly schedulers hit this: Vercel Cron (see vercel.json) and the compose
 * `sync` service both issue a GET. Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; when CRON_SECRET is set the endpoint requires it, so a public
 * deployment cannot have its sync triggered by anyone who guesses the URL.
 *
 * A correctly authenticated scheduler skips the cooldown — it runs once a
 * night and should never be refused because someone pressed the button. When
 * no secret is configured the endpoint is open, so it gets the cooldown too.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return (await coolingDown()) ?? run();
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}
