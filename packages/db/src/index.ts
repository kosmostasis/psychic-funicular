import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://cdp:cdp@localhost:5432/cdp";

let pool: pg.Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new pg.Pool({ connectionString, max: 10 });
  }
  return drizzle(pool, { schema });
}

/**
 * For workers that need a dedicated client (e.g. long-running script).
 */
export function getDbWithClient(client: pg.Client) {
  return drizzle(client, { schema });
}

export * from "./schema.js";
export { eq } from "drizzle-orm";
