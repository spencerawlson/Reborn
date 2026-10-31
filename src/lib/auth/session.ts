/**
 * The signed-in user for the current request, from the session cookie.
 * Server-only (reads next/headers cookies and the database).
 */
import { cookies } from "next/headers";
import { getDb } from "../db/index";
import { getSessionUser, SESSION_DAYS, type SessionUser } from "./accounts";

export const SESSION_COOKIE = "sia_session";

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUser(await getDb(), token);
}

/** Like getSession, but returns null instead of throwing (for headers and public pages). */
export async function getSessionSafe(): Promise<SessionUser | null> {
  try {
    return await getSession();
  } catch (error) {
    console.error("session lookup failed", error);
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // HTTPS-only in production. COOKIE_SECURE=false allows plain-HTTP access
    // (e.g. a server on the local network before TLS is set up).
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
