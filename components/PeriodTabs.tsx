import Link from "next/link";
import { PERIODS, PERIOD_LABEL, type Period } from "@/lib/period";

export function PeriodTabs({ current, basePath = "/" }: { current: Period; basePath?: string }) {
  return (
    <div className="flex gap-2">
      {PERIODS.map((p) => {
        const active = p === current;
        return (
          <Link
            key={p}
            href={`${basePath}?period=${p}`}
            className={`flex h-9 items-center rounded-full border px-3.5 text-[13px] font-bold tracking-wide transition ${
              active ? "border-lime bg-lime text-bg" : "border-line text-ink-muted hover:border-ink-dim hover:text-ink"
            }`}
          >
            {PERIOD_LABEL[p]}
          </Link>
        );
      })}
    </div>
  );
}
