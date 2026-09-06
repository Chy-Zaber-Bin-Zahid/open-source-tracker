import { NextResponse } from "next/server";
import { getStandings, getTeamStats } from "@/lib/queries";
import { parsePeriod } from "@/lib/period";

export async function GET(req: Request) {
  const period = parsePeriod(new URL(req.url).searchParams.get("period"));
  const standings = await getStandings(period);
  const stats = await getTeamStats(period, standings);
  return NextResponse.json({ period, standings, stats });
}
