/**
 * Guard for admin pages: signed out → sign-in (then back here); signed in
 * without the admin role → 404, so admin routes aren't advertised.
 */
import { notFound, redirect } from "next/navigation";
import type { SessionUser } from "./accounts";
import { hasRole } from "./index";
import { getSession } from "./session";

export async function requireAdmin(returnTo: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/en/signin?next=${encodeURIComponent(returnTo)}`);
  if (!hasRole(session, "admin")) notFound();
  return session;
}
