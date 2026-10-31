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
  clearAttempts,
  createCustomer,
  createSession,
  deleteSession,
  recordFailedAttempt,
  syncAdminRole,
  tooManyAttempts,
  verifyCredentials,
} from "./accounts";
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from "./session";

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

export async function signOutAction(form: FormData): Promise<void> {
  const locale = resolveLocale(text(form, "locale"));
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(await getDb(), token);
  await clearSessionCookie();
  redirect(`/${locale}`);
}
