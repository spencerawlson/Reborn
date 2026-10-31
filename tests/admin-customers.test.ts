/**
 * Admin customer directory, package labels, and barcodes — against real
 * Postgres (PGlite) with every migration applied.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import { getCustomer, getPackageLabel, listCustomers } from "../src/lib/admin/customers";
import { createCustomer, type SignupInput } from "../src/lib/auth/accounts";
import { pgliteDb, type Db } from "../src/lib/db/index";
import { loadMigrations, migrate } from "../src/lib/db/migrate";
import { createOrder, listOrders } from "../src/lib/orders/index";
import { code128Svg, qrSvg } from "../src/lib/shipping/barcode";

let db: Db;
let marie: string;

const person = (email: string, name: string, department: string, city: string): SignupInput => ({
  name,
  email,
  phone: "+1 514 555 0100",
  password: "long enough password",
  locale: "fr",
  department,
  city,
  neighborhood: "Carénage",
  directions: "Blue gate next to the pharmacy",
  haitiPhone: "+509 3700 0000",
});

beforeAll(async () => {
  const pg = new PGlite({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await pg.exec(sql)), rows: async <T,>(sql: string) => (await pg.query<T>(sql)).rows },
    loadMigrations(join(__dirname, "..", "db", "migrations")),
  );
  db = pgliteDb(pg);
  const a = await createCustomer(db, person("marie@example.test", "Marie Joseph", "HT-ND", "Cap-Haïtien"));
  const b = await createCustomer(db, person("jean@example.test", "Jean Pierre", "HT-SE", "Jacmel"));
  if (!a.ok || !b.ok) throw new Error("setup failed");
  marie = a.userId;
}, 60_000);

describe("customer directory", () => {
  it("lists every customer with their Haiti address", async () => {
    const all = await listCustomers(db);
    expect(all.map((c) => c.name).sort()).toEqual(["Jean Pierre", "Marie Joseph"]);
    const m = all.find((c) => c.name === "Marie Joseph")!;
    expect(m).toMatchObject({ department: "HT-ND", city: "Cap-Haïtien", directions: "Blue gate next to the pharmacy", haitiPhone: "+509 3700 0000" });
  });

  it("searches by name, city, or suite, and treats % and _ literally", async () => {
    expect((await listCustomers(db, "jacmel")).map((c) => c.name)).toEqual(["Jean Pierre"]);
    const suite = (await getCustomer(db, marie))!.suiteCode!;
    expect((await listCustomers(db, suite)).map((c) => c.name)).toEqual(["Marie Joseph"]);
    expect(await listCustomers(db, "%")).toEqual([]);
    expect(await getCustomer(db, "not-a-uuid")).toBeNull();
  });
});

describe("package labels", () => {
  it("assigns each package a unique tracking code and builds its label", async () => {
    const one = await createOrder(db, marie, { warehouse: "MIA", store: "Amazon", orderNumber: "112-1", trackingNumber: "TBA1", description: "Shoes", value: "40" });
    const two = await createOrder(db, marie, { warehouse: "YUL", store: "Amazon", orderNumber: "", trackingNumber: "", description: "", value: "" });
    if (!one.ok || !two.ok) throw new Error("orders failed");
    const codes = (await listOrders(db, marie)).map((o) => o.trackingCode);
    expect(codes.every((c) => /^SIA-T\d{8}$/.test(c))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);

    const label = (await getPackageLabel(db, one.id))!;
    expect(label).toMatchObject({ warehouse: "MIA", destinationHub: "CAP", store: "Amazon", orderNumber: "112-1", description: "Shoes", declaredValueMinor: 4000n });
    expect(label.customer).toMatchObject({ name: "Marie Joseph", city: "Cap-Haïtien" });
    expect((await getPackageLabel(db, two.id))!.description).toBeNull();
    expect(await getPackageLabel(db, "nope")).toBeNull();
  });
});

describe("barcodes", () => {
  it("renders Code 128 and QR as SVG, and refuses unexpected text", () => {
    expect(code128Svg("SIA-T00000001")).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(qrSvg("SIA-T00000001")).toMatch(/^<svg/);
    expect(() => code128Svg("<script>")).toThrow();
    expect(() => qrSvg("")).toThrow();
  });
});
