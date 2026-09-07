import { NextResponse } from "next/server";
import { getStandings, getTeamStats } from "@/lib/queries";
import { parsePeriod } from "@/lib/period";

export async function GET(req: Request) {
  // Explicitly all-time: the board defaults to this week, but changing the API's
  // default would silently change the answer for anything already calling it.
  const period = parsePeriod(new URL(req.url).searchParams.get("period"), "all");
  const standings = await getStandings(period);
  const stats = await getTeamStats(period, standings);
  return NextResponse.json({ period, standings, stats });
}
