import { NextResponse, type NextRequest } from "next/server";
import { NEXT_COOKIE, SESSION_COOKIE, STATE_COOKIE, authConfigured, cookieBase, createSession, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

function back(req: NextRequest, error?: string) {
  // Errors are shown on /burgers, which has the sign-in panel.
  const url = new URL((!error && safeNext(req.cookies.get(NEXT_COOKIE)?.value)) || "/burgers", req.url);
  if (error) url.searchParams.set("auth", error);
  const res = NextResponse.redirect(url);
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}

/**
 * GitHub sends the visitor back here. The code is exchanged for a token, the
 * token is used once to read the login, and only the login is kept.
 */
export async function GET(req: NextRequest) {
  if (!authConfigured()) return back(req, "unavailable");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(STATE_COOKIE)?.value;
  // Guards against a forged callback logging someone into another account.
  if (!code || !state || !expected || state !== expected) return back(req, "failed");

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: new URL("/api/auth/github/callback", req.url).toString(),
      }),
      cache: "no-store",
    });
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return back(req, "failed");

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "contribution-tracker" },
      cache: "no-store",
    });
    const user = (await userRes.json()) as { login?: string };
    if (!userRes.ok || typeof user.login !== "string") return back(req, "failed");

    const session = createSession(user.login);
    const res = back(req);
    res.cookies.set(SESSION_COOKIE, session.value, { ...cookieBase, maxAge: session.maxAge });
    return res;
  } catch {
    return back(req, "failed");
  }
}
