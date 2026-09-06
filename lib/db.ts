import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

// Keep Postgres date math (day buckets, streaks) in the same timezone as the app (TZ env, default UTC).
pool.on("connect", (client) => {
  const tz = process.env.TZ || "UTC";
  client.query("SET timezone TO $1", [tz]).catch(() => {});
});

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
