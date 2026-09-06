import { NextResponse } from "next/server";
import { syncAll } from "@/lib/github";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function tooOften(req: Request) {
  const limited = rateLimit(`sync:${clientKey(req)}`, 10, 5 * 60_000);
  if (limited.ok) return null;
  return NextResponse.json(
    { error: `Sync is being called too often — try again in ${limited.retryAfterSec}s` },
    { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
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
  return tooOften(req) ?? run();
}

/**
 * Nightly schedulers hit this: Vercel Cron (see vercel.json) and the compose
 * `sync` service both issue a GET. Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; when CRON_SECRET is set the endpoint requires it, so a public
 * deployment cannot have its sync triggered by anyone who guesses the URL.
 *
 * A correctly authenticated scheduler skips the rate limiter — it runs once a
 * night and should never be throttled by a bucket shared with the button. When
 * no secret is configured the endpoint is open, so it is limited like POST.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return tooOften(req) ?? run();
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}
