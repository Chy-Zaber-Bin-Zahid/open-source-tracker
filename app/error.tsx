"use client";

import { useEffect } from "react";
import { AlertIcon, RefreshIcon } from "@/components/icons";

/**
 * Almost always Postgres being unreachable. Say that plainly instead of
 * showing the framework's default error screen.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-5 rounded-card border border-line bg-surface p-6 sm:p-8" style={{ marginTop: 44 }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-surface-2 text-coral">
        <AlertIcon width={22} height={22} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Could not load this page</h1>
        <p className="max-w-xl text-[15px] text-ink-muted">
          The tracker could not reach its database. If you are running it yourself, check that Postgres is up and that
          <code className="num mx-1 rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">DATABASE_URL</code>
          points at it.
        </p>
        {error.digest && <p className="num text-xs text-ink-dim">Reference: {error.digest}</p>}
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex h-11 items-center gap-2 rounded-[10px] bg-lime px-5 text-sm font-extrabold text-bg transition hover:bg-lime-soft"
      >
        <RefreshIcon width={16} height={16} strokeWidth={2.4} />
        Try again
      </button>
    </div>
  );
}
