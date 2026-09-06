import { NextResponse } from "next/server";
import { syncAll } from "@/lib/github";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;

export async function POST(req: Request) {
  const limited = rateLimit(`sync:${clientKey(req)}`, 10, 5 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Sync is being called too often — try again in ${limited.retryAfterSec}s` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  try {
    const result = await syncAll();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
