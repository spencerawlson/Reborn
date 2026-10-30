/**
 * The app's Postgres connection pool (postgres.js), created on first use.
 *
 * Tenant isolation: producer-owned queries must filter by the id returned
 * from producerScope(session) in src/lib/auth. Admin queries are the only
 * unfiltered ones.
 */

import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

// Reuse one pool across Next.js dev hot reloads.
const globalForDb = globalThis as unknown as { rebornSql?: Sql };

export function getSql(): Sql {
  if (!globalForDb.rebornSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    globalForDb.rebornSql = postgres(url, { max: 10 });
  }
  return globalForDb.rebornSql;
}
