import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ExternalIcon, IssueIcon, MergeIcon, PendingIcon, ReviewIcon } from "@/components/icons";
import { getMemberByLogin, getMemberContributions, type FeedItem } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PrList({ items, empty, icon, tone }: { items: FeedItem[]; empty: string; icon: React.ReactNode; tone?: "lime" }) {
  if (items.length === 0) return <p className="px-5 py-6 text-sm text-ink-dim">{empty}</p>;
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <a
          key={it.id}
          href={it.url}
          target="_blank"
          rel="noreferrer"
          className={`group flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2 ${i > 0 ? "border-t border-line-soft" : ""}`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 ${tone === "lime" ? "text-lime" : "text-ink-muted"}`}>{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold group-hover:text-lime">{it.title}</p>
            <p className="num mt-0.5 truncate text-xs text-ink-dim">
              {it.repo} · #{it.url.split("/").pop()}
            </p>
          </div>
          <span className="num hidden shrink-0 text-xs text-ink-dim sm:inline">{formatDate(it.occurred_at)}</span>
          <ExternalIcon className="shrink-0 text-ink-dim opacity-0 transition group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
}

export default async function MemberPage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const member = await getMemberByLogin(login);
  if (!member) notFound();
  const data = await getMemberContributions(member.id);

  return (
    <div className="flex flex-col gap-8 pt-11">
      <Link href="/" className="text-sm font-bold text-ink-dim hover:text-ink">
        ← Back to overview
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <Avatar login={member.github_login} name={member.display_name} size={80} className="bg-[#24262a] text-ink-muted" />
          <div className="flex flex-col gap-1">
            <h1 className="text-[36px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px]">{member.display_name}</h1>
            <a href={`https://github.com/${member.github_login}`} target="_blank" rel="noreferrer" className="num text-sm text-ink-dim hover:text-lime">
              @{member.github_login}
            </a>
          </div>
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="num text-[64px] font-bold leading-none tracking-[-0.05em]">{data.merged.length}</span>
          <span className="eyebrow">merged PRs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <span className="text-lg font-extrabold tracking-tight">Merged pull requests</span>
              <span className="num text-sm text-lime">{data.merged.length}</span>
            </div>
            <PrList items={data.merged} empty="No merged pull requests yet." icon={<MergeIcon />} tone="lime" />
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <span className="text-lg font-extrabold tracking-tight">Pending pull requests</span>
              <span className="num text-sm text-ink-dim">{data.pending.length} · count once merged</span>
            </div>
            <PrList items={data.pending} empty="Nothing waiting for review." icon={<PendingIcon />} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5">
            <span className="text-lg font-extrabold tracking-tight">Merged by repo</span>
            {data.repos.length === 0 ? (
              <p className="mt-3 text-sm text-ink-dim">No merges yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5">
                {data.repos.map((r) => (
                  <div key={r.repo} className="flex items-center gap-3">
                    <span className="num min-w-0 flex-1 truncate text-sm">{r.repo}</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-lime" style={{ width: `${Math.round((r.merged / data.repos[0].merged) * 100)}%` }} />
                    </div>
                    <span className="num w-6 text-right text-sm font-bold">{r.merged}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <span className="text-lg font-extrabold tracking-tight">Issues filed</span>
              <span className="num text-sm text-ink-dim">{data.issues.length}</span>
            </div>
            <PrList items={data.issues} empty="No issues filed." icon={<IssueIcon />} />
          </section>

          {data.reviews.length > 0 && (
            <section className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
                <span className="text-lg font-extrabold tracking-tight">Reviews</span>
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
