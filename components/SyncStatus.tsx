import { getLastSync } from "@/lib/queries";
import { formatExact, isoString, timeAgo } from "@/lib/format";
import { SYNC_SCHEDULE_LABEL } from "@/lib/sync-schedule";

/**
 * Suspended on its own so a slow (or unreachable) database cannot hold up the
 * rest of the header.
 */
export async function SyncStatus() {
  const last = await getLastSync().catch(() => null);
  if (!last) return <span className="num text-xs text-ink-dim">never synced · {SYNC_SCHEDULE_LABEL}</span>;
  if (!last.finished_at) return <span className="num text-xs text-ink-dim">syncing…</span>;
  return (
    <span className="num text-xs text-ink-dim" title={`Last sync ${formatExact(last.finished_at)} · ${SYNC_SCHEDULE_LABEL}`}>
      synced <time dateTime={isoString(last.finished_at)}>{timeAgo(last.finished_at)}</time>
    </span>
  );
}

export function SyncStatusFallback() {
  return <span className="skeleton inline-block h-3 w-24" aria-hidden />;
}
