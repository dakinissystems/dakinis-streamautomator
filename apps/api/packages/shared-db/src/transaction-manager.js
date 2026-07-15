import { withTransaction, txQuery } from "./transaction.js";

/**
 * Unit-of-work helper with optional retries and isolation level.
 */
export class TransactionManager {
  /**
   * @param {import('pg').Pool} pool
   * @param {{ retries?: number; isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' }} [options]
   */
  constructor(pool, options = {}) {
    this.pool = pool;
    this.retries = options.retries ?? 3;
    this.isolationLevel = options.isolationLevel ?? "READ COMMITTED";
  }

  /**
   * @param {(client: import('pg').PoolClient) => Promise<T>} fn
   * @template T
   */
  async run(fn) {
    let lastError;
    for (let attempt = 1; attempt <= this.retries; attempt += 1) {
      try {
        return await withTransaction(this.pool, async (client) => {
          await client.query(`SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel}`);
          return fn(client);
        });
      } catch (err) {
        lastError = err;
        if (attempt >= this.retries) break;
        await sleep(100 * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  }

  /**
   * Transaction + outbox publish in one commit.
   * @param {(client: import('pg').PoolClient, publish: import('./outbox/publisher.js').OutboxPublisher['publish']) => Promise<T>} fn
   * @param {import('./outbox/publisher.js').OutboxPublisher} outbox
   * @template T
   */
  async withOutbox(fn, outbox) {
    return this.run(async (client) => {
      const publish = (input) =>
        outbox.publish(input, (text, params) => txQuery(client, text, params));
      return fn(client, publish);
    });
  }
}

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
