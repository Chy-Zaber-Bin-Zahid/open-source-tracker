// Demo data so the board looks alive before the first GitHub sync. Safe to re-run.
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const members = [
  ["sabitur", "Sabitur Rahman"],
  ["rafik", "Rafi Karim"],
  ["nusrat-a", "Nusrat Ahmed"],
  ["tanvirh", "Tanvir Hossain"],
  ["maliha", "Maliha Islam"],
];
const repos = ["vercel/ai", "date-fns/date-fns", "withastro/astro", "tailwindlabs/tailwindcss", "octokit/rest.js", "vercel/next.js"];
const points = { pr_merged: 10, review: 0, issue: 0, pr_opened: 0 };
const weights = [
  ["pr_merged", 3],
  ["review", 4],
  ["issue", 2],
  ["pr_opened", 3],
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function pickType() {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of weights) {
    if ((r -= w) < 0) return t;
  }
  return "review";
}

for (const [login, name] of members) {
  const { rows } = await client.query(
    `INSERT INTO members (github_login, display_name) VALUES ($1, $2)
     ON CONFLICT (github_login) DO UPDATE SET display_name = EXCLUDED.display_name RETURNING id`,
    [login, name],
  );
  const memberId = rows[0].id;
  const activity = 8 + Math.floor(Math.random() * 30);
  for (let i = 0; i < activity; i++) {
    const type = pickType();
    const repo = pick(repos);
    const n = 1000 + Math.floor(Math.random() * 9000);
    const daysAgo = Math.floor(Math.random() * 45);
    const occurred = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 86400000);
    const kind = type === "issue" ? "issues" : "pull";
    await client.query(
      `INSERT INTO contributions (member_id, type, repo, title, url, points, occurred_at, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'seed') ON CONFLICT DO NOTHING`,
      [memberId, type, repo, `${type === "issue" ? "bug" : "fix"}: demo contribution #${n}`, `https://github.com/${repo}/${kind}/${n}`, points[type], occurred],
    );
  }
}
await client.end();
console.log("seeded demo members and contributions");
