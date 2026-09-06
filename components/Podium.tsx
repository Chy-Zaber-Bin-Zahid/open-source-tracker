import Link from "next/link";
import type { Standing } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { FlameIcon } from "./icons";


function Counts({ s, dark }: { s: Standing; dark?: boolean }) {
  const strong = dark ? "text-bg" : "text-ink";
  const muted = dark ? "text-bg/70" : "text-ink-muted";
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[13px] ${muted}`}>
      <span><strong className={strong}>{s.opened}</strong> pending</span>
      <span><strong className={strong}>{s.issues}</strong> issues</span>
      <span><strong className={strong}>{s.reviews}</strong> reviews</span>
    </div>
  );
}

function Runner({ s, tone }: { s: Standing; tone: "silver" | "bronze" }) {
  const color = tone === "silver" ? "text-silver" : "text-bronze";
  const avatarBg = tone === "silver" ? "bg-[#2a2d33] text-silver" : "bg-[#332720] text-bronze";
  return (
    <div className="rise flex flex-col gap-4 rounded-card border border-line bg-surface p-6" style={{ animationDelay: tone === "silver" ? "80ms" : "160ms" }}>
      <div className="flex items-center justify-between">
        <span className={`num text-[13px] font-bold ${color}`}>#{s.rank}</span>
        <span className="eyebrow">{tone === "silver" ? "second" : "third"}</span>
      </div>
      <div className="flex items-center gap-3.5">
        <Avatar login={s.github_login} name={s.display_name} size={52} className={avatarBg} />
        <div className="flex min-w-0 flex-col">
          <Link href={`/members/${s.github_login}`} className="truncate text-lg font-extrabold hover:text-lime">{s.display_name}</Link>
          <span className="num text-xs text-ink-dim">@{s.github_login}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="num text-[44px] font-bold leading-none tracking-[-0.04em]">{s.merged}</span>
        <span className="eyebrow">merged PRs</span>
      </div>
      <Counts s={s} />
    </div>
  );
}

function Leader({ s }: { s: Standing }) {
  return (
    <div className="rise relative flex flex-col gap-5 overflow-hidden rounded-card bg-lime p-7 text-bg">
      <div className="pointer-events-none absolute -right-8 -top-10 select-none text-[220px] font-extrabold leading-none tracking-[-0.08em] text-bg/[0.08]">
        1
      </div>
      <div className="flex items-center justify-between">
        <span className="num text-[13px] font-bold">#1</span>
        {s.streak > 1 && (
          <span className="flex h-[26px] items-center gap-1.5 rounded-full bg-bg px-2.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-lime">
            <FlameIcon width={12} height={12} strokeWidth={2.6} />
            {s.streak} active days
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Avatar login={s.github_login} name={s.display_name} size={64} className="bg-bg text-lime" />
        <div className="flex min-w-0 flex-col">
          <Link href={`/members/${s.github_login}`} className="truncate text-2xl font-extrabold tracking-tight hover:underline">{s.display_name}</Link>
          <span className="num text-xs text-bg/60">@{s.github_login}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="num text-[72px] font-bold leading-none tracking-[-0.05em]">{s.merged}</span>
        <span className="eyebrow !text-bg/60">merged PRs</span>
      </div>
      <Counts s={s} dark />
    </div>
  );
}

export function Podium({ standings }: { standings: Standing[] }) {
  const [first, second, third] = standings;
  if (!first) return null;
  return (
    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
      <div className="order-2 md:order-1">{second ? <Runner s={second} tone="silver" /> : <EmptySlot rank={2} />}</div>
      <div className="order-1 md:order-2"><Leader s={first} /></div>
      <div className="order-3">{third ? <Runner s={third} tone="bronze" /> : <EmptySlot rank={3} />}</div>
    </div>
  );
}

function EmptySlot({ rank }: { rank: number }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-start justify-between rounded-card border border-dashed border-line p-6 text-ink-dim">
      <span className="num text-[13px] font-bold">#{rank}</span>
      <span className="text-sm">Add a teammate to fill this spot.</span>
    </div>
  );
}
