"use server";

/**
 * Server actions for the staff side: sign-up (invitation or ADMIN_EMAILS
 * bootstrap), creating and revoking invitations (admins only).
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db/index";
import type { DictionaryKey } from "../i18n/index";
import { createSession } from "./accounts";
import { hasRole } from "./index";
import { getSession, setSessionCookie } from "./session";
import { createInvitation, createStaffAccount, revokeInvitation, setAccessLevel } from "./staff";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

export interface StaffFormState {
  error: DictionaryKey | null;
  values: Record<string, string>;
}

export async function staffSignUpAction(_prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const input = {
    name: text(form, "name"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    password: text(form, "password"),
    invite: text(form, "invite"),
  };
  const { password: _pw, ...values } = input;
  const db = await getDb();
  const result = await createStaffAccount(db, input);
  if (!result.ok) return { error: result.error, values };
  await setSessionCookie(await createSession(db, result.userId));
  redirect("/admin");
}

export interface InviteState {
  error: DictionaryKey | null;
  link: string | null;
  email: string;
}

/** Admin creates an invitation; the one-time link is returned to show (and copy) once. */
export async function createInvitationAction(_prev: InviteState, form: FormData): Promise<InviteState> {
  const session = await getSession();
  if (!session || !hasRole(session, "admin")) throw new Error("forbidden");
  const email = text(form, "email");
  const result = await createInvitation(await getDb(), { email, role: text(form, "role"), invitedBy: session.userId });
  if (!result.ok) return { error: result.error, link: null, email };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || /^\d+\.\d+\.\d+\.\d+/.test(host) ? "http" : "https");
  revalidatePath("/admin/team");
  return { error: null, link: `${proto}://${host}/admin/signup?invite=${result.token}`, email };
}

export async function revokeInvitationAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !hasRole(session, "admin")) throw new Error("forbidden");
  await revokeInvitation(await getDb(), text(form, "id"), session.userId);
  revalidatePath("/admin/team");
}

/** Admin changes a team member's access level (Admin, Staff, or no access). */
export async function setAccessLevelAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !hasRole(session, "admin")) throw new Error("forbidden");
  await setAccessLevel(await getDb(), { userId: text(form, "userId"), level: text(form, "level"), adminId: session.userId });
  revalidatePath("/admin/team");
}
