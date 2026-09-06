import { query } from "./db";
import type { ContributionType } from "./points";
import { periodStart, previousWindow, type Period } from "./period";
import { civilKey, shiftDays, zonedParts } from "./tz";

export type Member = {
  id: number;
  github_login: string;
  display_name: string;
  org_member: boolean;
  created_at: string;
};

export type Standing = {
  id: number;
  github_login: string;
  display_name: string;
  points: number;
  merged: number;
  closed: number;
  reviews: number;
  issues: number;
  opened: number;
  week_merged: number;
  rank: number;
  spark: number[]; // merged PRs per day, last 7 days, oldest first
  streak: number; // consecutive active days ending today or yesterday
};

export type FeedItem = {
  id: number;
  member_id: number;
  display_name: string;
  github_login: string;
  type: ContributionType;
  repo: string;
  title: string;
  url: string;
  points: number;
  occurred_at: string;
  source: string;
};

export type TeamStats = {
  merged: number;
  mergedPrev: number | null;
  points: number;
  members: number;
  pending: number;
};

export type SyncRun = {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  inserted: number;
  message: string | null;
};

export async function getMembers(): Promise<Member[]> {
  return query<Member>(`SELECT id, github_login, display_name, org_member, created_at FROM members ORDER BY display_name`);
}

export async function getStandings(period: Period): Promise<Standing[]> {
  const since = periodStart(period);
  const rows = await query<Omit<Standing, "rank" | "spark" | "streak">>(
    `SELECT m.id, m.github_login, m.display_name,
            COALESCE(SUM(c.points), 0)::int AS points,
            COUNT(c.id) FILTER (WHERE c.type = 'pr_merged')::int AS merged,
            COUNT(c.id) FILTER (WHERE c.type = 'pr_closed')::int AS closed,
            COUNT(c.id) FILTER (WHERE c.type = 'review')::int AS reviews,
            COUNT(c.id) FILTER (WHERE c.type = 'issue')::int AS issues,
            COUNT(c.id) FILTER (WHERE c.type = 'pr_opened')::int AS opened,
            COUNT(c.id) FILTER (WHERE c.type = 'pr_merged' AND c.occurred_at >= now() - interval '7 days')::int AS week_merged
     FROM members m
     LEFT JOIN contributions c ON c.member_id = m.id AND ($1::timestamptz IS NULL OR c.occurred_at >= $1)
     GROUP BY m.id
     ORDER BY merged DESC, points DESC, m.display_name ASC`,
    [since],
  );

  const sparkRows = await query<{ member_id: number; day: string; points: number }>(
    `SELECT member_id, to_char(occurred_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS points
     FROM contributions
     WHERE type = 'pr_merged' AND occurred_at >= (now()::date - interval '6 days')
     GROUP BY member_id, occurred_at::date`,
  );
  const today = zonedParts(new Date());
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(civilKey(shiftDays(today, -i)));
  const sparkByMember = new Map<number, number[]>();
  for (const r of sparkRows) {
    const arr = sparkByMember.get(r.member_id) ?? new Array(7).fill(0);
    const idx = days.indexOf(r.day);
    if (idx >= 0) arr[idx] += r.points;
    sparkByMember.set(r.member_id, arr);
  }

  const activeDays = await query<{ member_id: number; day: string }>(
    `SELECT DISTINCT member_id, to_char(occurred_at::date, 'YYYY-MM-DD') AS day
     FROM contributions WHERE occurred_at >= now() - interval '120 days'
     ORDER BY member_id, day DESC`,
  );
  const daysByMember = new Map<number, string[]>();
  for (const r of activeDays) {
    const arr = daysByMember.get(r.member_id) ?? [];
    arr.push(r.day);
    daysByMember.set(r.member_id, arr);
  }

  return rows.map((row, i) => ({
    ...row,
    rank: i + 1,
    spark: sparkByMember.get(row.id) ?? new Array(7).fill(0),
    streak: computeStreak(daysByMember.get(row.id) ?? []),
  }));
}

function computeStreak(daysDesc: string[]): number {
  if (daysDesc.length === 0) return 0;
  const set = new Set(daysDesc);
  let cursor = zonedParts(new Date());
  let key = civilKey(cursor);
  // A streak still counts if nothing has landed yet today.
  if (!set.has(key)) {
    cursor = { ...cursor, ...shiftDays(cursor, -1) };
    key = civilKey(cursor);
    if (!set.has(key)) return 0;
  }
  let streak = 0;
  while (set.has(key)) {
    streak++;
    cursor = { ...cursor, ...shiftDays(cursor, -1) };
    key = civilKey(cursor);
  }
  return streak;
}

export async function getTeamStats(period: Period, standings: Standing[]): Promise<TeamStats> {
  const prev = previousWindow(period);
  let mergedPrev: number | null = null;
  if (prev) {
    const [row] = await query<{ merged: number }>(
      `SELECT COUNT(*)::int AS merged FROM contributions WHERE type = 'pr_merged' AND occurred_at >= $1 AND occurred_at < $2`,
      [prev.start, prev.end],
    );
    mergedPrev = row?.merged ?? 0;
  }
  const merged = standings.reduce((s, m) => s + m.merged, 0);
  const points = standings.reduce((s, m) => s + m.points, 0);
  const pending = standings.reduce((s, m) => s + m.opened, 0);
  return { merged, mergedPrev, points, members: standings.length, pending };
}

export async function getFeed(opts: { limit?: number; memberId?: number; since?: Date | null } = {}): Promise<FeedItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 200);
  return query<FeedItem>(
    `SELECT c.id, c.member_id, m.display_name, m.github_login, c.type, c.repo, c.title, c.url, c.points, c.occurred_at, c.source
     FROM contributions c JOIN members m ON m.id = c.member_id
     WHERE ($1::int IS NULL OR c.member_id = $1) AND ($2::timestamptz IS NULL OR c.occurred_at >= $2)
     ORDER BY c.occurred_at DESC LIMIT $3`,
    [opts.memberId ?? null, opts.since ?? null, limit],
  );
}

export async function getLastSync(): Promise<SyncRun | null> {
  const [row] = await query<SyncRun>(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`);
  return row ?? null;
}

export async function getMemberByLogin(login: string): Promise<Member | null> {
  const [row] = await query<Member>(
    `SELECT id, github_login, display_name, org_member, created_at FROM members WHERE lower(github_login) = lower($1)`,
    [login],
  );
  return row ?? null;
}

export type MemberContributions = {
  merged: FeedItem[];
  closed: FeedItem[];
  pending: FeedItem[];
  issues: FeedItem[];
  reviews: FeedItem[];
  points: number;
  repos: { repo: string; merged: number }[];
};

export async function getMemberContributions(memberId: number): Promise<MemberContributions> {
  const items = await query<FeedItem>(
    `SELECT c.id, c.member_id, m.display_name, m.github_login, c.type, c.repo, c.title, c.url, c.points, c.occurred_at, c.source
     FROM contributions c JOIN members m ON m.id = c.member_id
     WHERE c.member_id = $1 ORDER BY c.occurred_at DESC`,
    [memberId],
  );
  const merged = items.filter((i) => i.type === "pr_merged");
  const repoCounts = new Map<string, number>();
  for (const m of merged) repoCounts.set(m.repo, (repoCounts.get(m.repo) ?? 0) + 1);
  return {
    merged,
    closed: items.filter((i) => i.type === "pr_closed"),
    pending: items.filter((i) => i.type === "pr_opened"),
    issues: items.filter((i) => i.type === "issue"),
    reviews: items.filter((i) => i.type === "review"),
    points: items.reduce((s, i) => s + i.points, 0),
    repos: [...repoCounts.entries()].map(([repo, merged]) => ({ repo, merged })).sort((a, b) => b.merged - a.merged),
  };
}
