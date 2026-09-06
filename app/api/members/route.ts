import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMembers } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(await getMembers());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { github_login?: string; display_name?: string } | null;
  const login = body?.github_login?.trim().replace(/^@/, "");
  const name = body?.display_name?.trim() || login;
  if (!login || !/^[a-zA-Z0-9-]{1,39}$/.test(login)) {
    return NextResponse.json({ error: "A valid GitHub username is required" }, { status: 400 });
  }
  try {
    const [member] = await query(
      `INSERT INTO members (github_login, display_name) VALUES ($1, $2) RETURNING id, github_login, display_name, created_at`,
      [login, name],
    );
    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("duplicate")) return NextResponse.json({ error: `@${login} is already on the board` }, { status: 409 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
