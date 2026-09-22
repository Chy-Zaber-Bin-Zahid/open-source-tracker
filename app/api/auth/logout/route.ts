import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/** Posted by the Sign out button; 303 so the browser follows up with a GET. */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/burgers", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
