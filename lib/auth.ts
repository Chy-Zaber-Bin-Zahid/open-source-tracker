import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sign in with GitHub, used only to decide who may mark burger parties.
 *
 * Browsing never needs an account. Signing in proves which GitHub account the
 * visitor holds; BURGER_ADMINS then decides whether that account may mark
 * parties. The admin list is read on every request rather than baked into the
 * session, so removing someone from it takes effect on the next deploy.
 *
 * The session is a small HMAC-signed cookie holding the login and an expiry.
 * The GitHub access token is used once to read the login and then discarded.
 */

export const SESSION_COOKIE = "ct_session";
export const STATE_COOKIE = "ct_oauth_state";
const SESSION_DAYS = 30;

export type Viewer = { login: string };

function secret(): string | null {
  return process.env.AUTH_SECRET || null;
}

/** Sign-in works only when the OAuth app and the signing secret are all configured. */
export function authConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET && secret());
}

/** GitHub logins allowed to mark burger parties, from BURGER_ADMINS (comma-separated). */
export function burgerAdmins(): string[] {
  return (process.env.BURGER_ADMINS ?? "")
    .split(",")
    .map((login) => login.trim().replace(/^@/, ""))
    .filter(Boolean);
}

/** GitHub logins are case-insensitive, so the comparison is too. */
export function isBurgerAdmin(login: string | null | undefined): boolean {
  if (!login) return false;
  const key = login.toLowerCase();
  return burgerAdmins().some((admin) => admin.toLowerCase() === key);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSession(login: string): { value: string; maxAge: number } {
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET is not set");
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ login, exp: Date.now() + maxAge * 1000 })).toString("base64url");
  return { value: `${payload}.${sign(payload, key)}`, maxAge };
}

export function readSession(value: string | undefined): Viewer | null {
  const key = secret();
  if (!key || !value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { login?: unknown; exp?: unknown };
    if (typeof data.login !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { login: data.login };
  } catch {
    return null;
  }
}

/** The signed-in visitor, or null. Usable from Server Components and Route Handlers. */
export async function getViewer(): Promise<Viewer | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export function newState(): string {
  return randomBytes(16).toString("base64url");
}

export const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
