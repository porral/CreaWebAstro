// Self-hosted Postgres connection pool. Replaces the Supabase client.
import { Pool } from "pg";

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return new Pool({ connectionString });
}

let _pool: Pool | undefined;

export function getPool(): Pool {
  if (!_pool) _pool = createPool();
  return _pool;
}

export const db = new Proxy({} as Pool, {
  get(_, prop, receiver) {
    return Reflect.get(getPool(), prop, receiver);
  },
});
