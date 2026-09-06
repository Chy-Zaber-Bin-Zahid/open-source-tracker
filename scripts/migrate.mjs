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

const client = new pg.Client({ connectionString: url });
const maxAttempts = 30;
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
await client.query(sql);
await client.end();
console.log("schema applied");
