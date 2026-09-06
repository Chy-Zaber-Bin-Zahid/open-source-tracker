import { query, pool } from "./db";
import { POINTS, type ContributionType } from "./points";

type SearchItem = {
  html_url: string;
  title: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  state: "open" | "closed";
  repository_url: string;
  user: { login: string };
  pull_request?: { merged_at: string | null };
};

type Upsert = {
  type: ContributionType;
  repo: string;
  title: string;
  url: string;
  occurredAt: string;
};

const API = "https://api.github.com";

function sinceDate(): string {
  const env = process.env.SYNC_SINCE;
  if (env && /^\d{4}-\d{2}-\d{2}/.test(env)) return env.slice(0, 10);
  return `${new Date().getFullYear()}-01-01`;
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "contribution-tracker",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function search(q: string, maxPages = 5): Promise<SearchItem[]> {
  const items: SearchItem[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `${API}/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=100&page=${page}`;
    const res = await fetch(url, { headers: headers(), cache: "no-store" });
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const wait = Math.min(Math.max(reset - Date.now(), 2000), 60_000);
      await new Promise((r) => setTimeout(r, wait));
      page--;
      continue;
    }
    if (!res.ok) throw new Error(`GitHub search failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { items: SearchItem[]; total_count: number };
    items.push(...data.items);
    if (data.items.length < 100 || items.length >= data.total_count) break;
  }
  return items;
}

function repoOf(item: SearchItem): string {
  return item.repository_url.replace(`${API}/repos/`, "");
}

function ownRepo(repo: string, login: string): boolean {
  return repo.split("/")[0].toLowerCase() === login.toLowerCase();
}

export async function collectForMember(login: string): Promise<{ items: Upsert[]; closedUnmerged: string[] }> {
  const since = sinceDate();
  const includeOwn = process.env.INCLUDE_OWN_REPOS === "true";
  const out: Upsert[] = [];
  const closedUnmerged: string[] = [];

  // One entry per PR: merged -> pr_merged, still open -> pr_opened (pending, 0 pts), closed without merge -> removed.
  const prs = await search(`is:pr author:${login} created:>=${since}`);
  for (const pr of prs) {
    const repo = repoOf(pr);
    if (!includeOwn && ownRepo(repo, login)) continue;
    if (pr.pull_request?.merged_at) {
      out.push({ type: "pr_merged", repo, title: pr.title, url: pr.html_url, occurredAt: pr.pull_request.merged_at });
    } else if (pr.state === "open") {
      out.push({ type: "pr_opened", repo, title: pr.title, url: pr.html_url, occurredAt: pr.created_at });
    } else {
      closedUnmerged.push(pr.html_url);
    }
  }

  const issues = await search(`is:issue author:${login} created:>=${since}`);
  for (const issue of issues) {
    const repo = repoOf(issue);
    if (!includeOwn && ownRepo(repo, login)) continue;
    out.push({ type: "issue", repo, title: issue.title, url: issue.html_url, occurredAt: issue.created_at });
  }

  const reviewed = await search(`is:pr reviewed-by:${login} -author:${login} updated:>=${since}`);
  for (const pr of reviewed) {
    const repo = repoOf(pr);
    if (!includeOwn && ownRepo(repo, login)) continue;
    out.push({ type: "review", repo, title: pr.title, url: pr.html_url, occurredAt: pr.updated_at });
  }

  return { items: out, closedUnmerged };
}

export type SyncResult = { inserted: number; updated: number; removed: number; perMember: Record<string, number>; errors: string[] };

const syncState = globalThis as unknown as { syncInFlight?: Promise<SyncResult> };

/** Runs one sync at a time; a second caller gets the in-flight run's result instead of starting another. */
export function syncAll(): Promise<SyncResult> {
  if (!syncState.syncInFlight) {
    syncState.syncInFlight = runSync().finally(() => {
      syncState.syncInFlight = undefined;
    });
  }
  return syncState.syncInFlight;
}

async function runSync(): Promise<SyncResult> {
  // Runs left as "running" by a crashed or restarted server never finish; mark them so the UI stops saying "syncing…".
  await query(`UPDATE sync_runs SET status = 'aborted', finished_at = now() WHERE status = 'running' AND started_at < now() - interval '30 minutes'`);
  const [run] = await query<{ id: number }>(`INSERT INTO sync_runs DEFAULT VALUES RETURNING id`);
  const members = await query<{ id: number; github_login: string }>(`SELECT id, github_login FROM members`);
  const perMember: Record<string, number> = {};
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let removed = 0;

  for (const member of members) {
    try {
      const { items, closedUnmerged } = await collectForMember(member.github_login);
      let count = 0;
      const client = await pool.connect();
      try {
        for (const it of items) {
          const isPr = it.type === "pr_merged" || it.type === "pr_opened";
          const conflict = isPr
            ? `ON CONFLICT (member_id, url) WHERE type IN ('pr_merged', 'pr_opened') DO UPDATE
                 SET type = EXCLUDED.type, points = EXCLUDED.points, occurred_at = EXCLUDED.occurred_at, title = EXCLUDED.title
                 WHERE contributions.type IS DISTINCT FROM EXCLUDED.type`
            : `ON CONFLICT (member_id, url, type) DO NOTHING`;
          const res = await client.query<{ inserted: boolean }>(
            `INSERT INTO contributions (member_id, type, repo, title, url, points, occurred_at, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'github')
             ${conflict}
             RETURNING (xmax = 0) AS inserted`,
            [member.id, it.type, it.repo, it.title, it.url, POINTS[it.type], it.occurredAt],
          );
          for (const row of res.rows) {
            if (row.inserted) { inserted++; count++; } else updated++;
          }
        }
        if (closedUnmerged.length) {
          const del = await client.query(
            `DELETE FROM contributions WHERE member_id = $1 AND type = 'pr_opened' AND url = ANY($2::text[])`,
            [member.id, closedUnmerged],
          );
          removed += del.rowCount ?? 0;
        }
      } finally {
        client.release();
      }
      perMember[member.github_login] = count;
    } catch (err) {
      errors.push(`${member.github_login}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await query(
    `UPDATE sync_runs SET finished_at = now(), status = $2, inserted = $3, message = $4 WHERE id = $1`,
    [run.id, errors.length ? "partial" : "ok", inserted, errors.length ? errors.join("\n") : null],
  );
  return { inserted, updated, removed, perMember, errors };
}
