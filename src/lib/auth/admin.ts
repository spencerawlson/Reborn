/**
 * Guards for staff pages. Signed out -> staff sign-in (then back here);
 * signed in without the needed role -> 404, so admin routes aren't advertised.
 * - requireStaff: admins and staff (customers, packages, labels).
 * - requireAdmin: admins only (business settings, team).
 */
import { notFound, redirect } from "next/navigation";
import type { SessionUser } from "./accounts";
import { hasRole } from "./index";
import { getSession } from "./session";

async function guard(returnTo: string, allowStaff: boolean): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/admin/signin?next=${encodeURIComponent(returnTo)}`);
  if (!(hasRole(session, "admin") || (allowStaff && hasRole(session, "staff")))) notFound();
  return session;
}

export const requireStaff = (returnTo: string) => guard(returnTo, true);
export const requireAdmin = (returnTo: string) => guard(returnTo, false);

export function isAdmin(session: SessionUser): boolean {
  return hasRole(session, "admin");
}
