"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Standing } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { Sparkline } from "./Sparkline";
import { ArrowUpIcon, SearchIcon } from "./icons";
import { SCORING_SUMMARY } from "@/lib/points";

type SortKey = "merged" | "display_name" | "opened" | "issues" | "reviews";

const COLS = "grid-cols-[28px_minmax(0,1fr)_56px_56px_56px_100px_92px]";

/** Merged is the only column that ranks anything, so it is the only one shown large. */
const SECONDARY: { key: SortKey; label: string; short: string }[] = [
  { key: "opened", label: "Pending", short: "pending" },
  { key: "issues", label: "Issues", short: "issues" },
  { key: "reviews", label: "Reviews", short: "reviews" },
];

function SortHeader({
  label,
  active,
  desc,
  className = "",
  onClick,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label}${active ? `, currently ${desc ? "high to low" : "low to high"}` : ""}`}
      className={`eyebrow flex items-center gap-1 transition hover:text-ink ${active ? "!text-ink" : ""} ${className}`}
    >
      {label}
      {active && <ArrowUpIcon width={9} height={9} className={desc ? "rotate-180" : ""} />}
    </button>
  );
}

export function Standings({ standings, days }: { standings: Standing[]; days: string[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "merged", desc: true });
  const [q, setQ] = useState("");

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "display_name" }));
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? standings.filter((s) => s.display_name.toLowerCase().includes(needle) || s.github_login.toLowerCase().includes(needle))
      : standings;
    const dir = sort.desc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "display_name") return dir * a.display_name.localeCompare(b.display_name);
      const diff = a[sort.key] - b[sort.key];
      return diff !== 0 ? dir * diff : a.display_name.localeCompare(b.display_name);
    });
  }, [standings, q, sort]);

  const searchable = standings.length > 5;

  return (
    <section aria-labelledby="all-contributors" className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-5">
        <h2 id="all-contributors" className="text-lg font-extrabold tracking-tight">
          All contributors
        </h2>
        {searchable ? (
          <label className="relative flex items-center">
            <SearchIcon width={15} height={15} className="pointer-events-none absolute left-3 text-ink-dim" />
            <span className="sr-only">Search contributors</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-9 w-44 rounded-full border border-line bg-bg pl-8 pr-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-lime"
            />
          </label>
        ) : (
          <span className="text-[13px] text-ink-dim">{SCORING_SUMMARY}</span>
        )}
      </div>

      {standings.length === 0 && (
        <p className="border-t border-line-soft px-5 py-10 text-center text-sm text-ink-dim">
          No members yet. Add your teammates on the Members page.
        </p>
      )}

      {standings.length > 0 && rows.length === 0 && (
        <p className="border-t border-line-soft px-5 py-10 text-center text-sm text-ink-dim">No contributor matches “{q}”.</p>
      )}

      {/* Wide screens: a real table with sortable columns. */}
      <div className="hidden md:block">
        <div className={`grid ${COLS} h-10 items-center gap-4 px-5`}>
          <span className="eyebrow">#</span>
          <SortHeader label="Member" active={sort.key === "display_name"} desc={sort.desc} onClick={() => toggle("display_name")} />
          {SECONDARY.map((c) => (
            <SortHeader key={c.key} label={c.label} active={sort.key === c.key} desc={sort.desc} onClick={() => toggle(c.key)} />
          ))}
          <span className="eyebrow">Last 7 days</span>
          <SortHeader
            label="Merged"
            active={sort.key === "merged"}
            desc={sort.desc}
            className="justify-end"
            onClick={() => toggle("merged")}
          />
        </div>
        {rows.map((s) => (
          <Link
            key={s.id}
            href={`/members/${s.github_login}`}
            className={`grid ${COLS} h-[68px] items-center gap-4 border-t border-line-soft px-5 transition hover:bg-surface-2`}
          >
            <span className="num font-bold text-ink-dim">{s.rank}</span>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar login={s.github_login} name={s.display_name} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{s.display_name}</span>
                <span className="num truncate text-xs text-ink-dim">@{s.github_login}</span>
              </div>
            </div>
            {SECONDARY.map((c) => (
              <span key={c.key} className="num text-[13px] text-ink-dim">
                {s[c.key]}
              </span>
            ))}
            <Sparkline values={s.spark} days={days} name={s.display_name} />
            <div className="flex flex-col items-end">
              <span className="num text-xl font-bold">{s.merged}</span>
              {s.week_merged > 0 && (
                <span className="num flex items-center gap-0.5 text-[11px] text-lime">
                  <ArrowUpIcon width={9} height={9} />
                  {s.week_merged} this week
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Small screens: one card per contributor, so nothing scrolls sideways. */}
      <div className="md:hidden">
        {rows.map((s) => (
          <Link
            key={s.id}
            href={`/members/${s.github_login}`}
            className="flex items-center gap-3 border-t border-line-soft px-5 py-4 transition hover:bg-surface-2"
          >
            <span className="num w-4 shrink-0 text-sm font-bold text-ink-dim">{s.rank}</span>
            <Avatar login={s.github_login} name={s.display_name} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-bold">{s.display_name}</span>
              <span className="num flex flex-wrap gap-x-2 text-[11px] text-ink-dim">
                {SECONDARY.map((c) => (
                  <span key={c.key}>
                    {s[c.key]} {c.short}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="num text-xl font-bold leading-none">{s.merged}</span>
              <span className="eyebrow mt-1 !text-[9px]">merged</span>
            </div>
          </Link>
        ))}
      </div>

      {searchable && <p className="border-t border-line-soft px-5 py-3 text-[13px] text-ink-dim">{SCORING_SUMMARY}</p>}
    </section>
  );
}
