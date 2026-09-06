"use client";

import { useState, type ReactNode } from "react";
import type { FeedItem } from "@/lib/queries";
import { ClosedIcon, ExternalIcon, MergeIcon, PendingIcon } from "./icons";

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Full repo name as a small badge that links to the repo on GitHub. */
export function RepoBadge({ repo }: { repo: string }) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="num inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs text-ink-muted transition hover:border-lime hover:text-lime"
    >
      <span className="truncate">{repo}</span>
    </a>
  );
}

/** Load-more button shared by every paginated list on the member page. */
function LoadMore({ hidden, onClick }: { hidden: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-t border-line-soft px-5 py-3 text-[13px] font-bold text-ink-muted transition hover:bg-surface-2 hover:text-lime"
    >
      Load more · {hidden} remaining
    </button>
  );
}

/**
 * Contribution list that shows PAGE_SIZE rows at a time with a Load more button.
 * `dense` shrinks the type for the narrower side sections; `badgeRepo` renders the
 * repo as a clickable badge instead of plain text.
 */
export function PagedList({
  items,
  empty,
  icon,
  tone,
  dense = false,
  badgeRepo = false,
}: {
  items: FeedItem[];
  empty: string;
  icon: ReactNode;
  tone?: "lime";
  dense?: boolean;
  badgeRepo?: boolean;
}) {
  const [count, setCount] = useState(PAGE_SIZE);
  if (items.length === 0) return <p className="px-5 py-6 text-sm text-ink-dim">{empty}</p>;
  const shown = items.slice(0, count);
  return (
    <div className="flex flex-col">
      {shown.map((it, i) => (
        <a
          key={it.id}
          href={it.url}
          target="_blank"
          rel="noreferrer"
          className={`group flex items-center gap-3.5 px-5 transition hover:bg-surface-2 ${dense ? "py-2.5" : "py-3.5"} ${i > 0 ? "border-t border-line-soft" : ""}`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 ${tone === "lime" ? "text-lime" : "text-ink-muted"}`}
          >
            {icon}
          </span>
          <div className={`flex min-w-0 flex-1 flex-col gap-1 ${badgeRepo ? "" : "gap-0"}`}>
            <p className={`truncate font-bold group-hover:text-lime ${dense ? "text-[13px]" : "text-sm"}`}>{it.title}</p>
            <div className="flex min-w-0 items-center gap-2">
              {badgeRepo ? (
                <RepoBadge repo={it.repo} />
              ) : (
                <span className={`num truncate text-ink-dim ${dense ? "text-xs" : "text-xs"}`}>
                  {it.repo} · #{it.url.split("/").pop()}
                </span>
              )}
              {badgeRepo && <span className="num shrink-0 text-xs text-ink-dim">#{it.url.split("/").pop()}</span>}
            </div>
          </div>
          <span className={`num hidden shrink-0 text-xs text-ink-dim sm:inline ${dense ? "text-[11px]" : ""}`}>{formatDate(it.occurred_at)}</span>
          <ExternalIcon className="shrink-0 text-ink-dim opacity-0 transition group-hover:opacity-100" />
        </a>
      ))}
      {count < items.length && <LoadMore hidden={items.length - count} onClick={() => setCount((c) => c + PAGE_SIZE)} />}
    </div>
  );
}

/** Merged / Closed pull requests, switched with tabs. */
export function PrTabs({ merged, closed, pending }: { merged: FeedItem[]; closed: FeedItem[]; pending: FeedItem[] }) {
  const [tab, setTab] = useState<"merged" | "closed" | "pending">("merged");
  const tabs = [
    { key: "merged" as const, label: "Merged", count: merged.length, lime: true, icon: <MergeIcon width={14} height={14} /> },
    { key: "closed" as const, label: "Closed", count: closed.length, lime: false, icon: <ClosedIcon width={14} height={14} /> },
    { key: "pending" as const, label: "Pending", count: pending.length, lime: false, icon: <PendingIcon width={14} height={14} /> },
  ];
  return (
    <div className="flex flex-col">
      <div className="flex gap-2 px-5 pb-4 pt-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`num flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold tracking-wide transition ${
                active ? (t.lime ? "border-lime bg-lime text-bg" : "border-ink bg-ink text-bg") : "border-line text-ink-muted hover:border-ink-dim hover:text-ink"
              }`}
            >
              {t.label}
              {t.icon}
              <span className={active ? "opacity-70" : "text-ink-dim"}>{t.count}</span>
            </button>
          );
        })}
      </div>
      {tab === "merged" && <PagedList items={merged} empty="No merged pull requests yet." icon={<MergeIcon />} tone="lime" badgeRepo />}
      {tab === "closed" && (
        <PagedList items={closed} empty="No closed pull requests — nothing has been shut without merging." icon={<ClosedIcon />} badgeRepo />
      )}
      {tab === "pending" && (
        <PagedList items={pending} empty="Nothing waiting for review." icon={<PendingIcon />} badgeRepo />
      )}
    </div>
  );
}

/** Repos this member has merged into, most merges first, with a Load more button. */
export function RepoList({ repos }: { repos: { repo: string; merged: number }[] }) {
  const [count, setCount] = useState(PAGE_SIZE);
  const shown = repos.slice(0, count);
  const max = repos[0]?.merged ?? 1;
  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {shown.map((r) => (
        <div key={r.repo} className="flex items-center gap-3">
          <RepoBadge repo={r.repo} />
          <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-lime" style={{ width: `${Math.round((r.merged / max) * 100)}%` }} />
          </div>
          <span className="num w-6 shrink-0 text-right text-[13px] font-bold">{r.merged}</span>
        </div>
      ))}
      {count < repos.length && (
        <button type="button" onClick={() => setCount((c) => c + PAGE_SIZE)} className="self-start text-[13px] font-bold text-ink-muted transition hover:text-lime">
          Load more · {repos.length - count} remaining
        </button>
      )}
    </div>
  );
}
