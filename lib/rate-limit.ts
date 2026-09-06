/**
 * Small in-memory fixed-window rate limiter for the unauthenticated write
 * endpoints. Single-instance only, which is what a self-hosted board runs;
 * swap for a shared store if that ever changes. Survives dev HMR via globalThis.
 */
type Bucket = { count: number; resetAt: number };

const store = globalThis as unknown as { rateLimitBuckets?: Map<string, Bucket> };
const buckets = (store.rateLimitBuckets ??= new Map<string, Bucket>());

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Allows `limit` calls per `windowMs` for each `key`; returns when to retry once exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Best-effort client IP from proxy headers; requests without one share one bucket. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
