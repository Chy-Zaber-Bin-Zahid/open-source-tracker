import { NextResponse } from "next/server";
import { syncAll } from "@/lib/github";

export const maxDuration = 300;

export async function POST() {
  try {
    const result = await syncAll();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
