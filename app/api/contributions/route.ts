import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getFeed } from "@/lib/queries";
import { POINTS, isContributionType } from "@/lib/points";
import { parsePeriod, periodStart } from "@/lib/period";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const memberId = searchParams.get("member") ? Number(searchParams.get("member")) : undefined;
  const period = parsePeriod(searchParams.get("period") ?? "all");
  return NextResponse.json(await getFeed({ limit, memberId, since: periodStart(period) }));
}

/** Manually log a contribution the GitHub search missed (private repos, non-GitHub forges, talks, etc). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { member_id?: number; type?: string; repo?: string; title?: string; url?: string; occurred_at?: string }
    | null;
  if (!body || !Number.isInteger(body.member_id)) return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  if (!isContributionType(body.type)) return NextResponse.json({ error: "Invalid contribution type" }, { status: 400 });
  const repo = body.repo?.trim();
  const title = body.title?.trim();
  const url = body.url?.trim();
  if (!repo || !title || !url) return NextResponse.json({ error: "repo, title and url are required" }, { status: 400 });
  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();
  if (Number.isNaN(occurredAt.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const rows = await query(
    `INSERT INTO contributions (member_id, type, repo, title, url, points, occurred_at, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
     ON CONFLICT DO NOTHING RETURNING id`,
    [body.member_id, body.type, repo, title, url, POINTS[body.type], occurredAt],
  );
  if (rows.length === 0) return NextResponse.json({ error: "That contribution is already logged" }, { status: 409 });
  return NextResponse.json(rows[0], { status: 201 });
}
