import { NextResponse } from "next/server";
import { getViewer, isBurgerAdmin } from "@/lib/auth";
import { burgerSince, getBurgerPRs, setBurgerDone } from "@/lib/burgers";

export const dynamic = "force-dynamic";

export async function GET() {
  const prs = await getBurgerPRs();
  const done = prs.filter((p) => p.done).length;
  return NextResponse.json({ since: burgerSince(), merged: prs.length, done, due: prs.length - done, prs });
}

/**
 * Marks PRs' burger parties done or undoes that: `{ urls: string[], done: boolean }`.
 * Only signed-in GitHub accounts listed in BURGER_ADMINS may call it.
 */
export async function POST(req: Request) {
  // The session cookie is SameSite=Lax, which already keeps it off cross-site
  // POSTs; this rejects them outright as well.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in with GitHub first" }, { status: 401 });
  if (!isBurgerAdmin(viewer.login)) {
    return NextResponse.json({ error: `@${viewer.login} is not allowed to mark burger parties` }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { urls?: unknown; done?: unknown } | null;
  const urls = Array.isArray(body?.urls) ? body.urls.filter((u): u is string => typeof u === "string") : [];
  if (urls.length === 0 || urls.length > 500 || typeof body?.done !== "boolean") {
    return NextResponse.json({ error: "Send { urls: string[], done: boolean }" }, { status: 400 });
  }
  const changed = await setBurgerDone(urls, body.done, viewer.login);
  return NextResponse.json({ changed });
}
