/**
 * Runs the app's own data code through the PRODUCTION driver (postgres.js
 * via getDb and DATABASE_URL), against Postgres served over the wire by
 * PGlite. Catches driver differences the direct-PGlite tests can't — e.g.
 * jsonb parameters being JSON-encoded twice.
 */
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCustomer, createSession, getSessionUser, verifyCredentials } from "../src/lib/auth/accounts";
import { getDb, type Db } from "../src/lib/db/index";
import { loadMigrations, migrate } from "../src/lib/db/migrate";
import { createOrder, getOrder, setOrderOtp } from "../src/lib/orders/index";
import { getDoorDelivery, setDoorDelivery } from "../src/lib/settings/index";

const PORT = 54000 + Math.floor(Math.random() * 900);
let server: PGLiteSocketServer;
let db: Db;

beforeAll(async () => {
  const pg = await PGlite.create({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await pg.exec(sql)), rows: async <T,>(sql: string) => (await pg.query<T>(sql)).rows },
    loadMigrations(join(__dirname, "..", "db", "migrations")),
  );
  server = new PGLiteSocketServer({ db: pg, port: PORT, host: "127.0.0.1" });
  await server.start();
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;
  process.env.DB_POOL_MAX = "1";
  db = await getDb();
}, 60_000);

afterAll(async () => {
  await server?.stop();
});

describe("through postgres.js (production driver)", () => {
  it("round-trips the door-to-door switch as a real jsonb object", async () => {
    const created = await createCustomer(db, {
      name: "Admin Person",
      email: "admin@example.test",
      phone: "+1 305 555 0100",
      password: "long enough password",
      locale: "en",
      department: "HT-OU",
      city: "Port-au-Prince",
      neighborhood: "",
      directions: "",
      haitiPhone: "",
    });
    if (!created.ok) throw new Error("signup failed");

    await setDoorDelivery(db, { locked: true, reason: "Roads closed", adminId: created.userId });
    expect(await getDoorDelivery(db)).toMatchObject({ locked: true, reason: "Roads closed", updatedBy: "Admin Person" });
    const raw = await db.query<{ kind: string }>(`SELECT jsonb_typeof(value) AS kind FROM app_settings WHERE key = 'door_delivery'`);
    expect(raw[0].kind).toBe("object");
    const log = await db.query<{ action: string }>(`SELECT action FROM audit_log ORDER BY created_at DESC LIMIT 1`);
    expect(log[0].action).toBe("door_delivery.lock");

    await setDoorDelivery(db, { locked: false, reason: null, adminId: created.userId });
    expect((await getDoorDelivery(db)).locked).toBe(false);
  });

  it("signs in, keeps sessions, and stores orders and codes", async () => {
    const userId = (await verifyCredentials(db, "ADMIN@example.test", "long enough password"))!;
    expect(userId).toBeTruthy();
    const token = await createSession(db, userId);
    expect((await getSessionUser(db, token))?.roles).toEqual(["customer"]);

    const order = await createOrder(db, userId, {
      warehouse: "YUL",
      store: "Amazon",
      orderNumber: "",
      trackingNumber: "TBA1",
      description: "Shoes",
      value: "59.90",
    });
    if (!order.ok) throw new Error("order failed");
    expect(await setOrderOtp(db, userId, order.id, "654321")).toEqual({ ok: true });
    expect(await getOrder(db, userId, order.id)).toMatchObject({ declaredValueMinor: 5990n, deliveryOtp: "654321" });
  });
});
