# Contributing

Thanks for taking the time. This is a small, self-hosted app — contributions of any size are welcome, from a typo fix to a new view.

## Before you start

- For anything more than a small fix, **open an issue first** so we can agree on the shape of the change before you write it.
- Check the [open issues](https://github.com/Chy-Zaber-Bin-Zahid/open-source-tracker/issues) — something similar may already be in flight.

## Set up a development environment

You need Node.js 20.9+ and Docker (for Postgres).

```bash
git clone https://github.com/Chy-Zaber-Bin-Zahid/open-source-tracker.git
cd open-source-tracker
cp .env.example .env       # add a GITHUB_TOKEN, see below

docker compose up -d db    # Postgres on localhost:5439
npm install
npm run db:migrate
npm run db:seed            # optional demo members and contributions
npm run dev
```

The app runs at http://localhost:3000.

### About the GitHub token

Syncing hits the GitHub search API. Unauthenticated, that is 10 requests per minute, which makes a sync for a handful of people take minutes. Create a token at <https://github.com/settings/tokens> — no scopes are needed for public repositories — and put it in `.env` as `GITHUB_TOKEN`.

**Never commit `.env`.** It is gitignored; keep it that way.

## Before you open a pull request

Run all three:

```bash
npm run lint
npm run typecheck
npm run build
```

Please run them — **automated CI is paused right now**, so your local run is the only check there is.

The workflow in `.github/workflows/ci.yml` runs these same three checks, plus it applies `db/schema.sql` twice to make sure migrations stay idempotent and builds the Docker image. It is currently set to `workflow_dispatch` (manual only) because the maintainer's GitHub account is billing-locked and Actions refuses to start any job. It will be switched back to running on every pull request once that is resolved.

## Design principles

These are the rules the project is built on. Please don't work against them without discussing it first.

1. **This is a tracker, not a competition.** No points, no medals, no streak hype, no "who shipped the most" copy. It is a plain record of what the team merged.
2. **Merged pull requests are the only thing that ranks people.** Pending PRs, issues and reviews are pulled in and displayed for context, but they never affect ordering.
3. **One row per pull request per member.** A PR updates in place as it moves from pending to merged, or to closed-unmerged. Closed PRs are kept for the record but never count.
4. **Everything is verifiable against GitHub.** If a number changes, it should be because GitHub says so.

## Code conventions

- TypeScript everywhere, `strict` on. No `any` without a comment explaining why.
- Database access is plain `pg` — there is no ORM, and adding one is a discussion, not a PR.
- Schema changes go in `db/schema.sql` and must be idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), because `scripts/migrate.mjs` reapplies the whole file on every container start.
- Server-side data access belongs in `lib/queries.ts`, GitHub API calls in `lib/github.ts`. Route handlers stay thin.
- Components live in `components/` and are presentational where possible.

## Commits and pull requests

- Write commit subjects in the imperative: "Add member search", not "Added member search".
- Keep a pull request to one logical change.
- Fill in the pull request template, especially "How to test".

## Reporting a security issue

Please don't open a public issue. See [SECURITY.md](SECURITY.md).
