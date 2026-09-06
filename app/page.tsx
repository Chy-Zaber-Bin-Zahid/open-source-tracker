import { Podium } from "@/components/Podium";
import { Standings } from "@/components/Standings";
import { FeedList } from "@/components/Feed";
import { StatTile } from "@/components/StatTile";
import { PeriodTabs } from "@/components/PeriodTabs";
import { getFeed, getStandings, getTeamStats } from "@/lib/queries";
import { parsePeriod, periodStart, periodTitle } from "@/lib/period";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const period = parsePeriod((await searchParams).period);
  const standings = await getStandings(period);
  const [stats, feed] = await Promise.all([getTeamStats(period, standings), getFeed({ limit: 10, since: periodStart(period) })]);

  const subtitle =
    period === "week" ? "Pull requests merged this week" : period === "month" ? "Pull requests merged this month" : "Every pull request merged so far";
  const mergedDelta = stats.mergedPrev === null ? null : stats.merged - stats.mergedPrev;
  const prevLabel = period === "week" ? "last week" : "last month";

  return (
    <div className="flex flex-col gap-8 pt-11">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="eyebrow !text-lime">{periodTitle(period)}</span>
          <h1 className="text-[40px] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[56px]">Open source contributions</h1>
          <p className="text-[15px] text-ink-muted">{subtitle}</p>
        </div>
        <PeriodTabs current={period} />
      </div>

      <Podium standings={standings} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              label="Team merged PRs"
              value={formatNumber(stats.merged)}
              note={
                mergedDelta === null ? "all time" : (
                  <>
                    <strong className={mergedDelta >= 0 ? "text-lime" : "text-coral"}>{mergedDelta >= 0 ? "+" : ""}{mergedDelta}</strong> vs {prevLabel}
                  </>
                )
              }
            />
            <StatTile label="Pending PRs" value={formatNumber(stats.pending)} note="waiting for review, count once merged" />
            <StatTile label="Contributors" value={formatNumber(stats.members)} note={stats.members === 1 ? "team member" : "team members"} />
          </div>
          <Standings standings={standings} />
        </div>

        <aside className="flex flex-col self-start rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-lg font-extrabold tracking-tight">Recent contributions</span>
            <span className="flex items-center gap-1.5 text-xs text-ink-dim">
              <span className="h-2 w-2 rounded-full bg-lime" />
              {period === "week" ? "this week" : period === "month" ? "this month" : "all time"}
            </span>
          </div>
          <FeedList items={feed} compact />
        </aside>
      </div>
    </div>
  );
}
