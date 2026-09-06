CREATE TABLE IF NOT EXISTS members (
  id            SERIAL PRIMARY KEY,
  github_login  TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributions (
  id           SERIAL PRIMARY KEY,
  member_id    INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('pr_merged', 'pr_opened', 'review', 'issue')),
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

CREATE TABLE IF NOT EXISTS sync_runs (
  id           SERIAL PRIMARY KEY,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'running',
  inserted     INTEGER NOT NULL DEFAULT 0,
  message      TEXT
);
