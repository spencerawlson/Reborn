/**
 * Applies every migration to an in-process Postgres (PGlite) and checks
 * the database-level guards: balanced ledger groups, append-only ledger,
 * one current commission rate, order totals, FX on payouts.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";
import { loadMigrations, migrate } from "../src/lib/db/migrate";

const MIGRATIONS = join(__dirname, "..", "db", "migrations");

const CUSTOMER = "00000000-0000-0000-0000-000000000001";
const PRODUCER_USER = "00000000-0000-0000-0000-000000000002";
const PRODUCER = "00000000-0000-0000-0000-0000000000a1";
const STOREFRONT = "00000000-0000-0000-0000-0000000000b1";
const ORDER = "00000000-0000-0000-0000-0000000000c1";
const MONCASH = "00000000-0000-0000-0000-0000000000d1";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite({ extensions: { citext, pgcrypto } });
  await migrate(
    { exec: async (sql) => void (await db.exec(sql)), rows: async (sql) => (await db.query(sql)).rows as never },
    loadMigrations(MIGRATIONS),
  );
  await db.exec(`
    INSERT INTO users (id, email, password_hash, display_name) VALUES
      ('${CUSTOMER}', 'c@example.test', 'x', 'Customer'),
      ('${PRODUCER_USER}', 'p@example.test', 'x', 'Producer');
    INSERT INTO producer_profiles (id, user_id, business_name) VALUES ('${PRODUCER}', '${PRODUCER_USER}', 'Kafe');
    INSERT INTO storefronts (id, producer_id, slug, name) VALUES ('${STOREFRONT}', '${PRODUCER}', 'kafe', 'Kafe');
    INSERT INTO orders (id, customer_id, storefront_id, subtotal_minor, shipping_minor, tax_minor,
                        total_minor, commission_rate_bps, commission_minor)
      VALUES ('${ORDER}', '${CUSTOMER}', '${STOREFRONT}', 10000, 1500, 800, 12300, 1000, 1000);
    INSERT INTO moncash_accounts (id, producer_id, account_number, account_name, status)
      VALUES ('${MONCASH}', '${PRODUCER}', '50900000000', 'Kafe', 'verified');
  `);
}, 60_000);

function lines(group: string, rows: [string, number, number, string?][], producerId: string | null): string {
  return rows
    .map(([account, debit, credit, currency = "USD"]) => {
      const producer = account.startsWith("producer_") && producerId ? `'${producerId}'` : "NULL";
      return `('${group}', '${account}', ${debit}, ${credit}, '${currency}', '${ORDER}', ${producer}, 'test')`;
    })
    .join(", ");
}

async function postGroup(
  group: string,
  rows: [string, number, number, string?][],
  producerId: string | null = PRODUCER,
) {
  await db.exec(`
    BEGIN;
    INSERT INTO ledger_entries (entry_group, account, debit_minor, credit_minor, currency, order_id, producer_id, description)
      VALUES ${lines(group, rows, producerId)};
    COMMIT;
  `);
}

async function expectRejected(sql: string, message: RegExp) {
  await expect(db.exec(sql)).rejects.toThrow(message);
  await db.exec("ROLLBACK").catch(() => undefined);
}

describe("migrations", () => {
  it("keeps the 5% rate as history and makes 10% current", async () => {
    const { rows } = await db.query<{ rate_bps: number; current: boolean }>(
      "SELECT rate_bps, effective_to IS NULL AS current FROM commission_settings ORDER BY rate_bps",
    );
    expect(rows).toEqual([
      { rate_bps: 500, current: false },
      { rate_bps: 1000, current: true },
    ]);
    await expectRejected("INSERT INTO commission_settings (rate_bps) VALUES (700)", /uniq_commission_settings_current/);
  });

  it("commits a balanced ledger group", async () => {
    await postGroup("11111111-0000-0000-0000-000000000001", [
      ["cash", 12300, 0],
      ["producer_pending", 0, 9000],
      ["commission_revenue", 0, 1000],
      ["shipping_payable", 0, 1500],
      ["tax_payable", 0, 800],
    ]);
    const { rows } = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM ledger_entries");
    expect(rows[0].n).toBe(5);
  });

  it("rejects unbalanced and mixed-currency groups at commit", async () => {
    await expect(
      postGroup("22222222-0000-0000-0000-000000000001", [["cash", 100, 0], ["commission_revenue", 0, 99]]),
    ).rejects.toThrow(/unbalanced ledger group/);
    await db.exec("ROLLBACK").catch(() => undefined);
    await expect(
      postGroup("33333333-0000-0000-0000-000000000001", [["cash", 100, 0, "USD"], ["commission_revenue", 0, 100, "HTG"]]),
    ).rejects.toThrow(/mixes currencies/);
    await db.exec("ROLLBACK").catch(() => undefined);
    await expectRejected(
      `INSERT INTO ledger_entries (entry_group, account, debit_minor, credit_minor, description)
         VALUES (gen_random_uuid(), 'producer_payable', 1, 0, 'old account')`,
      /ledger_entries_account_check/,
    );
  });

  it("rejects producer lines that do not name a producer", async () => {
    await expect(
      postGroup(
        "44444444-0000-0000-0000-000000000001",
        [["producer_pending", 9000, 0], ["producer_available", 0, 9000]],
        null,
      ),
    ).rejects.toThrow(/ledger_entries_producer_line_check/);
    await db.exec("ROLLBACK").catch(() => undefined);
  });

  it("makes the ledger append-only", async () => {
    await expectRejected("UPDATE ledger_entries SET description = 'x'", /append-only/);
    await expectRejected("DELETE FROM ledger_entries", /append-only/);
    await expectRejected("TRUNCATE ledger_entries", /append-only/);
  });

  it("refuses to delete rows that financial history points at", async () => {
    await expectRejected(`DELETE FROM orders WHERE id = '${ORDER}'`, /ledger_entries_order_id_fkey/);
    await expectRejected(`DELETE FROM users WHERE id = '${PRODUCER_USER}'`, /producer_profiles_user_id_fkey/);
  });

  it("checks order totals and commission ranges", async () => {
    const insert = (total: number, rate: number, commission: number) => `
      INSERT INTO orders (customer_id, storefront_id, subtotal_minor, total_minor, commission_rate_bps, commission_minor)
        VALUES ('${CUSTOMER}', '${STOREFRONT}', 100, ${total}, ${rate}, ${commission})`;
    await expectRejected(insert(999, 1000, 10), /orders_total_check/);
    await expectRejected(insert(100, 20000, 10), /orders_commission_rate_check/);
    await expectRejected(insert(100, 1000, 101), /orders_commission_le_subtotal_check/);
  });

  it("requires an FX rate for payouts in another currency", async () => {
    const insert = (key: string, fx: string) => `
      INSERT INTO payouts (producer_id, moncash_account_id, amount_minor, payout_currency,
                           payout_amount_minor, fx_rate, idempotency_key)
        VALUES ('${PRODUCER}', '${MONCASH}', 9000, 'HTG', 1181250, ${fx}, '${key}')`;
    await expectRejected(insert("k1", "NULL"), /payouts_fx_check/);
    await db.exec(insert("k2", "131.25"));
  });

  it("bumps updated_at on update", async () => {
    const before = await db.query<{ t: Date }>("SELECT updated_at AS t FROM storefronts");
    await new Promise((r) => setTimeout(r, 20));
    await db.exec("UPDATE storefronts SET name = 'Kafe Lakay'");
    const after = await db.query<{ t: Date }>("SELECT updated_at AS t FROM storefronts");
    expect(after.rows[0].t.getTime()).toBeGreaterThan(before.rows[0].t.getTime());
  });
});
