import { query } from "./db";

/**
 * Burger tracking starts at laravel/framework#61305, merged 2026-08-25 13:03 UTC;
 * PRs merged before it are not tracked. BURGER_SINCE (an ISO timestamp) moves the
 * start without a code change.
 */
const DEFAULT_SINCE = "2026-08-25T13:03:18Z";

export function burgerSince(): Date {
  const raw = process.env.BURGER_SINCE?.trim();
  const date = new Date(raw || DEFAULT_SINCE);
  return Number.isNaN(date.getTime()) ? new Date(DEFAULT_SINCE) : date;
}

export type BurgerPR = {
  url: string;
  repo: string;
  title: string;
  merged_at: string;
  authors: { login: string; name: string }[];
  done: boolean;
};

/** Every tracked merged PR, newest first. A PR credited to several members appears once. */
export async function getBurgerPRs(): Promise<BurgerPR[]> {
  return query<BurgerPR>(
    `SELECT c.url, min(c.repo) AS repo, min(c.title) AS title, max(c.occurred_at) AS merged_at,
            json_agg(json_build_object('login', m.github_login, 'name', m.display_name) ORDER BY m.display_name) AS authors,
            bool_or(b.url IS NOT NULL) AS done
     FROM contributions c
     JOIN members m ON m.id = c.member_id
     LEFT JOIN burger_done b ON b.url = c.url
     WHERE c.type = 'pr_merged' AND c.occurred_at >= $1
     GROUP BY c.url
     ORDER BY merged_at DESC`,
    [burgerSince()],
  );
}

/**
 * Marks PRs done (or undoes that). Only URLs of tracked merged PRs are accepted,
 * so the table cannot fill with arbitrary strings. Returns how many rows changed.
 */
export async function setBurgerDone(urls: string[], done: boolean, login: string): Promise<number> {
  if (urls.length === 0) return 0;
  if (!done) {
    const rows = await query(`DELETE FROM burger_done WHERE url = ANY($1) RETURNING url`, [urls]);
    return rows.length;
  }
  const rows = await query(
    `INSERT INTO burger_done (url, marked_by)
     SELECT DISTINCT url, $3 FROM contributions
     WHERE type = 'pr_merged' AND occurred_at >= $2 AND url = ANY($1)
     ON CONFLICT (url) DO NOTHING
     RETURNING url`,
    [urls, burgerSince(), login],
  );
  return rows.length;
}
