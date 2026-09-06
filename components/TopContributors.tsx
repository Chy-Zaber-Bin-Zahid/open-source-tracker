import Link from "next/link";
import type { Standing } from "@/lib/queries";
import type { Period } from "@/lib/period";
import { Avatar } from "./Avatar";
import { Sparkline } from "./Sparkline";

/**
 * Deliberately not a podium: no trophy, no medal colours, no streaks. Every
 * card gets identical weight — this is a record of what shipped, not a contest.
 */
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

const HEADING: Record<Period, string> = {
  week: "Most merged this week",
  month: "Most merged this month",
  all: "Most merged all time",
};

function Card({ s, days, delay }: { s: Standing; days: string[]; delay: number }) {
  return (
    <Link
      href={`/members/${s.github_login}`}
      style={{ animationDelay: `${delay}ms` }}
      className="rise group flex flex-col gap-4 rounded-card border border-line bg-surface p-5 transition hover:border-ink-dim sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="num text-[13px] font-bold text-ink-dim">#{s.rank}</span>
        <Sparkline values={s.spark} days={days} name={s.display_name} />
      </div>

      <div className="flex items-center gap-3.5">
        <Avatar login={s.github_login} name={s.display_name} size={52} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-extrabold group-hover:text-lime">{s.display_name}</span>
          <span className="num truncate text-xs text-ink-dim">@{s.github_login}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="num text-[44px] font-bold leading-none tracking-[-0.04em] text-lime">{s.merged}</span>
        <span className="eyebrow">merged PRs</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted">
        <span>
          <strong className="text-ink">{s.opened}</strong> pending
        </span>
        <span>
          <strong className="text-ink">{s.issues}</strong> issues
        </span>
        <span>
          <strong className="text-ink">{s.reviews}</strong> reviews
        </span>
      </div>
    </Link>
  );
}

export function TopContributors({ standings, days, period }: { standings: Standing[]; days: string[]; period: Period }) {
  const top = standings.filter((s) => s.merged > 0).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <section aria-labelledby="top-contributors" className="flex flex-col gap-3">
      <h2 id="top-contributors" className="eyebrow">
        {HEADING[period]}
      </h2>
      <div className={`grid gap-4 ${COLS[top.length] ?? COLS[3]}`}>
        {top.map((s, i) => (
          <Card key={s.id} s={s} days={days} delay={i * 70} />
        ))}
      </div>
    </section>
  );
}
