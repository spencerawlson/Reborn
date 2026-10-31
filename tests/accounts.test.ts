/**
 * Customer accounts, sessions, admin role, and the door-to-door switch,
 * against real Postgres (PGlite) with every migration applied.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  clearAttempts,
  createCustomer,
  createSession,
  deleteSession,
  getAccount,
  getSessionUser,
  recordFailedAttempt,
  syncAdminRole,
  tooManyAttempts,
  validateSignup,
  verifyCredentials,
  type SignupInput,
} from "../src/lib/auth/accounts";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { pgliteDb, type Db } from "../src/lib/db/index";
import { loadMigrations, migrate } from "../src/lib/db/migrate";
import { getDoorDelivery, setDoorDelivery } from "../src/lib/settings/index";

let db: Db;

const marie: SignupInput = {
  name: "Marie Joseph",
  email: "Marie@Example.test",
  phone: "+1 514 555 0100",
  password: "correct horse battery",
  locale: "ht",
  department: "HT-OU",
  city: "Delmas",
  neighborhood: "Delmas 33",
  directions: "Near the blue church, second gate",
  haitiPhone: "+509 3000 0000",
};

beforeAll(async () => {
  const pg = new PGlite({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await pg.exec(sql)), rows: async <T,>(sql: string) => (await pg.query<T>(sql)).rows },
    loadMigrations(join(__dirname, "..", "db", "migrations")),
  );
  db = pgliteDb(pg);
}, 60_000);

describe("passwords", () => {
  it("hashes with a salt and verifies", async () => {
    const a = await hashPassword("s3cret-enough!");
    const b = await hashPassword("s3cret-enough!");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("s3cret-enough!", a)).toBe(true);
    expect(await verifyPassword("wrong", a)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });
});

describe("sign-up", () => {
  it("validates required fields, email, password length, and department", () => {
    expect(validateSignup(marie)).toBeNull();
    expect(validateSignup({ ...marie, city: " " })).toBe("errRequired");
    expect(validateSignup({ ...marie, email: "nope" })).toBe("errEmail");
    expect(validateSignup({ ...marie, password: "short" })).toBe("errPassword");
    expect(validateSignup({ ...marie, department: "HT-XX" })).toBe("errRequired");
  });

  it("creates the customer with a Haiti address and a personal suite", async () => {
    const result = await createCustomer(db, marie);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.suiteCode).toMatch(/^SIA-1\d{4}$/);

    const second = await createCustomer(db, { ...marie, email: "jean@example.test" });
    expect(second.ok && second.suiteCode).not.toBe(result.suiteCode);
  });

  it("refuses a second account with the same email, in any letter case", async () => {
    const again = await createCustomer(db, { ...marie, email: "MARIE@example.TEST" });
    expect(again).toEqual({ ok: false, error: "errEmailTaken" });
  });
});

describe("sign-in and sessions", () => {
  it("verifies credentials case-insensitively on email, and rejects wrong passwords", async () => {
    expect(await verifyCredentials(db, "marie@example.test", "correct horse battery")).toBeTruthy();
    expect(await verifyCredentials(db, "marie@example.test", "wrong password!!")).toBeNull();
    expect(await verifyCredentials(db, "nobody@example.test", "correct horse battery")).toBeNull();
  });

  it("creates, reads, and deletes sessions; stores only the token hash", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    const token = await createSession(db, userId);
    const stored = await db.query<{ token_hash: string }>(`SELECT token_hash FROM sessions WHERE user_id = $1`, [userId]);
    expect(stored.map((s) => s.token_hash)).not.toContain(token);

    const user = await getSessionUser(db, token);
    expect(user).toMatchObject({ email: "marie@example.test", displayName: "Marie Joseph", locale: "ht", roles: ["customer"] });

    const account = await getAccount(db, user!);
    expect(account.haiti).toMatchObject({ department: "HT-OU", city: "Delmas", neighborhood: "Delmas 33" });
    expect(account.suiteCode).toMatch(/^SIA-/);

    await deleteSession(db, token);
    expect(await getSessionUser(db, token)).toBeNull();
    expect(await getSessionUser(db, "not-a-real-token")).toBeNull();
  });

  it("ignores expired sessions", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    const token = await createSession(db, userId);
    await db.query(`UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE user_id = $1`, [userId]);
    expect(await getSessionUser(db, token)).toBeNull();
  });

  it("slows down repeated failed sign-ins", () => {
    const key = "x@example.test|1.2.3.4";
    clearAttempts(key);
    for (let i = 0; i < 8; i++) recordFailedAttempt(key);
    expect(tooManyAttempts(key)).toBe(true);
    expect(tooManyAttempts(key, Date.now() + 16 * 60 * 1000)).toBe(false);
    clearAttempts(key);
    expect(tooManyAttempts(key)).toBe(false);
  });
});

describe("admin role", () => {
  it("is granted only to emails listed in ADMIN_EMAILS", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    await syncAdminRole(db, userId, "marie@example.test", "boss@example.test");
    let token = await createSession(db, userId);
    expect((await getSessionUser(db, token))!.roles).not.toContain("admin");

    await syncAdminRole(db, userId, "Marie@Example.test", "boss@example.test, marie@example.test");
    await syncAdminRole(db, userId, "marie@example.test", "marie@example.test"); // idempotent
    token = await createSession(db, userId);
    expect((await getSessionUser(db, token))!.roles.sort()).toEqual(["admin", "customer"]);
  });
});

describe("door-to-door switch", () => {
  it("starts open, locks and unlocks, and writes the audit log", async () => {
    expect((await getDoorDelivery(db)).locked).toBe(false);
    const adminId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;

    await setDoorDelivery(db, { locked: true, reason: "Roads closed near Croix-des-Bouquets", adminId });
    const locked = await getDoorDelivery(db);
    expect(locked).toMatchObject({ locked: true, reason: "Roads closed near Croix-des-Bouquets", updatedBy: "Marie Joseph" });

    await setDoorDelivery(db, { locked: false, reason: "", adminId });
    expect(await getDoorDelivery(db)).toMatchObject({ locked: false, reason: null });

    const log = await db.query<{ action: string; actor_user_id: string }>(
      `SELECT action, actor_user_id FROM audit_log WHERE entity_type = 'app_settings' ORDER BY created_at, action`,
    );
    expect(log.map((l) => l.action).sort()).toEqual(["door_delivery.lock", "door_delivery.unlock"]);
    expect(log.every((l) => l.actor_user_id === adminId)).toBe(true);
  });
});
