import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { describe, expect, it } from "vitest";
import {
  checksum,
  loadMigrations,
  migrate,
  type Migration,
  type MigrationConnection,
} from "../src/lib/db/migrate";

const MIGRATIONS = join(__dirname, "..", "db", "migrations");

async function fresh(): Promise<{ db: PGlite; conn: MigrationConnection }> {
  const db = new PGlite({ extensions: { citext, pgcrypto } });
  const conn: MigrationConnection = {
    exec: async (sql) => void (await db.exec(sql)),
    rows: async <T,>(sql: string) => (await db.query<T>(sql)).rows,
  };
  return { db, conn };
}

function fake(name: string, sql: string): Migration {
  return { name, sql, checksum: checksum(sql) };
}

describe("migration runner", () => {
  it("applies every migration once, then is a no-op", async () => {
    const { conn } = await fresh();
    const migrations = loadMigrations(MIGRATIONS);
    const first = await migrate(conn, migrations);
    expect(first.applied).toEqual(migrations.map((m) => m.name));
    const second = await migrate(conn, migrations);
    expect(second).toEqual({ applied: [], alreadyApplied: migrations.length });
  }, 60_000);

  it("refuses a migration that changed after it was applied", async () => {
    const { conn } = await fresh();
    await migrate(conn, [fake("0001_a.sql", "CREATE TABLE a (id INT)")]);
    await expect(
      migrate(conn, [fake("0001_a.sql", "CREATE TABLE a (id BIGINT)")]),
    ).rejects.toThrow("changed after it was applied");
  });

  it("treats CRLF and LF copies of a file as the same migration", () => {
    expect(checksum("SELECT 1;\r\nSELECT 2;\r\n")).toBe(checksum("SELECT 1;\nSELECT 2;\n"));
  });

  it("refuses when an applied migration is missing from disk", async () => {
    const { conn } = await fresh();
    await migrate(conn, [fake("0001_a.sql", "CREATE TABLE a (id INT)")]);
    await expect(migrate(conn, [])).rejects.toThrow("missing from disk");
  });

  it("refuses a new migration numbered below one already applied", async () => {
    const { conn } = await fresh();
    await migrate(conn, [fake("0002_b.sql", "CREATE TABLE b (id INT)")]);
    await expect(
      migrate(conn, [fake("0001_a.sql", "CREATE TABLE a (id INT)"), fake("0002_b.sql", "CREATE TABLE b (id INT)")]),
    ).rejects.toThrow("renumber");
  });

  it("rolls back a failing migration completely", async () => {
    const { db, conn } = await fresh();
    await expect(
      migrate(conn, [fake("0001_bad.sql", "CREATE TABLE half (id INT);\nSELECT nonsense_function();")]),
    ).rejects.toThrow("0001_bad.sql failed");
    const half = await db.query<{ exists: boolean }>("SELECT to_regclass('half') IS NOT NULL AS exists");
    expect(half.rows[0].exists).toBe(false);
    const recorded = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM schema_migrations");
    expect(recorded.rows[0].n).toBe(0);
  });

  it("refuses a database that was migrated by hand", async () => {
    const { db, conn } = await fresh();
    await db.exec("CREATE TABLE users (id INT)");
    await expect(migrate(conn, loadMigrations(MIGRATIONS))).rejects.toThrow("migrated by hand");
  });

  it("rejects badly named or duplicate-numbered files", () => {
    expect(() => loadMigrations(join(__dirname, "fixtures", "bad-migrations"))).toThrow("0001_name.sql");
  });
});
