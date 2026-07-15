/**
 * @typedef {(text: string, params?: unknown[]) => Promise<import('pg').QueryResult>} QueryFn
 */

export class OutboxPublisher {
  /**
   * @param {QueryFn} queryFn
   */
  constructor(queryFn) {
    this.query = queryFn;
  }

  /**
   * @param {{
   *   aggregateType: string,
   *   aggregateId: string,
   *   eventType: string,
   *   payload: object,
   *   idempotencyKey?: string,
   * }} input
   * @param {QueryFn} [queryFn] optional tx-scoped query
   */
  async publish(input, queryFn) {
    const q = queryFn || this.query;
    const idempotencyKey =
      input.idempotencyKey ||
      `outbox:${input.eventType}:${input.aggregateType}:${input.aggregateId}`;

    const payload = {
      ...(input.payload || {}),
      _idempotencyKey: idempotencyKey,
    };

    const { rows } = await q(
      `INSERT INTO meta.outbox_events
         (aggregate_type, aggregate_id, event_type, payload, idempotency_key)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id, created_at`,
      [
        input.aggregateType,
        input.aggregateId,
        input.eventType,
        JSON.stringify(payload),
        idempotencyKey,
      ],
    );
    if (rows[0]) {
      return rows[0];
    }

    const { rows: existing } = await q(
      `SELECT id, created_at FROM meta.outbox_events
       WHERE idempotency_key = $1
       LIMIT 1`,
      [idempotencyKey],
    );
    return existing[0] ?? null;
  }
}
