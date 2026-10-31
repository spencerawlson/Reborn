/**
 * npm run dev — local development with a real database and nothing to
 * install:
 *   1. opens an embedded Postgres (PGlite) saved in .data/pglite,
 *   2. applies migrations,
 *   3. serves it on 127.0.0.1:54329 over the Postgres protocol,
 *   4. starts `next dev` with DATABASE_URL pointing at it.
 *
 * The app talks to it exactly as it will to production Postgres. Set
 * DATABASE_URL yourself to use another database (then this only runs Next).
 * PGlite runs here, not inside Next, because its WebAssembly memory breaks
 * Next's response streaming when they share a process.
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { loadMigrations, migrate } from "../src/lib/db/migrate.ts";

const ROOT = join(import.meta.dirname, "..");
const PORT = Number(process.env.DEV_DB_PORT ?? 54329);
const env = { ...process.env };
let server: PGLiteSocketServer | undefined;

if (!env.DATABASE_URL) {
  mkdirSync(join(ROOT, ".data"), { recursive: true });
  const db = await PGlite.create(join(ROOT, ".data", "pglite"), { extensions: { citext, pgcrypto } });
  const result = await migrate(
    { exec: async (sql) => void (await db.exec(sql)), rows: async <T,>(sql: string) => (await db.query<T>(sql)).rows },
    loadMigrations(join(ROOT, "db", "migrations")),
  );
  for (const name of result.applied) console.log(`[dev-db] applied ${name}`);
  server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 4 });
  await server.start();
  console.log(`[dev-db] embedded Postgres ready on 127.0.0.1:${PORT} (data in .data/pglite)`);
  env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;
  env.DB_POOL_MAX = "1";
}

const next = spawn(process.execPath, [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "dev", ...process.argv.slice(2)], {
  cwd: ROOT,
  env,
  stdio: "inherit",
});

const shutdown = async (code: number) => {
  await server?.stop().catch(() => undefined);
  process.exit(code);
};
next.on("exit", (code) => void shutdown(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    next.kill(signal);
  });
}
