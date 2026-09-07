import Link from "next/link";
import type { Standing } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { Sparkline } from "./Sparkline";
import { ArrowUpIcon } from "./icons";
import { SCORING_SUMMARY } from "@/lib/points";

const cols = "grid-cols-[32px_minmax(0,1fr)_72px_72px_72px_72px_110px_110px]";

export function Standings({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3.5 pt-5">
        <span className="text-lg font-extrabold tracking-tight">All contributors</span>
        <span className="text-[13px] text-ink-dim">{SCORING_SUMMARY}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[790px]">
          <div className={`grid ${cols} h-10 items-center gap-4 px-5`}>
            <span className="eyebrow">#</span>
            <span className="eyebrow">Member</span>
            <span className="eyebrow">Pending</span>
            <span className="eyebrow">Issues</span>
            <span className="eyebrow">Reviews</span>
            <span className="eyebrow">Closed</span>
            <span className="eyebrow">Last 7 days</span>
            <span className="eyebrow text-right">Merged</span>
          </div>
          {standings.length === 0 && (
            <div className="border-t border-line-soft px-5 py-10 text-center text-sm text-ink-dim">
              No members yet. Add your teammates on the Members page, then hit Sync GitHub.
            </div>
          )}
          {standings.map((s) => (
            <Link key={s.id} href={`/members/${s.github_login}`} className={`grid ${cols} h-[68px] items-center gap-4 border-t border-line-soft px-5 transition hover:bg-surface-2`}>
              <span className={`num font-bold ${s.rank === 1 ? "text-lime" : "text-ink-muted"}`}>{s.rank}</span>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar login={s.github_login} name={s.display_name} className={s.rank === 1 ? "bg-lime text-bg" : "bg-[#24262a] text-ink-muted"} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{s.display_name}</span>
                  <span className="num truncate text-xs text-ink-dim">@{s.github_login}</span>
                </div>
              </div>
              <span className="num text-ink-muted">{s.opened}</span>
              <span className="num text-ink-muted">{s.issues}</span>
              <span className="num text-ink-muted">{s.reviews}</span>
              <span className="num text-ink-muted">{s.closed}</span>
              <Sparkline values={s.spark} />
              <div className="flex flex-col items-end">
                <span className="num text-lg font-bold">{s.merged}</span>
                {s.week_merged > 0 ? (
                  <span className="num flex items-center gap-0.5 text-[11px] text-lime">
                    <ArrowUpIcon width={10} height={10} />
                    {s.week_merged} in 7 days
                  </span>
                ) : (
                  <span className="num text-[11px] text-ink-dim">none in 7 days</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
