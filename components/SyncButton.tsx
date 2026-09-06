"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshIcon } from "./icons";

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  async function sync() {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sync failed");
        const errs = data.errors?.length ? ` · ${data.errors.length} error(s)` : "";
        const extra = [data.updated ? `${data.updated} updated` : "", data.removed ? `${data.removed} removed` : ""].filter(Boolean).join(" · ");
        setStatus(`+${data.inserted} new${extra ? ` · ${extra}` : ""}${errs}`);
        router.refresh();
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {status && <span className="num max-w-[220px] truncate text-xs text-lime">{status}</span>}
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        className="flex h-[38px] items-center gap-2 rounded-[10px] bg-ink px-4 text-[13px] font-extrabold text-bg transition hover:bg-white disabled:opacity-60"
      >
        <RefreshIcon width={16} height={16} strokeWidth={2.4} className={pending ? "animate-spin" : ""} />
        {pending ? "Syncing…" : "Sync GitHub"}
      </button>
    </div>
  );
}
