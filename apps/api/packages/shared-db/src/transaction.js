/**
 * @param {import('pg').Pool} pool
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @template T
 */
export async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * @param {import('pg').PoolClient | import('pg').Pool} db
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function txQuery(db, text, params = []) {
  return db.query(text, params);
}
