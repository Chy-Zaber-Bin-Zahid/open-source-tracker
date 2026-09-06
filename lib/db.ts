import { Pool } from "pg";
import { APP_TZ } from "./tz";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

// Keep Postgres date math (day buckets, streaks) in the same timezone the app
// computes its own day keys in. APP_TZ is used rather than TZ because Vercel
// reserves TZ and pins functions to UTC.
pool.on("connect", (client) => {
  client.query("SET timezone TO $1", [APP_TZ]).catch(() => {});
});

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
