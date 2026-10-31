/**
 * Staff accounts: invitations, ADMIN_EMAILS bootstrap, access levels —
 * against real Postgres (PGlite) with every migration applied.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createSession, getSessionUser } from "../src/lib/auth/accounts";
import {
  createInvitation,
  createStaffAccount,
  getInvitation,
  listPendingInvitations,
  listTeam,
  revokeInvitation,
  setAccessLevel,
} from "../src/lib/auth/staff";
import { pgliteDb, type Db } from "../src/lib/db/index";
import { loadMigrations, migrate } from "../src/lib/db/migrate";

let db: Db;
let founderId: string;

const person = (email: string, invite = "") => ({ name: "Team Member", email, phone: "+509 3000 0001", password: "a long staff password", invite });

beforeAll(async () => {
  const pg = new PGlite({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await pg.exec(sql)), rows: async <T,>(sql: string) => (await pg.query<T>(sql)).rows },
    loadMigrations(join(__dirname, "..", "db", "migrations")),
  );
  db = pgliteDb(pg);
}, 60_000);

const roles = async (userId: string) =>
  (await db.query<{ role: string }>(`SELECT role FROM roles WHERE user_id = $1 ORDER BY role`, [userId])).map((r) => r.role);

describe("staff sign-up", () => {
  it("refuses sign-up without an invitation unless the email is in ADMIN_EMAILS", async () => {
    expect(await createStaffAccount(db, person("stranger@example.test"), "founder@example.test")).toEqual({ ok: false, error: "errInviteRequired" });
  });

  it("bootstraps the first admin from ADMIN_EMAILS, with no customer profile or suite", async () => {
    const result = await createStaffAccount(db, person("Founder@Example.test"), " founder@example.test , other@example.test");
    expect(result).toMatchObject({ ok: true, role: "admin" });
    if (!result.ok) return;
    founderId = result.userId;
    expect(await roles(founderId)).toEqual(["admin"]);
    expect((await db.query(`SELECT 1 FROM customer_profiles WHERE user_id = $1`, [founderId])).length).toBe(0);
    expect((await db.query(`SELECT 1 FROM audit_log WHERE action = 'staff.bootstrap_admin' AND entity_id = $1`, [founderId])).length).toBe(1);
  });

  it("accepts an invitation once, with the role from the invite and the invited email only", async () => {
    const inv = await createInvitation(db, { email: "agent@example.test", role: "staff", invitedBy: founderId });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    expect(await getInvitation(db, inv.token)).toMatchObject({ email: "agent@example.test", role: "staff" });
    expect((await listPendingInvitations(db)).map((i) => i.email)).toContain("agent@example.test");

    expect(await createStaffAccount(db, person("someone-else@example.test", inv.token), "")).toEqual({ ok: false, error: "errInviteEmail" });
    const ok = await createStaffAccount(db, person("AGENT@example.test", inv.token), "");
    expect(ok).toMatchObject({ ok: true, role: "staff" });
    expect(await getInvitation(db, inv.token)).toBeNull();
    expect(await createStaffAccount(db, person("agent2@example.test", inv.token), "")).toEqual({ ok: false, error: "errInviteInvalid" });
  });

  it("rejects revoked, expired, superseded, and unknown invitations", async () => {
    const a = await createInvitation(db, { email: "late@example.test", role: "admin", invitedBy: founderId });
    const b = await createInvitation(db, { email: "late@example.test", role: "staff", invitedBy: founderId });
    if (!a.ok || !b.ok) throw new Error("setup");
    expect(await getInvitation(db, a.token)).toBeNull(); // superseded by the newer invite
    await revokeInvitation(db, (await getInvitation(db, b.token))!.id, founderId);
    expect(await getInvitation(db, b.token)).toBeNull();

    const c = await createInvitation(db, { email: "expired@example.test", role: "staff", invitedBy: founderId });
    if (!c.ok) throw new Error("setup");
    await db.query(`UPDATE staff_invitations SET expires_at = now() - interval '1 minute' WHERE email = 'expired@example.test'`);
    expect(await createStaffAccount(db, person("expired@example.test", c.token), "")).toEqual({ ok: false, error: "errInviteInvalid" });
    expect(await getInvitation(db, "not-a-real-token")).toBeNull();
  });

  it("won't invite an existing account or an invalid role", async () => {
    expect(await createInvitation(db, { email: "founder@example.test", role: "staff", invitedBy: founderId })).toEqual({ ok: false, error: "errEmailTaken" });
    expect(await createInvitation(db, { email: "x@example.test", role: "customer", invitedBy: founderId })).toEqual({ ok: false, error: "errRequired" });
  });
});

describe("access levels", () => {
  it("lists the team and changes a member's level, ending their sessions", async () => {
    const team = await listTeam(db);
    const agent = team.find((m) => m.email === "agent@example.test")!;
    expect(agent.roles).toEqual(["staff"]);
    const token = await createSession(db, agent.id);

    expect(await setAccessLevel(db, { userId: agent.id, level: "admin", adminId: founderId })).toEqual({ ok: true });
    expect(await roles(agent.id)).toEqual(["admin"]);
    expect(await getSessionUser(db, token)).toBeNull();

    expect(await setAccessLevel(db, { userId: agent.id, level: "admin", adminId: founderId })).toEqual({ ok: true });
    expect(await roles(agent.id)).toEqual(["admin"]);

    expect(await setAccessLevel(db, { userId: agent.id, level: "none", adminId: founderId })).toEqual({ ok: true });
    expect(await roles(agent.id)).toEqual([]);
    expect((await listTeam(db)).some((m) => m.id === agent.id)).toBe(false);
  });

  it("refuses changing your own level, non-members, and unknown levels", async () => {
    expect(await setAccessLevel(db, { userId: founderId, level: "staff", adminId: founderId })).toEqual({ ok: false, error: "self" });
    expect(await setAccessLevel(db, { userId: "00000000-0000-0000-0000-000000000000", level: "staff", adminId: founderId })).toEqual({ ok: false, error: "invalid" });
    const other = (await listTeam(db))[0];
    expect(await setAccessLevel(db, { userId: other.id, level: "producer", adminId: "11111111-1111-1111-1111-111111111111" })).toEqual({ ok: false, error: "invalid" });
  });
});
