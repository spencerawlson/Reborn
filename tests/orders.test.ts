/**
 * Incoming orders (pre-alerts) and delivery codes, against real Postgres
 * (PGlite) with every migration applied — including tenant isolation.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createCustomer, type SignupInput } from "../src/lib/auth/accounts";
import { pgliteDb, type Db } from "../src/lib/db/index";
import { loadMigrations, migrate } from "../src/lib/db/migrate";
import {
  createOrder,
  getOrder,
  listExpectedPackages,
  listHistoryPackages,
  listInProgressPackages,
  listOrderStatusHistory,
  listOrders,
  parseDollars,
  setOrderOtp,
  setOrderStatus,
  validateOrder,
} from "../src/lib/orders/index";

let db: Db;
let marie: string;
let jean: string;

const person = (email: string, name: string): SignupInput => ({
  name,
  email,
  phone: "+509 0000 0000",
  password: "long enough password",
  locale: "ht",
  department: "HT-ND",
  city: "Cap-Haïtien",
  neighborhood: "",
  directions: "",
  haitiPhone: "",
});

const order = { warehouse: "MIA", store: "Amazon", orderNumber: "112-0000000-0000000", trackingNumber: "TBA123", description: "Phone charger", value: "19.99" };

beforeAll(async () => {
  const pg = new PGlite({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await pg.exec(sql)), rows: async <T,>(sql: string) => (await pg.query<T>(sql)).rows },
    loadMigrations(join(__dirname, "..", "db", "migrations")),
  );
  db = pgliteDb(pg);
  const a = await createCustomer(db, person("marie@example.test", "Marie Joseph"));
  const b = await createCustomer(db, person("jean@example.test", "Jean Pierre"));
  if (!a.ok || !b.ok) throw new Error("setup failed");
  marie = a.userId;
  jean = b.userId;
}, 60_000);

describe("parseDollars", () => {
  it("parses dollars to cents without floats", () => {
    expect(parseDollars("19.99")).toBe(1999n);
    expect(parseDollars("5")).toBe(500n);
    expect(parseDollars("5.5")).toBe(550n);
    expect(parseDollars("")).toBeNull();
    expect(parseDollars("1e3")).toBeUndefined();
    expect(parseDollars("-1")).toBeUndefined();
    expect(parseDollars("1.999")).toBeUndefined();
  });
});

describe("incoming orders", () => {
  it("validates the warehouse, required fields, and value", () => {
    expect(validateOrder(order)).toBeNull();
    expect(validateOrder({ ...order, warehouse: "LAX" })).toBe("errRequired");
    expect(validateOrder({ ...order, description: "" })).toBeNull(); // optional (recommended)
    expect(validateOrder({ ...order, store: " " })).toBe("errRequired");
    expect(validateOrder({ ...order, value: "abc" })).toBe("errValue");
  });

  it("creates an order visible only to its owner", async () => {
    const created = await createOrder(db, marie, order);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const mine = await getOrder(db, marie, created.id);
    expect(mine).toMatchObject({ store: "Amazon", declaredValueMinor: 1999n, status: "expected", deliveryOtp: null });
    expect(await getOrder(db, jean, created.id)).toBeNull();
    expect(await getOrder(db, marie, "not-a-uuid")).toBeNull();
    expect((await listOrders(db, marie)).map((o) => o.id)).toContain(created.id);
    expect(await listOrders(db, jean)).toEqual([]);
  });
});

describe("prohibited items on orders", () => {
  it("blocks a declared prohibited item and says which category", async () => {
    expect(await createOrder(db, marie, { ...order, description: "Ammo and a rifle scope" })).toEqual({
      ok: false,
      error: "errProhibited",
      prohibited: "weapons",
    });
    expect(await createOrder(db, marie, { ...order, description: "Phone and glue gun" })).toMatchObject({ ok: true });
  });

  it("accepts an order with no description (it will be inspected)", async () => {
    const created = await createOrder(db, marie, { ...order, description: "" });
    expect(created.ok).toBe(true);
    if (created.ok) expect((await getOrder(db, marie, created.id))!.description).toBeNull();
  });
});

describe("delivery codes (OTP)", () => {
  it("lets the owner set, change, and clear the code; nobody else can", async () => {
    const created = await createOrder(db, marie, { ...order, trackingNumber: "TBA456" });
    if (!created.ok) throw new Error("create failed");

    expect(await setOrderOtp(db, marie, created.id, "482913")).toEqual({ ok: true });
    expect((await getOrder(db, marie, created.id))!.deliveryOtp).toBe("482913");

    expect(await setOrderOtp(db, jean, created.id, "000000")).toEqual({ ok: false, error: "errRequired" });
    expect((await getOrder(db, marie, created.id))!.deliveryOtp).toBe("482913");

    expect(await setOrderOtp(db, marie, created.id, "12")).toEqual({ ok: false, error: "orderOtpInvalid" });
    expect(await setOrderOtp(db, marie, created.id, "12 34; --")).toEqual({ ok: false, error: "orderOtpInvalid" });

    expect(await setOrderOtp(db, marie, created.id, "AB12CD")).toEqual({ ok: true });
    expect(await setOrderOtp(db, marie, created.id, "")).toEqual({ ok: true });
    expect((await getOrder(db, marie, created.id))!.deliveryOtp).toBeNull();
  });

  it("refuses changes once the package has been received", async () => {
    const created = await createOrder(db, marie, { ...order, trackingNumber: "TBA789" });
    if (!created.ok) throw new Error("create failed");
    await db.query(`UPDATE incoming_orders SET status = 'received', received_at = now() WHERE id = $1`, [created.id]);
    expect(await setOrderOtp(db, marie, created.id, "123456")).toEqual({ ok: false, error: "errRequired" });
  });

  it("shows staff every expected package with suite and code", async () => {
    const created = await createOrder(db, jean, { ...order, warehouse: "YUL", trackingNumber: "TBA999" });
    if (!created.ok) throw new Error("create failed");
    await setOrderOtp(db, jean, created.id, "777111");
    const expected = await listExpectedPackages(db);
    const row = expected.find((p) => p.id === created.id)!;
    expect(row).toMatchObject({ customerName: "Jean Pierre", warehouse: "YUL", deliveryOtp: "777111" });
    expect(row.suiteCode).toMatch(/^SIA-/);
    expect(expected.every((p) => p.status === "expected")).toBe(true);
  });

  it("the database itself rejects malformed codes", async () => {
    const created = await createOrder(db, marie, order);
    if (!created.ok) throw new Error("create failed");
    await expect(db.query(`UPDATE incoming_orders SET delivery_otp = 'x' WHERE id = $1`, [created.id])).rejects.toThrow();
  });
});

describe("status flow", () => {
  it("saves the per-order phone, moves only forward, records history, and lands delivered in History", async () => {
    const created = await createOrder(db, marie, { ...order, trackingNumber: "TBAFLOW", notifyPhone: "+509 1111 2222" });
    if (!created.ok) throw new Error("create failed");
    expect((await getOrder(db, marie, created.id))!.notifyPhone).toBe("+509 1111 2222");
    // Skipping a step is rejected.
    expect(await setOrderStatus(db, null, created.id, "shipped")).toEqual({ ok: false, error: "errRequired" });
    const noop = async () => ({ ok: true, status: 200 });
    expect(await setOrderStatus(db, null, created.id, "received", noop)).toEqual({ ok: true, status: "received" });
    expect((await listExpectedPackages(db)).map((p) => p.id)).not.toContain(created.id);
    expect((await listInProgressPackages(db)).map((p) => p.id)).toContain(created.id);
    expect(await setOrderStatus(db, null, created.id, "repackaging", noop)).toEqual({ ok: true, status: "repackaging" });
    expect(await setOrderStatus(db, null, created.id, "shipped", noop)).toEqual({ ok: true, status: "shipped" });
    // Delivered requires a signature: no manual delivered step.
    expect(await setOrderStatus(db, null, created.id, "delivered", noop)).toEqual({ ok: false, error: "errRequired" });
    expect(
      await setOrderStatus(db, null, created.id, "delivered", noop, { name: "Marie Joseph", data: "data:image/png;base64,abc" }),
    ).toEqual({ ok: true, status: "delivered" });
    expect((await getOrder(db, marie, created.id))!.deliverySignerName).toBe("Marie Joseph");
    expect((await listInProgressPackages(db)).map((p) => p.id)).not.toContain(created.id);
    expect((await listHistoryPackages(db)).map((p) => p.id)).toContain(created.id);
    expect((await listOrderStatusHistory(db, created.id)).map((h) => h.toStatus)).toEqual([
      "received",
      "repackaging",
      "shipped",
      "delivered",
    ]);
    // Delivered is terminal: no further step.
    expect(await setOrderStatus(db, null, created.id, "delivered", noop)).toEqual({ ok: false, error: "errRequired" });
  });

  it("sends the customer WhatsApp to the per-order phone on a status step", async () => {
    const created = await createOrder(db, marie, { ...order, trackingNumber: "TBAWHATS", notifyPhone: "+509 3333 4444" });
    if (!created.ok) throw new Error("create failed");
    const calls: { url: string; init: any }[] = [];
    const fake = async (url: string, init?: any) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    };
    const prev = { token: process.env.WHATSAPP_TOKEN, phone: process.env.WHATSAPP_PHONE_NUMBER_ID, tpl: process.env.WHATSAPP_CUSTOMER_TEMPLATE };
    process.env.WHATSAPP_TOKEN = "tok";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
    process.env.WHATSAPP_CUSTOMER_TEMPLATE = "order_update";
    try {
      expect(await setOrderStatus(db, null, created.id, "received", fake)).toEqual({ ok: true, status: "received" });
    } finally {
      if (prev.token === undefined) delete process.env.WHATSAPP_TOKEN; else process.env.WHATSAPP_TOKEN = prev.token;
      if (prev.phone === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID; else process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
      if (prev.tpl === undefined) delete process.env.WHATSAPP_CUSTOMER_TEMPLATE; else process.env.WHATSAPP_CUSTOMER_TEMPLATE = prev.tpl;
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/12345/messages");
    const body = JSON.parse(calls[0].init.body);
    expect(body.to).toBe("+50933334444");
    expect(body.template.name).toBe("order_update");
    expect(body.template.components[0].parameters.map((p: any) => p.text)).toEqual([
      "Marie Joseph",
      "Amazon",
      "Received",
      expect.stringMatching(/^SIA-/),
    ]);
  });
});
