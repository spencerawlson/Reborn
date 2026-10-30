/**
 * npm run db:migrate — apply pending migrations to $DATABASE_URL.
 * Runs directly on Node 24 (built-in TypeScript type stripping).
 */
import { join } from "node:path";
import postgres from "postgres";
import { loadMigrations, migrate } from "../src/lib/db/migrate.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example)");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => undefined });
// One reserved connection, so the advisory lock and the work share a session.
const conn = await sql.reserve();
try {
  const result = await migrate(
    {
      exec: async (text) => {
        await conn.unsafe(text);
      },
      rows: async <T,>(text: string) => (await conn.unsafe(text)) as unknown as T[],
    },
    loadMigrations(join(import.meta.dirname, "..", "db", "migrations")),
  );
  if (result.applied.length === 0) {
    console.log(`Up to date (${result.alreadyApplied} migrations applied).`);
  } else {
    for (const name of result.applied) console.log(`applied ${name}`);
  }
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  conn.release();
  await sql.end();
}
