/**
 * Staff accounts — separate from customers (no Haiti address, no suite).
 *
 * - Team members join with a single-use invitation link created by an
 *   admin (7 days; only the token's SHA-256 is stored).
 * - Bootstrap: an email listed in ADMIN_EMAILS may sign up as admin without
 *   an invitation, so the first admin can exist.
 * Every invitation, acceptance, and revocation is audit-logged.
 */
import { randomBytes } from "node:crypto";
import type { Db } from "../db/index";
import type { DictionaryKey } from "../i18n/index";
import { hashToken, MIN_PASSWORD, normalizeEmail } from "./accounts";
import { hashPassword } from "./password";

export type StaffRole = "admin" | "staff";
export const INVITE_DAYS = 7;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isStaffRole(value: string): value is StaffRole {
  return value === "admin" || value === "staff";
}

export interface Invitation {
  id: string;
  email: string;
  role: StaffRole;
  createdAt: Date;
  expiresAt: Date;
}

/** Creates an invitation and returns the raw token for the link (shown once). Revokes older pending invites for the email. */
export async function createInvitation(
  db: Db,
  args: { email: string; role: string; invitedBy: string },
): Promise<{ ok: true; token: string } | { ok: false; error: DictionaryKey }> {
  const email = normalizeEmail(args.email);
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "errEmail" };
  if (!isStaffRole(args.role)) return { ok: false, error: "errRequired" };
  const existing = await db.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  if (existing.length) return { ok: false, error: "errEmailTaken" };
  const token = randomBytes(24).toString("base64url");
  await db.query(
    `WITH revoked AS (
       UPDATE staff_invitations SET revoked_at = now()
        WHERE email = $1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id
     ), ins AS (
       INSERT INTO staff_invitations (email, role, token_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, now() + make_interval(days => $5)) RETURNING id
     )
     INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json)
     SELECT $4, 'staff_invitation.create', 'staff_invitations', (SELECT id FROM ins),
            jsonb_build_object('email', $1::text, 'role', $2::text)`,
    [email, args.role, hashToken(token), args.invitedBy, INVITE_DAYS],
  );
  return { ok: true, token };
}

/** A pending, unexpired, unrevoked invitation for this token — or null. */
export async function getInvitation(db: Db, token: string): Promise<Invitation | null> {
  if (!token || token.length > 100) return null;
  const rows = await db.query<{ id: string; email: string; role: StaffRole; created_at: Date; expires_at: Date }>(
    `SELECT id, email::text AS email, role, created_at, expires_at FROM staff_invitations
      WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()`,
    [hashToken(token)],
  );
  const r = rows[0];
  return r ? { id: r.id, email: r.email, role: r.role, createdAt: new Date(r.created_at), expiresAt: new Date(r.expires_at) } : null;
}

export interface StaffSignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  invite: string;
}

/**
 * Creates a staff account from a valid invitation (role from the invite, email
 * must match), or — without an invitation — an admin account for an email
 * listed in ADMIN_EMAILS. No customer role, profile, or suite is created.
 */
export async function createStaffAccount(
  db: Db,
  input: StaffSignupInput,
  adminEmails = process.env.ADMIN_EMAILS ?? "",
): Promise<{ ok: true; userId: string; role: StaffRole } | { ok: false; error: DictionaryKey }> {
  const email = normalizeEmail(input.email);
  if (!input.name.trim() || !input.phone.trim()) return { ok: false, error: "errRequired" };
  if (input.name.length > 120 || input.phone.length > 40) return { ok: false, error: "errRequired" };
  if (!EMAIL.test(email)) return { ok: false, error: "errEmail" };
  if (input.password.length < MIN_PASSWORD || input.password.length > 200) return { ok: false, error: "errPassword" };

  let role: StaffRole;
  let inviteId: string | null = null;
  if (input.invite) {
    const invite = await getInvitation(db, input.invite);
    if (!invite) return { ok: false, error: "errInviteInvalid" };
    if (normalizeEmail(invite.email) !== email) return { ok: false, error: "errInviteEmail" };
    role = invite.role;
    inviteId = invite.id;
  } else {
    const approved = adminEmails.split(",").map(normalizeEmail).filter(Boolean);
    if (!approved.includes(email)) return { ok: false, error: "errInviteRequired" };
    role = "admin";
  }

  const passwordHash = await hashPassword(input.password);
  try {
    const rows = await db.query<{ id: string }>(
      `WITH u AS (
         INSERT INTO users (email, password_hash, display_name, phone) VALUES ($1, $2, $3, $4) RETURNING id
       ), r AS (
         INSERT INTO roles (user_id, role) SELECT id, $5 FROM u
       ), inv AS (
         UPDATE staff_invitations SET accepted_at = now(), accepted_user_id = (SELECT id FROM u)
          WHERE id = $6::uuid AND accepted_at IS NULL RETURNING id
       ), log AS (
         INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json)
         SELECT id, CASE WHEN $6::uuid IS NULL THEN 'staff.bootstrap_admin' ELSE 'staff_invitation.accept' END,
                'users', id, jsonb_build_object('role', $5::text) FROM u
       )
       SELECT id FROM u`,
      [email, passwordHash, input.name.trim(), input.phone.trim(), role, inviteId],
    );
    return { ok: true, userId: rows[0].id, role };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "errEmailTaken" };
    throw error;
  }
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roles: string[];
  createdAt: Date;
}

export async function listTeam(db: Db): Promise<TeamMember[]> {
  const rows = await db.query<{ id: string; display_name: string; email: string; phone: string | null; roles: string[]; created_at: Date }>(
    `SELECT u.id, u.display_name, u.email::text AS email, u.phone, u.created_at, array_agg(r.role ORDER BY r.role) AS roles
       FROM users u JOIN roles r ON r.user_id = u.id
      WHERE u.id IN (SELECT user_id FROM roles WHERE role IN ('admin', 'staff'))
      GROUP BY u.id ORDER BY u.created_at`,
  );
  return rows.map((r) => ({ id: r.id, name: r.display_name, email: r.email, phone: r.phone, roles: r.roles, createdAt: new Date(r.created_at) }));
}

export async function listPendingInvitations(db: Db): Promise<Invitation[]> {
  const rows = await db.query<{ id: string; email: string; role: StaffRole; created_at: Date; expires_at: Date }>(
    `SELECT id, email::text AS email, role, created_at, expires_at FROM staff_invitations
      WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC`,
  );
  return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, createdAt: new Date(r.created_at), expiresAt: new Date(r.expires_at) }));
}

export async function revokeInvitation(db: Db, id: string, adminId: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await db.query(
    `WITH upd AS (
       UPDATE staff_invitations SET revoked_at = now() WHERE id = $1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id, email
     )
     INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json)
     SELECT $2, 'staff_invitation.revoke', 'staff_invitations', id, jsonb_build_object('email', email::text) FROM upd`,
    [id, adminId],
  );
}

export type AccessLevel = StaffRole | "none";

/**
 * Change a team member's access level (admin -> staff, staff -> admin, or
 * remove staff access). Admins can't change their own level, so the team
 * can never lose its last admin by accident. Their sessions are ended so
 * the new level applies at once. Audit-logged.
 */
export async function setAccessLevel(
  db: Db,
  args: { userId: string; level: string; adminId: string },
): Promise<{ ok: true } | { ok: false; error: "self" | "invalid" }> {
  if (args.userId === args.adminId) return { ok: false, error: "self" };
  if (!/^[0-9a-f-]{36}$/i.test(args.userId)) return { ok: false, error: "invalid" };
  if (!(isStaffRole(args.level) || args.level === "none")) return { ok: false, error: "invalid" };
  const level = args.level as AccessLevel;
  const rows = await db.query<{ id: string }>(
    `WITH member AS (
       SELECT user_id AS id FROM roles WHERE user_id = $1 AND role IN ('admin', 'staff') LIMIT 1
     ), before AS (
       SELECT COALESCE(string_agg(role, ',' ORDER BY role), '') AS roles FROM roles
        WHERE user_id = $1 AND role IN ('admin', 'staff')
     ), del AS (
       DELETE FROM roles WHERE user_id IN (SELECT id FROM member) AND role IN ('admin', 'staff') AND role <> $2
     ), ins AS (
       INSERT INTO roles (user_id, role) SELECT id, $2 FROM member
        WHERE $2 <> 'none' AND NOT EXISTS (SELECT 1 FROM roles WHERE user_id = $1 AND role = $2)
     ), kill AS (
       DELETE FROM sessions WHERE user_id IN (SELECT id FROM member)
     ), log AS (
       INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, before_json, after_json)
       SELECT $3, 'staff.access_level', 'users', id,
              jsonb_build_object('roles', (SELECT roles FROM before)), jsonb_build_object('level', $2::text)
         FROM member
     )
     SELECT id FROM member`,
    [args.userId, level, args.adminId],
  );
  return rows.length ? { ok: true } : { ok: false, error: "invalid" };
}
