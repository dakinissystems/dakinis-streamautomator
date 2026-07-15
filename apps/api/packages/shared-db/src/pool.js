import pg from "pg";

const { Pool } = pg;

/** @type {Map<string, pg.Pool>} */
const pools = new Map();

/**
 * @param {string} connectionString
 * @param {{ ssl?: boolean | object; max?: number; key?: string }} [opts]
 */
export function createPool(connectionString, opts = {}) {
  const key = opts.key || connectionString;
  if (pools.has(key)) return pools.get(key);

  const pool = new Pool({
    connectionString,
    ssl: opts.ssl ? { rejectUnauthorized: false } : undefined,
    max: opts.max ?? (Number(process.env.DATABASE_POOL_MAX) || 10),
  });
  pools.set(key, pool);
  return pool;
}

/**
 * @param {pg.Pool} pool
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function query(pool, text, params = []) {
  return pool.query(text, params);
}

/**
 * Close all cached pools (tests / shutdown).
 */
export async function closeAllPools() {
  const closing = [...pools.values()].map((p) => p.end());
  pools.clear();
  await Promise.all(closing);
}
