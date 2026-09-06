import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { PeriodTabs } from "@/components/PeriodTabs";
import { TimeAgo } from "@/components/TimeAgo";
import { RepoLink } from "@/components/RepoLink";
import { ExternalIcon, IssueIcon, MergeIcon, PendingIcon, ReviewIcon } from "@/components/icons";
import { getMemberByLogin, getMemberContributions, type FeedItem } from "@/lib/queries";
import { parsePeriod, periodStart, PERIOD_LABEL } from "@/lib/period";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ login: string }>; searchParams: Promise<{ period?: string }> };

export async function generateMetadata({ params }: { params: Promise<{ login: string }> }): Promise<Metadata> {
  const { login } = await params;
  const member = await getMemberByLogin(login).catch(() => null);
  if (!member) return { title: "Member not found" };
  const title = member.display_name;
  const description = `Open source pull requests merged by ${member.display_name} (@${member.github_login}).`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary", title, description } };
}

/** `#42` for a PR/issue URL, or null for anything else (manual links, other forges). */
function issueNumber(url: string): string | null {
  const m = url.match(/\/(?:pull|issues)\/(\d+)/);
  return m ? `#${m[1]}` : null;
}

function PrList({ items, empty, icon, tone }: { items: FeedItem[]; empty: string; icon: React.ReactNode; tone?: "lime" }) {
  if (items.length === 0) return <p className="px-5 py-6 text-sm text-ink-dim">{empty}</p>;
  return (
    <ul className="flex flex-col">
      {items.map((it, i) => (
        <li key={it.id} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-line-soft" : ""}`}>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 ${tone === "lime" ? "text-lime" : "text-ink-muted"}`}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <a href={it.url} target="_blank" rel="noreferrer" className="group flex items-center gap-1.5">
              <span className="truncate text-sm font-bold group-hover:text-lime">{it.title}</span>
              <ExternalIcon width={13} height={13} className="shrink-0 text-ink-dim opacity-0 transition group-hover:opacity-100" />
            </a>
            <p className="num mt-0.5 truncate text-xs text-ink-dim">
              <RepoLink repo={it.repo} />
              {issueNumber(it.url) && ` · ${issueNumber(it.url)}`}
            </p>
          </div>
          <TimeAgo value={it.occurred_at} className="num hidden shrink-0 text-xs text-ink-dim sm:inline" />
        </li>
      ))}
    </ul>
  );
}

export default async function MemberPage({ params, searchParams }: Props) {
  const [{ login }, sp] = await Promise.all([params, searchParams]);
  const period = parsePeriod(sp.period);
  const member = await getMemberByLogin(login);
  if (!member) notFound();
  const data = await getMemberContributions(member.id, periodStart(period));
  const windowLabel = PERIOD_LABEL[period].toLowerCase();

  return (
    <div className="flex flex-col gap-8 pt-8 sm:pt-11">
      <Link href="/" className="text-sm font-bold text-ink-dim transition hover:text-ink">
        ← Back to overview
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar login={member.github_login} name={member.display_name} size={72} />
          <div className="flex flex-col gap-1">
            <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px]">{member.display_name}</h1>
            <a
              href={`https://github.com/${member.github_login}`}
              target="_blank"
              rel="noreferrer"
              className="num text-sm text-ink-dim transition hover:text-lime"
            >
              @{member.github_login}
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-baseline gap-2.5">
            <span className="num text-[52px] font-bold leading-none tracking-[-0.05em] sm:text-[64px]">{data.merged.length}</span>
            <span className="eyebrow">merged PRs · {windowLabel}</span>
          </div>
          <PeriodTabs current={period} basePath={`/members/${member.github_login}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <h2 className="text-lg font-extrabold tracking-tight">Merged pull requests</h2>
              <span className="num text-sm text-lime">{data.merged.length}</span>
            </div>
            <PrList
              items={data.merged}
              empty={period === "all" ? "No merged pull requests yet." : `Nothing merged ${windowLabel}.`}
              icon={<MergeIcon />}
              tone="lime"
            />
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <h2 className="text-lg font-extrabold tracking-tight">Pending pull requests</h2>
              <span className="num text-sm text-ink-dim">{data.pending.length} · counted once merged</span>
            </div>
            <PrList items={data.pending} empty="Nothing waiting for review." icon={<PendingIcon />} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5">
            <h2 className="text-lg font-extrabold tracking-tight">Merged by repo</h2>
            {data.repos.length === 0 ? (
              <p className="mt-3 text-sm text-ink-dim">No merges {period === "all" ? "yet" : windowLabel}.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {data.repos.map((r) => (
                  <li key={r.repo} className="flex items-center gap-3">
                    <RepoLink repo={r.repo} className="num min-w-0 flex-1 truncate text-sm" />
                    <span className="h-2 w-24 overflow-hidden rounded-full bg-track" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-lime"
                        style={{ width: `${Math.round((r.merged / data.repos[0].merged) * 100)}%` }}
                      />
                    </span>
                    <span className="num w-6 text-right text-sm font-bold">{r.merged}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <h2 className="text-lg font-extrabold tracking-tight">Issues filed</h2>
              <span className="num text-sm text-ink-dim">{data.issues.length}</span>
            </div>
            <PrList items={data.issues} empty="No issues filed." icon={<IssueIcon />} />
          </section>

          {data.reviews.length > 0 && (
            <section className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
                <h2 className="text-lg font-extrabold tracking-tight">Reviews</h2>
                <span className="num text-sm text-ink-dim">{data.reviews.length}</span>
              </div>
              <PrList items={data.reviews} empty="" icon={<ReviewIcon />} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
