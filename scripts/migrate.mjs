/**
 * Applies db/schema.sql.
 *
 * Runs in two places, and must behave in both:
 *   - Docker: on every container start, before the server boots.
 *   - Vercel: from the `vercel-build` script, before `next build`.
 *
 * The schema is written to be idempotent, so reapplying it in full is the
 * migration. Two things make that safe when more than one deploy is in flight:
 *
 *   1. Everything runs inside one transaction, so the schema is never left
 *      half-applied if a statement fails.
 *   2. A transaction-scoped advisory lock serialises concurrent migrators.
 *      Transaction-scoped rather than session-scoped on purpose: it survives a
 *      transaction pooler such as Neon's `-pooler` endpoint or PgBouncer, which
 *      pins a transaction to one server connection but not a session.
 *
 * This means schema.sql must stay transactional — no CREATE INDEX CONCURRENTLY,
 * no VACUUM.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, "..", "db", "schema.sql"), "utf8");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

/** Arbitrary, but every process that migrates this schema must use the same key. */
const SCHEMA_LOCK_KEY = 733912004517;

/** Docker starts Postgres alongside the app, so waiting is normal there. */
const maxAttempts = Number(process.env.MIGRATE_MAX_ATTEMPTS ?? 30);

const client = new pg.Client({ connectionString: url });
for (let attempt = 1; ; attempt++) {
  try {
    await client.connect();
    break;
  } catch (err) {
    if (attempt >= maxAttempts) throw err;
    console.log(`database not ready (attempt ${attempt}/${maxAttempts}), retrying...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [SCHEMA_LOCK_KEY]);
  await client.query(sql);
  await client.query("COMMIT");
  console.log("schema applied");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("migration failed, nothing was applied");
  throw err;
} finally {
  await client.end();
}
