/**
 * Migration runner. Applies db/migrations/NNNN_name.sql in order, each in
 * its own transaction, and records it in schema_migrations with a checksum.
 *
 * - Already-applied migrations are skipped; an applied migration whose file
 *   has since changed is an error (write a new migration instead).
 * - An advisory lock stops two runners from migrating at once.
 * - Line endings are normalized before hashing, so a CRLF checkout on
 *   Windows and an LF checkout in CI agree.
 *
 * Driver-agnostic: works with postgres.js (scripts/migrate.mts) and PGlite
 * (tests) through the small MigrationConnection interface.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface MigrationConnection {
  /** Run one or more statements with no parameters. */
  exec(sql: string): Promise<void>;
  /** Run one query with no parameters and return its rows. */
  rows<T>(sql: string): Promise<T[]>;
}

export interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

export interface MigrateResult {
  applied: string[];
  alreadyApplied: number;
}

const NAME_PATTERN = /^\d{4}_[a-z0-9_]+\.sql$/;
// Arbitrary constant shared by every runner of this app's migrations.
const LOCK_KEY = 72_509_001;

export function checksum(sql: string): string {
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
}

export function loadMigrations(dir: string): Migration[] {
  const names = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const seen = new Set<string>();
  return names.map((name) => {
    if (!NAME_PATTERN.test(name)) {
      throw new Error(`migration file name must look like 0001_name.sql: ${name}`);
    }
    const prefix = name.slice(0, 4);
    if (seen.has(prefix)) throw new Error(`two migrations share the number ${prefix}`);
    seen.add(prefix);
    const sql = readFileSync(join(dir, name), "utf8");
    return { name, sql, checksum: checksum(sql) };
  });
}

export async function migrate(
  conn: MigrationConnection,
  migrations: Migration[],
): Promise<MigrateResult> {
  await conn.exec(`SELECT pg_advisory_lock(${LOCK_KEY})`);
  try {
    const tracked = await conn.rows<{ exists: boolean }>(
      "SELECT to_regclass('schema_migrations') IS NOT NULL AS exists",
    );
    if (!tracked[0].exists) {
      const untracked = await conn.rows<{ exists: boolean }>(
        "SELECT to_regclass('users') IS NOT NULL AS exists",
      );
      if (untracked[0].exists) {
        throw new Error(
          "this database has tables but no schema_migrations; it was migrated by hand. " +
            "Recreate it, or insert the applied migrations into schema_migrations first.",
        );
      }
      await conn.exec(`
        CREATE TABLE schema_migrations (
          name TEXT PRIMARY KEY,
          checksum CHAR(64) NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`);
    }

    const done = new Map(
      (await conn.rows<{ name: string; checksum: string }>(
        "SELECT name, checksum FROM schema_migrations",
      )).map((row) => [row.name, row.checksum]),
    );
    for (const name of done.keys()) {
      if (!migrations.some((m) => m.name === name)) {
        throw new Error(`database has migration ${name}, which is missing from disk`);
      }
    }

    const applied: string[] = [];
    for (const migration of migrations) {
      const recorded = done.get(migration.name);
      if (recorded !== undefined) {
        if (recorded !== migration.checksum) {
          throw new Error(
            `${migration.name} changed after it was applied; write a new migration instead`,
          );
        }
        continue;
      }
      if (applied.length === 0 && done.size > 0) {
        const latest = [...done.keys()].sort().at(-1)!;
        if (migration.name < latest) {
          throw new Error(`${migration.name} is older than applied ${latest}; renumber it`);
        }
      }
      try {
        // Names and checksums are validated above, so inlining them is safe.
        await conn.exec(
          `BEGIN;\n${migration.sql}\n;\n` +
            `INSERT INTO schema_migrations (name, checksum) ` +
            `VALUES ('${migration.name}', '${migration.checksum}');\nCOMMIT;`,
        );
      } catch (error) {
        await conn.exec("ROLLBACK").catch(() => undefined);
        throw new Error(`${migration.name} failed: ${(error as Error).message}`, { cause: error });
      }
      applied.push(migration.name);
    }
    return { applied, alreadyApplied: done.size };
  } finally {
    await conn.exec(`SELECT pg_advisory_unlock(${LOCK_KEY})`).catch(() => undefined);
  }
}
