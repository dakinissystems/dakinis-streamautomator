/**
 * Poll and process pending meta.outbox_events.
 * Phase 1: marks director events processed; retries on transient failures.
 */

/**
 * @param {import('pg').Pool} pool
 * @param {{ batchSize?: number, log?: (msg: string, meta?: object) => void, onEvent?: (pool: import('pg').Pool, event: object, log: (msg: string, meta?: object) => void) => Promise<void> }} [opts]
 */
export async function processOutboxBatch(pool, opts = {}) {
  const batchSize = opts.batchSize ?? 20;
  const log = opts.log ?? (() => {});

  const { rows: pending } = await pool.query(
    `SELECT id, aggregate_type, aggregate_id, event_type, payload, attempts
     FROM meta.outbox_events
     WHERE processed_at IS NULL AND attempts < 10
     ORDER BY created_at ASC
     LIMIT $1`,
    [batchSize],
  );

  if (pending.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const event of pending) {
    try {
      await handleOutboxEvent(pool, event, log, opts);
      await pool.query(
        `UPDATE meta.outbox_events SET processed_at = now(), attempts = attempts + 1 WHERE id = $1`,
        [event.id],
      );
      processed += 1;
    } catch (err) {
      failed += 1;
      await pool.query(
        `UPDATE meta.outbox_events SET attempts = attempts + 1 WHERE id = $1`,
        [event.id],
      );
      log("outbox_event_failed", {
        id: event.id,
        eventType: event.event_type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { processed, failed };
}

/**
 * @param {import('pg').Pool} pool
 * @param {object} event
 * @param {(msg: string, meta?: object) => void} log
 * @param {{ onEvent?: (pool: import('pg').Pool, event: object, log: (msg: string, meta?: object) => void) => Promise<void> }} [opts]
 */
async function handleOutboxEvent(pool, event, log, opts = {}) {
  if (opts.onEvent) {
    await opts.onEvent(pool, event, log);
    return;
  }

  const type = String(event.event_type || "");

  if (
    type.startsWith("stream.director.") ||
    type.startsWith("workspace.addon_data.") ||
    type.startsWith("stream.automation.") ||
    type.startsWith("invite.") ||
    type.startsWith("director.") ||
    type.startsWith("automation.")
  ) {
    log("outbox_event_handled", {
      id: event.id,
      eventType: type,
      aggregateId: event.aggregate_id,
    });
    return;
  }

  log("outbox_event_unknown", { id: event.id, eventType: type });
}

/**
 * @param {import('pg').Pool} pool
 * @param {{ intervalMs?: number, log?: (msg: string, meta?: object) => void, onEvent?: (pool: import('pg').Pool, event: object, log: (msg: string, meta?: object) => void) => Promise<void> }} [opts]
 * @returns {() => void} stop function
 */
export function startOutboxPoller(pool, opts = {}) {
  const intervalMs = opts.intervalMs ?? 15_000;
  let running = true;

  const tick = async () => {
    if (!running) return;
    try {
      await processOutboxBatch(pool, { log: opts.log, onEvent: opts.onEvent });
    } catch (err) {
      opts.log?.("outbox_poller_error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const timer = setInterval(() => {
    tick().catch(() => {});
  }, intervalMs);

  tick().catch(() => {});

  return () => {
    running = false;
    clearInterval(timer);
  };
}
