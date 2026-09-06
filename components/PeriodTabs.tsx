"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PERIODS, PERIOD_LABEL, type Period } from "@/lib/period";

/**
 * Rendered as real links so middle-click and "open in new tab" still work, but
 * navigated through a transition so the tab can show that it is loading —
 * these pages are all `force-dynamic` and a plain link just looks frozen.
 */
export function PeriodTabs({ current, basePath = "/" }: { current: Period; basePath?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="tablist" aria-label="Time period" className={`flex gap-2 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {PERIODS.map((p) => {
        const active = p === current;
        const href = `${basePath}?period=${p}`;
        return (
          <a
            key={p}
            href={href}
            role="tab"
            aria-selected={active}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              startTransition(() => router.push(href, { scroll: false }));
            }}
            className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] font-bold tracking-wide transition ${
              active ? "border-lime bg-lime text-bg" : "border-line text-ink-muted hover:border-ink-dim hover:text-ink"
            }`}
          >
            {PERIOD_LABEL[p]}
          </a>
        );
      })}
    </div>
  );
}
