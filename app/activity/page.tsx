import type { Metadata } from "next";
import Link from "next/link";
import { FeedList } from "@/components/Feed";
import { PeriodTabs } from "@/components/PeriodTabs";
import { countFeed, getFeed } from "@/lib/queries";
import { parsePeriod, periodStart, periodTitle } from "@/lib/period";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activity" };

const PAGE = 50;

const WINDOW = { week: "this week", month: "this month", all: "in total" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ period?: string; limit?: string }> }) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const limit = Math.min(Math.max(Number(params.limit) || PAGE, PAGE), 500);
  const since = periodStart(period);
  const [items, total] = await Promise.all([getFeed({ limit, since }), countFeed({ since })]);
  const remaining = total - items.length;

  return (
    <div className="flex flex-col gap-8 pt-8 sm:pt-11">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="eyebrow !text-lime">{periodTitle(period)}</span>
          <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[48px]">Activity</h1>
          <p className="text-[15px] text-ink-muted">
            {formatNumber(total)} contribution{total === 1 ? "" : "s"} {WINDOW[period]}, newest first — merged and pending pull
            requests, issues and reviews.
          </p>
        </div>
        <PeriodTabs current={period} basePath="/activity" />
      </div>

      <section className="rounded-card border border-line bg-surface px-5">
        <FeedList items={items} />
      </section>

      {remaining > 0 && (
        <Link
          href={`/activity?period=${period}&limit=${Math.min(limit + PAGE, 500)}`}
          scroll={false}
          className="flex h-11 items-center justify-center rounded-[10px] border border-line text-sm font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink"
        >
          Show {Math.min(remaining, PAGE)} more
        </Link>
      )}
      {remaining <= 0 && items.length > 0 && (
        <p className="text-center text-[13px] text-ink-dim">That is everything for this period.</p>
      )}
    </div>
  );
}
