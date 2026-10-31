/**
 * Database access for the app: postgres.js on DATABASE_URL.
 *
 * - Production: DATABASE_URL points at the real Postgres; migrations run
 *   with `npm run db:migrate`.
 * - Development: `npm run dev` starts an embedded Postgres (PGlite, data in
 *   .data/pglite) in its own process and sets DATABASE_URL for you
 *   (scripts/dev.mts).
 *
 * Tenant isolation: producer-owned queries must filter by the id returned
 * from producerScope(session) in src/lib/auth. Admin queries are the only
 * unfiltered ones.
 */

export interface Db {
  /** One parameterised statement ($1, $2, …); returns the rows. */
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

const globalForDb = globalThis as unknown as { shipitayitiDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.shipitayitiDb) {
    globalForDb.shipitayitiDb = connect().catch((error) => {
      globalForDb.shipitayitiDb = undefined;
      throw error;
    });
  }
  return globalForDb.shipitayitiDb;
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — run `npm run dev` (embedded dev database) or see .env.example");
  }
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { max: Number(process.env.DB_POOL_MAX ?? 10), onnotice: () => undefined });
  return {
    query: async <T,>(text: string, params: unknown[] = []) => (await sql.unsafe(text, params as never[])) as unknown as T[],
  };
}

/** Wrap a PGlite instance (tests). */
export function pgliteDb(pg: { query<T>(text: string, params?: unknown[]): Promise<{ rows: T[] }> }): Db {
  return { query: async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows };
}
