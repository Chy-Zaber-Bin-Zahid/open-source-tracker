"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertIcon, CheckIcon, CloseIcon, RefreshIcon } from "./icons";
import { SYNC_SCHEDULE_LABEL } from "@/lib/sync-schedule";

type Status = { tone: "ok" | "error"; message: string };

/** Success clears itself quickly; a failure stays up long enough to be read. */
const DISMISS_MS = { ok: 6000, error: 14000 };

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(null), DISMISS_MS[status.tone]);
    return () => clearTimeout(id);
  }, [status]);

  const sync = useCallback(() => {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Sync failed (${res.status})`);
        const parts = [
          `${data.inserted ?? 0} new`,
          data.updated ? `${data.updated} updated` : "",
          data.removed ? `${data.removed} removed` : "",
        ].filter(Boolean);
        if (data.errors?.length) {
          setStatus({ tone: "error", message: `Synced with ${data.errors.length} error(s): ${data.errors[0]}` });
        } else {
          setStatus({ tone: "ok", message: `Synced · ${parts.join(" · ")}` });
        }
        router.refresh();
      } catch (err) {
        setStatus({ tone: "error", message: err instanceof Error ? err.message : "Sync failed" });
      }
    });
  }, [router]);

  return (
    <>
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        title={`Pull the latest contributions from GitHub now. The tracker also ${SYNC_SCHEDULE_LABEL}.`}
        className="flex h-[38px] items-center gap-2 rounded-[10px] bg-ink px-3 text-[13px] font-extrabold text-bg transition hover:opacity-90 disabled:opacity-60 sm:px-4"
      >
        <RefreshIcon width={16} height={16} strokeWidth={2.4} className={pending ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{pending ? "Syncing…" : "Sync now"}</span>
      </button>

      {status && (
        <div
          role={status.tone === "error" ? "alert" : "status"}
          aria-live={status.tone === "error" ? "assertive" : "polite"}
          className="rise fixed bottom-5 left-5 right-5 z-50 flex items-start gap-3 rounded-[14px] border bg-surface p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-[380px]"
          style={{ borderColor: status.tone === "ok" ? "var(--accent)" : "var(--danger)" }}
        >
          <span className={status.tone === "ok" ? "text-lime" : "text-coral"}>
            {status.tone === "ok" ? <CheckIcon width={18} height={18} /> : <AlertIcon width={18} height={18} />}
          </span>
          <p className="min-w-0 flex-1 break-words text-[13px] leading-snug">{status.message}</p>
          <button
            type="button"
            onClick={() => setStatus(null)}
            aria-label="Dismiss"
            className="shrink-0 text-ink-dim transition hover:text-ink"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      )}
    </>
  );
}
