"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PERIODS, PERIOD_LABEL, type Period } from "@/lib/period";

/**
 * Still real links, so middle-click and "open in new tab" keep working, but
 * navigated through a transition so the tabs can show that something is
 * happening.
 *
 * A plain <Link> gave no feedback at all here: changing ?period= keeps the same
 * route segment, so Next does not render loading.tsx for it, and every page is
 * force-dynamic — the old page just sat there until the query came back, which
 * reads as a dead button.
 */
export function PeriodTabs({ current, basePath = "/" }: { current: Period; basePath?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Which tab was clicked. `current` still points at the old period until the
  // navigation lands, so the spinner has to follow the click, not the selection.
  const [target, setTarget] = useState<Period | null>(null);

  return (
    <div role="tablist" aria-label="Time period" aria-busy={pending} className="flex gap-2">
      {PERIODS.map((p) => {
        const active = p === current;
        const loading = pending && target === p;
        const href = `${basePath}?period=${p}`;
        return (
          <a
            key={p}
            href={href}
            role="tab"
            aria-selected={active}
            onClick={(e) => {
              // Let the browser handle new-tab and new-window clicks itself.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              setTarget(p);
              startTransition(() => router.push(href, { scroll: false }));
            }}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold tracking-wide transition ${
              active ? "border-lime bg-lime text-bg" : "border-line text-ink-muted hover:border-ink-dim hover:text-ink"
            } ${pending ? "cursor-progress" : ""} ${pending && !loading ? "opacity-60" : ""}`}
          >
            {PERIOD_LABEL[p]}
            {loading && <Spinner />}
          </a>
        );
      })}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
