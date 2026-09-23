import { authConfigured, canSync, getViewer } from "@/lib/auth";
import { SyncButton } from "./SyncButton";

/**
 * Only people allowed to sync see the button; signed-out visitors get a way
 * in instead. Reads the session cookie, so it is suspended apart from the rest
 * of the header like SyncStatus.
 */
export async function SyncControl() {
  const viewer = await getViewer();
  if (await canSync(viewer?.login).catch(() => false)) return <SyncButton />;
  if (viewer || !authConfigured()) return null;
  return (
    <a
      href="/api/auth/github?next=/"
      className="flex h-[38px] items-center rounded-[10px] border border-line px-4 text-[13px] font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink"
    >
      Sign in to sync
    </a>
  );
}
