import Link from "next/link";
import type { FeedItem } from "@/lib/queries";
import { ClosedIcon, IssueIcon, MergeIcon, PendingIcon, ReviewIcon } from "./icons";
import { RepoBadge } from "./member-lists";
import { TYPE_VERB } from "@/lib/points";
import { timeAgo } from "@/lib/format";

const iconFor = {
  pr_merged: (c: string) => <MergeIcon className={c} />,
  pr_closed: (c: string) => <ClosedIcon className={c} />,
  pr_opened: (c: string) => <PendingIcon className={c} />,
  review: (c: string) => <ReviewIcon className={c} />,
  issue: (c: string) => <IssueIcon className={c} />,
};

export function FeedList({ items, compact = false }: { items: FeedItem[]; compact?: boolean }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-dim">Nothing here yet. Sync GitHub or log a contribution manually.</p>;
  }
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <div key={it.id} className={`flex items-start gap-3 py-3.5 ${i > 0 ? "border-t border-line-soft" : ""}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2">
            {iconFor[it.type](it.type === "pr_merged" ? "text-lime" : "text-ink-muted")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <Link href={`/members/${it.github_login}`} className="font-bold hover:text-lime">{compact ? it.display_name.split(" ")[0] : it.display_name}</Link> {TYPE_VERB[it.type]}{" "}
              <a href={it.url} target="_blank" rel="noreferrer" className="text-lime hover:text-lime-soft">
                {it.title}
              </a>{" "}
              <RepoBadge repo={it.repo} />
            </p>
            <p className="mt-0.5 text-xs text-ink-dim">
              {timeAgo(it.occurred_at)}
              {it.type === "pr_merged" && <span className="font-bold text-lime"> · counts</span>}
              {it.type === "pr_opened" && <span> · counts once merged</span>}
              {it.type === "pr_closed" && <span> · never counted</span>}
              {it.source !== "github" && <span> · {it.source}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
