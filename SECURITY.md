# Security policy

## Supported versions

This project is pre-1.0 and self-hosted. Only the latest commit on `main` receives fixes.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub's [private vulnerability reporting](https://github.com/Chy-Zaber-Bin-Zahid/open-source-tracker/security/advisories/new) on this repository.

Please include what the problem is, how to reproduce it, and what an attacker could do with it. You can expect an acknowledgement within a few days.

## Things worth knowing if you self-host this

- **The app has no authentication.** Anyone who can reach it can add or remove members and trigger a sync. Run it on an internal network, or put an authenticating proxy in front of it.
- **`GITHUB_TOKEN` is a real credential.** It lives in `.env`, which is gitignored. Never commit it, and never paste it into an issue or a log excerpt.
- **The default Postgres credentials in `docker-compose.yml` are `arena` / `arena`.** They are fine for a container on a local network that is not exposed, and are not fine for anything reachable from the internet. Change them, and don't publish port 5439 beyond your host.
