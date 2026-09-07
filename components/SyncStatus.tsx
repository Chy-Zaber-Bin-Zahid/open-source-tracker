import { getLastSync } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

/**
 * Suspended on its own so a slow — or unreachable — database cannot hold up the
 * header. Nav is rendered by the root layout, so while it awaited this query
 * nothing painted at all, including the pages' own loading skeletons.
 */
export async function SyncStatus() {
  const last = await getLastSync().catch(() => null);
  const label = !last ? "never synced" : last.finished_at ? `last sync ${timeAgo(last.finished_at)}` : "syncing…";
  return <span className="num hidden text-xs text-ink-dim sm:inline">{label}</span>;
}

export function SyncStatusFallback() {
  return <span className="skeleton hidden h-3 w-28 sm:inline-block" aria-hidden />;
}
