CREATE TABLE IF NOT EXISTS members (
  id            SERIAL PRIMARY KEY,
  github_login  TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributions (
  id           SERIAL PRIMARY KEY,
  member_id    INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('pr_merged', 'pr_closed', 'pr_opened', 'review', 'issue')),
  repo         TEXT NOT NULL,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  points       INTEGER NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL,
  source       TEXT NOT NULL DEFAULT 'github',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (url, type)
);

CREATE INDEX IF NOT EXISTS contributions_member_occurred_idx ON contributions (member_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS contributions_occurred_idx ON contributions (occurred_at DESC);

-- v2: one row per PR per member (pending -> merged updates in place), reviews unique per member.
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_url_type_key;
DELETE FROM contributions a USING contributions b
  WHERE a.type = 'pr_opened' AND b.type = 'pr_merged' AND a.member_id = b.member_id AND a.url = b.url;
CREATE UNIQUE INDEX IF NOT EXISTS contributions_member_url_type_key ON contributions (member_id, url, type);
CREATE UNIQUE INDEX IF NOT EXISTS contributions_member_pr_key ON contributions (member_id, url) WHERE type IN ('pr_merged', 'pr_opened');
-- v3: only merged PRs score (mirror of lib/points.ts)
UPDATE contributions SET points = 0 WHERE type IN ('pr_opened', 'review', 'issue') AND points <> 0;
UPDATE contributions SET points = 10 WHERE type = 'pr_merged' AND points <> 10;

-- v4: one member per GitHub account regardless of login casing (mirror of the API rule).
-- Case-variant duplicates double-count merged PRs, so move their contributions onto the
-- earliest member (rows that already exist there are dropped by the conflict),
-- remove the duplicates, then enforce uniqueness case-insensitively.
INSERT INTO contributions (member_id, type, repo, title, url, points, occurred_at, source, created_at)
SELECT k.keep_id, c.type, c.repo, c.title, c.url, c.points, c.occurred_at, c.source, c.created_at
FROM (SELECT lower(github_login) AS key, min(id) AS keep_id FROM members GROUP BY lower(github_login)) k
JOIN members m ON lower(m.github_login) = k.key AND m.id <> k.keep_id
JOIN contributions c ON c.member_id = m.id
ON CONFLICT DO NOTHING;
DELETE FROM members m
USING (SELECT lower(github_login) AS key, min(id) AS keep_id FROM members GROUP BY lower(github_login)) k
WHERE lower(m.github_login) = k.key AND m.id <> k.keep_id;
CREATE UNIQUE INDEX IF NOT EXISTS members_github_login_lower_key ON members (lower(github_login));

-- v5: org membership flag. When REQUIRED_ORG is set, registration verifies membership
-- and every sync re-checks it, flipping this flag when someone leaves (or rejoins).
ALTER TABLE members ADD COLUMN IF NOT EXISTS org_member BOOLEAN NOT NULL DEFAULT TRUE;

-- v6: closed-unmerged PRs are kept as rows (pr_closed) instead of being deleted,
-- so member pages and standings can show them. One row per PR per member still holds.
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_type_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_type_check
  CHECK (type IN ('pr_merged', 'pr_closed', 'pr_opened', 'review', 'issue'));
CREATE UNIQUE INDEX IF NOT EXISTS contributions_member_pr_lifecycle_key
  ON contributions (member_id, url) WHERE type IN ('pr_merged', 'pr_closed', 'pr_opened');
DROP INDEX IF EXISTS contributions_member_pr_key;

CREATE TABLE IF NOT EXISTS sync_runs (
  id           SERIAL PRIMARY KEY,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'running',
  inserted     INTEGER NOT NULL DEFAULT 0,
  message      TEXT
);
