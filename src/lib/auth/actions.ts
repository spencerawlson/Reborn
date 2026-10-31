"use server";

/**
 * Server actions for customer sign-up, sign-in, and sign-out. Next.js
 * server actions are POST-only and origin-checked (CSRF protection).
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db/index";
import { resolveLocale, type DictionaryKey } from "../i18n/index";
import {
  changePassword,
  updateProfile,
  clearAttempts,
  createCustomer,
  createSession,
  deleteSession,
  recordFailedAttempt,
  syncAdminRole,
  tooManyAttempts,
  verifyCredentials,
} from "./accounts";
import { clearSessionCookie, getSession, SESSION_COOKIE, setSessionCookie } from "./session";
import { revalidatePath } from "next/cache";

export interface FormState {
  error: DictionaryKey | null;
  values: Record<string, string>;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

/** Only same-site relative paths, never "//evil.example". */
function safeNext(next: string, fallback: string): string {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = resolveLocale(text(form, "locale"));
  const input = {
    name: text(form, "name"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    password: text(form, "password"),
    locale,
    department: text(form, "department"),
    city: text(form, "city"),
    neighborhood: text(form, "neighborhood"),
    directions: text(form, "directions"),
    haitiPhone: text(form, "haitiPhone"),
  };
  const { password: _password, ...values } = input;
  const db = await getDb();
  const result = await createCustomer(db, input);
  if (!result.ok) return { error: result.error, values };
  await syncAdminRole(db, result.userId, input.email);
  await setSessionCookie(await createSession(db, result.userId));
  redirect(`/${locale}/account`);
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = resolveLocale(text(form, "locale"));
  const email = text(form, "email");
  const values = { email };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${email.trim().toLowerCase()}|${ip}`;
  if (tooManyAttempts(key)) return { error: "errTooMany", values };

  const db = await getDb();
  const userId = await verifyCredentials(db, email, text(form, "password"));
  if (!userId) {
    recordFailedAttempt(key);
    return { error: "errCredentials", values };
  }
  clearAttempts(key);
  await syncAdminRole(db, userId, email);
  await setSessionCookie(await createSession(db, userId));
  redirect(safeNext(text(form, "next"), `/${locale}/account`));
}

export interface SaveState {
  error: DictionaryKey | null;
  saved: boolean;
}

/** The signed-in customer edits their own name, phone, and Haiti address. */
export async function updateProfileAction(_prev: SaveState, form: FormData): Promise<SaveState> {
  const locale = resolveLocale(text(form, "locale"));
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account/edit`);
  const error = await updateProfile(await getDb(), session.userId, {
    name: text(form, "name"),
    phone: text(form, "phone"),
    department: text(form, "department"),
    city: text(form, "city"),
    neighborhood: text(form, "neighborhood"),
    directions: text(form, "directions"),
    haitiPhone: text(form, "haitiPhone"),
  });
  if (error) return { error, saved: false };
  revalidatePath(`/${locale}/account`);
  return { error: null, saved: true };
}

/** Change password (current password required); other devices are signed out. */
export async function changePasswordAction(_prev: SaveState, form: FormData): Promise<SaveState> {
  const locale = resolveLocale(text(form, "locale"));
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account/edit`);
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const error = await changePassword(await getDb(), session.userId, text(form, "currentPassword"), text(form, "newPassword"), token);
  return error ? { error, saved: false } : { error: null, saved: true };
}

export async function signOutAction(form: FormData): Promise<void> {
  const locale = resolveLocale(text(form, "locale"));
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(await getDb(), token);
  await clearSessionCookie();
  redirect(`/${locale}`);
}
