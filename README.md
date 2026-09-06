# Open Source Tracker

A small, self-hosted board that shows what your team has contributed to open source. Add teammates by GitHub username, sync, and see everyone's merged pull requests — with pending PRs, issues and reviews shown alongside for context.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![The board, all time](docs/screenshots/board.png)

<p align="center"><em>The board in real use — four teammates, 38 merged pull requests across grafana/k6, microsoft/playwright, SeleniumHQ/selenium and laravel/framework.</em></p>

**Stack:** Next.js 16 (App Router, route handlers as the backend) · React 19 · Tailwind CSS 4 · PostgreSQL 16 · Docker Compose. No ORM, no auth layer, no external services beyond the GitHub API.

---

## What it does

- Pulls each member's public GitHub activity through the search API and stores it in Postgres.
- Orders members by **merged pull requests** for this week, this month, or all time.
- Shows a feed of recent contributions, per-member pages, and team totals.
- Re-syncs every 15 minutes on its own, or on demand from the header.

### It is a tracker, not a competition

There are no points, no medals and no streak hype anywhere in the interface. It is a plain, verifiable record of what the team merged.

**Only merged pull requests affect the ordering.** Pending PRs, issues and reviews are pulled in and displayed for context, but they never move anyone up the board.

Each pull request is a single entry: it appears as pending while open, becomes a merged PR when it merges, and disappears if it is closed without merging.

Contributions to repositories a member owns themselves are ignored by default, so nobody's own side projects inflate the board. Set `INCLUDE_OWN_REPOS=true` to count them.

---

## Screens

### Per-member pages

Every merged pull request a person has landed, which repositories they land in most, and the issues they have filed.

![A member page](docs/screenshots/member.png)

### Adding teammates

Add someone by GitHub username. Their public pull requests, reviews and issues are pulled in on the next sync.

![The members page](docs/screenshots/members.png)

---

## Quick start (Docker)

Everything — app, database and the background sync — comes up with one command.

```bash
git clone https://github.com/Chy-Zaber-Bin-Zahid/open-source-tracker.git
cd open-source-tracker

cp .env.example .env      # add a GITHUB_TOKEN here, see below
docker compose up --build
```

Open <http://localhost:3000>, add your teammates on the **Members** page, and press **Sync GitHub**.

## Local development

Requires Node.js 20.9+ and Docker for Postgres.

```bash
cp .env.example .env
docker compose up -d db   # Postgres on localhost:5439
npm install
npm run db:migrate
npm run db:seed           # optional demo data, so the board isn't empty
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply `db/schema.sql` (idempotent, safe to re-run) |
| `npm run db:seed` | Insert demo members and contributions |

---

## Configuration

All settings live in `.env`. Copy `.env.example` to start.

| Variable | Default | What it controls |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://arena:arena@localhost:5439/arena` | Postgres connection. Docker Compose sets this for the web container itself. |
| `GITHUB_TOKEN` | *(empty)* | GitHub personal access token. Strongly recommended — see below. |
| `SYNC_SINCE` | Jan 1 of the current year | Only pull contributions on or after this ISO date. |
| `INCLUDE_OWN_REPOS` | `false` | Set `true` to also count activity on repos the member owns. |
| `DB_PORT` | `5439` | Host port Postgres is published on. 5432 is often already taken. |
| `TZ` | `UTC` | IANA timezone that defines "this week" and "this month" boundaries. |

### The GitHub token

Without a token the GitHub search API allows **10 requests per minute**, which makes a sync for even a handful of people take several minutes. With one you get 30 per minute.

Create a token at <https://github.com/settings/tokens>. **No scopes are needed** if you only track public contributions. Put it in `.env` as `GITHUB_TOKEN`.

`.env` is gitignored. Keep it that way — never commit a token.

---

## API

Route handlers under `app/api` are the entire backend.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/leaderboard?period=week\|month\|all` | Standings, sparklines and team stats |
| `GET` | `/api/contributions?period=&member=&limit=` | Contribution feed |
| `POST` | `/api/contributions` | Log a contribution manually |
| `GET` | `/api/members` | List members |
| `POST` | `/api/members` | Add a member by GitHub login |
| `DELETE` | `/api/members/:id` | Remove a member and all their contributions |
| `POST` | `/api/sync` | Pull the latest contributions from GitHub for everyone |

---

## Project layout

```
app/                    Next.js App Router
  page.tsx              The board (week / month / all time)
  members/              Member list and per-member pages
  api/                  Route handlers — the backend
components/             Presentational React components
lib/
  db.ts                 pg connection pool
  queries.ts            Every SQL read the app performs
  github.ts             GitHub search API client and the sync routine
  period.ts             Week / month / all-time window maths
  points.ts             Per-type weights for the DB `points` column
  format.ts             Number and date formatting
db/schema.sql           The whole schema, idempotent
scripts/
  migrate.mjs           Applies db/schema.sql (runs on container start)
  seed.mjs              Demo data
design/                 Design canvas source (main direction + two alternates)
```

### How syncing works

`POST /api/sync` walks every member and, for each, queries the GitHub search API for their merged PRs, open PRs, issues and reviews since `SYNC_SINCE`. Results are upserted with one row per pull request per member, so a PR that was pending last sync is updated in place when it merges. PRs that were closed without merging are deleted. Each run is recorded in the `sync_runs` table.

### Database

Two tables and a log: `members`, `contributions`, `sync_runs`. There is no ORM and no migration tool — `db/schema.sql` is written to be idempotent and is reapplied in full on every container start by `scripts/migrate.mjs`. Schema changes must therefore use `IF NOT EXISTS` / `IF EXISTS` guards.

---

## Deploying

The `Dockerfile` produces a standalone Next.js image and runs migrations on start. `docker-compose.yml` wires it to Postgres and a small sync container that pings `/api/sync` every 15 minutes.

**Before you expose this anywhere:** the app has no authentication. Anyone who can reach it can add or remove members and trigger syncs. Run it on an internal network, or put an authenticating proxy in front of it. Also change the default `arena` / `arena` Postgres credentials. See [SECURITY.md](SECURITY.md).

---

## Design

The design canvas — the implemented dark board plus two alternate directions — lives in `design/*.dc.html`.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first; it covers the dev setup, the checks to run, and the four design principles the project is built on.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © Chy-Zaber-Bin-Zahid
