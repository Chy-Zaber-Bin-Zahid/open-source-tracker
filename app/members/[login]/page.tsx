import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { IssueIcon, ReviewIcon } from "@/components/icons";
import { PagedList, PrTabs, RepoList } from "@/components/member-lists";
import { getMemberByLogin, getMemberContributions } from "@/lib/queries";

export const dynamic = "force-dynamic";

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
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2.5">
            <span className="num text-[64px] font-bold leading-none tracking-[-0.05em]">{data.merged.length}</span>
            <span className="eyebrow">merged PRs</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="num text-[64px] font-bold leading-none tracking-[-0.05em] text-ink-muted">{data.closed.length}</span>
            <span className="eyebrow">closed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <span className="text-lg font-extrabold tracking-tight">Pull requests</span>
              <span className="num text-sm text-lime">{data.merged.length} merged</span>
            </div>
            <div className="border-t border-line-soft">
              <PrTabs merged={data.merged} closed={data.closed} pending={data.pending} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5">
            <span className="text-lg font-extrabold tracking-tight">Merged by repo</span>
            {data.repos.length === 0 ? (
              <p className="mt-3 text-sm text-ink-dim">No merges yet.</p>
            ) : (
              <RepoList repos={data.repos} />
            )}
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <span className="text-lg font-extrabold tracking-tight">Issues filed</span>
              <span className="num text-sm text-ink-dim">{data.issues.length}</span>
            </div>
            <PagedList items={data.issues} empty="No issues filed." icon={<IssueIcon />} dense badgeRepo />
          </section>

          {data.reviews.length > 0 && (
            <section className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
                <span className="text-lg font-extrabold tracking-tight">Reviews</span>
                <span className="num text-sm text-ink-dim">{data.reviews.length}</span>
              </div>
              <PagedList items={data.reviews} empty="" icon={<ReviewIcon />} dense badgeRepo />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
