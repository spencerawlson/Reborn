/**
 * Customer accounts and sessions. Every function takes the Db, so tests
 * run the real SQL against PGlite.
 */
import { createHash, randomBytes } from "node:crypto";
import type { Db } from "../db/index";
import type { DictionaryKey, Locale } from "../i18n/index";
import { isDepartmentCode } from "../shipping/departments";
import { DUMMY_HASH_PROMISE, hashPassword, verifyPassword } from "./password";
import type { Role } from "./index";

export const SESSION_DAYS = 30;
export const MIN_PASSWORD = 10;

export interface SignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  locale: Locale;
  department: string;
  city: string;
  neighborhood: string;
  directions: string;
  haitiPhone: string;
}

export interface SessionUser {
  userId: string;
  email: string;
  displayName: string;
  locale: Locale;
  roles: Role[];
}

export interface Account extends SessionUser {
  phone: string | null;
  suiteCode: string | null;
  haiti: { department: string; city: string; neighborhood: string | null; directions: string | null; phone: string | null } | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Returns the dictionary key of the first problem, or null if valid. */
export function validateSignup(input: SignupInput): DictionaryKey | null {
  if (!input.name.trim() || !input.email.trim() || !input.phone.trim() || !input.city.trim()) return "errRequired";
  if (!isDepartmentCode(input.department)) return "errRequired";
  if (!EMAIL.test(normalizeEmail(input.email)) || input.email.length > 254) return "errEmail";
  if (input.password.length < MIN_PASSWORD || input.password.length > 200) return "errPassword";
  if (input.name.length > 120 || input.phone.length > 40 || input.city.length > 120) return "errRequired";
  if (input.neighborhood.length > 120 || input.directions.length > 500 || input.haitiPhone.length > 40) return "errRequired";
  return null;
}

/** Creates user + customer role + profile (with suite number) in one statement. */
export async function createCustomer(
  db: Db,
  input: SignupInput,
): Promise<{ ok: true; userId: string; suiteCode: string } | { ok: false; error: DictionaryKey }> {
  const invalid = validateSignup(input);
  if (invalid) return { ok: false, error: invalid };
  const passwordHash = await hashPassword(input.password);
  const blank = (s: string) => (s.trim() ? s.trim() : null);
  try {
    const rows = await db.query<{ id: string; suite_code: string }>(
      `WITH u AS (
         INSERT INTO users (email, password_hash, display_name, locale, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING id
       ), r AS (
         INSERT INTO roles (user_id, role) SELECT id, 'customer' FROM u
       ), p AS (
         INSERT INTO customer_profiles (user_id, haiti_department, haiti_city, haiti_neighborhood, haiti_directions, haiti_phone)
         SELECT id, $6, $7, $8, $9, $10 FROM u RETURNING user_id, suite_code
       )
       SELECT user_id AS id, suite_code FROM p`,
      [
        normalizeEmail(input.email),
        passwordHash,
        input.name.trim(),
        input.locale,
        input.phone.trim(),
        input.department,
        input.city.trim(),
        blank(input.neighborhood),
        blank(input.directions),
        blank(input.haitiPhone),
      ],
    );
    return { ok: true, userId: rows[0].id, suiteCode: rows[0].suite_code };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "errEmailTaken" };
    throw error;
  }
}

/** Returns the user id when the email and password match an active account. */
export async function verifyCredentials(db: Db, email: string, password: string): Promise<string | null> {
  const rows = await db.query<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE email = $1 AND status = 'active' AND deleted_at IS NULL`,
    [normalizeEmail(email)],
  );
  const stored = rows[0]?.password_hash ?? (await DUMMY_HASH_PROMISE);
  const ok = await verifyPassword(password, stored);
  return ok && rows[0] ? rows[0].id : null;
}

/** Grants the admin role when the email is listed in ADMIN_EMAILS. */
export async function syncAdminRole(db: Db, userId: string, email: string, adminEmails = process.env.ADMIN_EMAILS ?? "") {
  const admins = adminEmails.split(",").map(normalizeEmail).filter(Boolean);
  if (!admins.includes(normalizeEmail(email))) return;
  await db.query(`INSERT INTO roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING`, [userId]);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a session and returns the raw token for the cookie (only its hash is stored). */
export async function createSession(db: Db, userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), userId, SESSION_DAYS],
  );
  return token;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
}

export async function getSessionUser(db: Db, token: string): Promise<SessionUser | null> {
  const rows = await db.query<{ id: string; email: string; display_name: string; locale: Locale; roles: Role[] }>(
    `SELECT u.id, u.email::text AS email, u.display_name, u.locale,
            COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
       FROM sessions s
       JOIN users u ON u.id = s.user_id AND u.status = 'active' AND u.deleted_at IS NULL
       LEFT JOIN roles r ON r.user_id = u.id
      WHERE s.token_hash = $1 AND s.expires_at > now()
      GROUP BY u.id`,
    [hashToken(token)],
  );
  const row = rows[0];
  return row ? { userId: row.id, email: row.email, displayName: row.display_name, locale: row.locale, roles: row.roles } : null;
}

export async function getAccount(db: Db, user: SessionUser): Promise<Account> {
  const rows = await db.query<{
    phone: string | null;
    suite_code: string | null;
    haiti_department: string | null;
    haiti_city: string | null;
    haiti_neighborhood: string | null;
    haiti_directions: string | null;
    haiti_phone: string | null;
  }>(
    `SELECT u.phone, p.suite_code, p.haiti_department, p.haiti_city, p.haiti_neighborhood, p.haiti_directions, p.haiti_phone
       FROM users u LEFT JOIN customer_profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [user.userId],
  );
  const r = rows[0];
  return {
    ...user,
    phone: r?.phone ?? null,
    suiteCode: r?.suite_code ?? null,
    haiti: r?.haiti_department
      ? {
          department: r.haiti_department,
          city: r.haiti_city ?? "",
          neighborhood: r.haiti_neighborhood,
          directions: r.haiti_directions,
          phone: r.haiti_phone,
        }
      : null,
  };
}

/** Simple in-memory brake on repeated failed sign-ins (per email + IP). */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function tooManyAttempts(key: string, now = Date.now()): boolean {
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string, now = Date.now()): void {
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

/* Editing one's own account ----------------------------------------------- */

export interface ProfileInput {
  name: string;
  phone: string;
  department: string;
  city: string;
  neighborhood: string;
  directions: string;
  haitiPhone: string;
}

export function validateProfile(input: ProfileInput): DictionaryKey | null {
  if (!input.name.trim() || !input.phone.trim() || !input.city.trim()) return "errRequired";
  if (!isDepartmentCode(input.department)) return "errRequired";
  if (input.name.length > 120 || input.phone.length > 40 || input.city.length > 120) return "errRequired";
  if (input.neighborhood.length > 120 || input.directions.length > 500 || input.haitiPhone.length > 40) return "errRequired";
  return null;
}

/** Updates the customer's own name, phone, and Haiti address. Email, suite, and warehouse addresses are not editable here. */
export async function updateProfile(db: Db, userId: string, input: ProfileInput): Promise<DictionaryKey | null> {
  const invalid = validateProfile(input);
  if (invalid) return invalid;
  const blank = (s: string) => (s.trim() ? s.trim() : null);
  await db.query(
    `WITH u AS (
       UPDATE users SET display_name = $2, phone = $3, updated_at = now() WHERE id = $1 RETURNING id
     )
     UPDATE customer_profiles
        SET haiti_department = $4, haiti_city = $5, haiti_neighborhood = $6, haiti_directions = $7, haiti_phone = $8
      WHERE user_id = (SELECT id FROM u)`,
    [userId, input.name.trim(), input.phone.trim(), input.department, input.city.trim(), blank(input.neighborhood), blank(input.directions), blank(input.haitiPhone)],
  );
  return null;
}

/**
 * Changes the password after checking the current one, and signs out every
 * other session (the current one, identified by its token, stays).
 */
export async function changePassword(
  db: Db,
  userId: string,
  current: string,
  next: string,
  keepToken: string | null,
): Promise<DictionaryKey | null> {
  const rows = await db.query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  if (!rows[0] || !(await verifyPassword(current, rows[0].password_hash))) return "errCurrentPassword";
  if (next.length < MIN_PASSWORD || next.length > 200) return "errPassword";
  await db.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, await hashPassword(next)]);
  await db.query(`DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`, [userId, keepToken ? hashToken(keepToken) : ""]);
  return null;
}
