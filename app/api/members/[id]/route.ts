import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const rows = await query(`DELETE FROM members WHERE id = $1 RETURNING id`, [memberId]);
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
