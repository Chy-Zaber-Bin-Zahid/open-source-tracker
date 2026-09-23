import { NextResponse } from "next/server";
import { NEXT_COOKIE, STATE_COOKIE, authConfigured, cookieBase, newState, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Starts Sign in with GitHub. No scopes are requested: only the public login is read. */
export async function GET(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "GitHub sign-in is not configured on this deployment" }, { status: 503 });
  }
  const state = newState();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", new URL("/api/auth/github/callback", req.url).toString());
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  const res = NextResponse.redirect(authorize);
  res.cookies.set(STATE_COOKIE, state, { ...cookieBase, maxAge: 10 * 60 });
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  if (next) res.cookies.set(NEXT_COOKIE, next, { ...cookieBase, maxAge: 10 * 60 });
  else res.cookies.delete(NEXT_COOKIE);
  return res;
}
