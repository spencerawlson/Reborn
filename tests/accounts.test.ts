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
  changePassword,
  updateProfile,
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
import {
  getDoorDelivery,
  getWarehouseAddresses,
  setDoorDelivery,
  setWarehouseAddresses,
  validateWarehouseAddress,
} from "../src/lib/settings/index";

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
    expect(validateSignup({ ...marie, department: "", city: "" })).toBeNull(); // no Haiti address: fine
    expect(validateSignup({ ...marie, department: "", city: "Delmas" })).toBe("errRequired"); // half address
    expect(validateSignup({ ...marie, department: "HT-OU", city: " " })).toBe("errRequired"); // half address
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

  it("creates a customer without a Haiti address, for the diaspora", async () => {
    const result = await createCustomer(db, {
      name: "Jean Diaspora",
      email: "diaspora@example.test",
      phone: "+1 514 555 0123",
      password: "correct horse battery",
      locale: "en",
      department: "",
      city: "",
      neighborhood: "",
      directions: "",
      haitiPhone: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const token = await createSession(db, result.userId);
    const account = await getAccount(db, (await getSessionUser(db, token))!);
    expect(account.haiti).toBeNull();
    expect(account.suiteCode).toMatch(/^SIA-/);
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

describe("editing one's own account", () => {
  it("updates name, phone, and Haiti address; validates input", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    const profile = {
      name: "Marie J. Joseph",
      phone: "+1 514 555 0199",
      department: "HT-SD",
      city: "Les Cayes",
      neighborhood: "",
      directions: "Behind the market",
      haitiPhone: "",
    };
    expect(await updateProfile(db, userId, { ...profile, department: "HT-XX" })).toBe("errRequired");
    expect(await updateProfile(db, userId, { ...profile, department: "" })).toBe("errRequired"); // city without department
    expect(await updateProfile(db, userId, { ...profile, name: " " })).toBe("errRequired");
    expect(await updateProfile(db, userId, profile)).toBeNull();

    const token = await createSession(db, userId);
    const account = await getAccount(db, (await getSessionUser(db, token))!);
    expect(account).toMatchObject({ displayName: "Marie J. Joseph", phone: "+1 514 555 0199", email: "marie@example.test" });
    expect(account.haiti).toMatchObject({ department: "HT-SD", city: "Les Cayes", neighborhood: null, directions: "Behind the market" });
    expect(account.suiteCode).toMatch(/^SIA-/); // unchanged
  });

  it("clears the Haiti address when both fields are emptied", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    expect(
      await updateProfile(db, userId, {
        name: "Marie J. Joseph",
        phone: "+1 514 555 0199",
        department: "",
        city: "",
        neighborhood: "",
        directions: "",
        haitiPhone: "",
      }),
    ).toBeNull();
    const token = await createSession(db, userId);
    const account = await getAccount(db, (await getSessionUser(db, token))!);
    expect(account.haiti).toBeNull();
  });

  it("changes the password only with the current one, and signs out other devices", async () => {
    const userId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    const here = await createSession(db, userId);
    const elsewhere = await createSession(db, userId);

    expect(await changePassword(db, userId, "wrong current pw", "a brand new password", here)).toBe("errCurrentPassword");
    expect(await changePassword(db, userId, "correct horse battery", "short", here)).toBe("errPassword");
    expect(await changePassword(db, userId, "correct horse battery", "a brand new password", here)).toBeNull();

    expect(await verifyCredentials(db, "marie@example.test", "correct horse battery")).toBeNull();
    expect(await verifyCredentials(db, "marie@example.test", "a brand new password")).toBe(userId);
    expect(await getSessionUser(db, here)).not.toBeNull();
    expect(await getSessionUser(db, elsewhere)).toBeNull();
    await changePassword(db, userId, "a brand new password", "correct horse battery", here); // restore for later tests
  });
});

describe("warehouse addresses (admin)", () => {
  it("validates, saves, reads back, and audit-logs", async () => {
    const adminId = (await verifyCredentials(db, "marie@example.test", "correct horse battery"))!;
    const miami = { street: "1234 NW 72nd Ave", city: "Miami", region: "FL", postalCode: "33126", country: "USA", phone: "" };
    expect(validateWarehouseAddress({ ...miami, street: " " })).toBe("street");
    expect(validateWarehouseAddress(miami)).toBeNull();

    expect(await getWarehouseAddresses(db)).toEqual({});
    await setWarehouseAddresses(db, { MIA: miami }, adminId);
    expect(await getWarehouseAddresses(db)).toEqual({ MIA: miami });
    const log = await db.query<{ action: string }>(`SELECT action FROM audit_log WHERE action = 'warehouse_addresses.update'`);
    expect(log.length).toBe(1);
  });
});
