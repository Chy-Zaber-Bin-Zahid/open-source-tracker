import Link from "next/link";
import type { FeedItem } from "@/lib/queries";
import { IssueIcon, MergeIcon, PendingIcon, ReviewIcon } from "./icons";
import { TYPE_VERB } from "@/lib/points";
import { TimeAgo } from "./TimeAgo";
import { RepoLink } from "./RepoLink";

const iconFor = {
  pr_merged: (c: string) => <MergeIcon className={c} />,
  pr_opened: (c: string) => <PendingIcon className={c} />,
  review: (c: string) => <ReviewIcon className={c} />,
  issue: (c: string) => <IssueIcon className={c} />,
};

export function FeedEmpty({ children }: { children?: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-ink-dim">
      {children ?? (
        <>
          Nothing here yet. The tracker syncs GitHub every night, or{" "}
          <Link href="/members#log" className="text-lime hover:underline">
            log a contribution by hand
          </Link>
          .
        </>
      )}
    </p>
  );
}

export function FeedList({ items, compact = false }: { items: FeedItem[]; compact?: boolean }) {
  if (items.length === 0) return <FeedEmpty />;
  return (
    <ul className="flex flex-col">
      {items.map((it, i) => (
        <li key={it.id} className={`flex items-start gap-3 py-3.5 ${i > 0 ? "border-t border-line-soft" : ""}`}>
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2">
            {iconFor[it.type](it.type === "pr_merged" ? "text-lime" : "text-ink-muted")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <Link href={`/members/${it.github_login}`} className="font-bold hover:text-lime">
                {compact ? it.display_name.split(" ")[0] : it.display_name}
              </Link>{" "}
              {TYPE_VERB[it.type]}{" "}
              <a href={it.url} target="_blank" rel="noreferrer" className="text-lime hover:text-lime-soft hover:underline">
                {it.title}
              </a>{" "}
              <span className="text-ink-muted">
                in <RepoLink repo={it.repo} className="num" />
              </span>
            </p>
            <p className="mt-0.5 text-xs text-ink-dim">
              <TimeAgo value={it.occurred_at} />
              {it.type === "pr_merged" && <span className="font-bold text-lime"> · counted</span>}
              {it.type === "pr_opened" && <span> · counts once merged</span>}
              {it.source !== "github" && <span> · added {it.source}</span>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
