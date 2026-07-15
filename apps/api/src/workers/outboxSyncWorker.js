import { getPlatformPool, isPlatformPgConfigured } from "../lib/platformDb.js";
import { startOutboxPoller } from "@dakinis/shared-db/outbox/processor";
import { handleStreamAutomatorOutboxEvent } from "../lib/outboxHandlers.js";
import logger from "../utils/logger.js";

let stopPoller = null;

/**
 * Poll meta.outbox_events when Supabase is configured (migration 041).
 */
export function startOutboxSyncWorker() {
  if (process.env.ENABLE_OUTBOX_WORKER === "false") {
    logger.info("Outbox worker disabled (ENABLE_OUTBOX_WORKER=false)");
    return null;
  }

  if (!isPlatformPgConfigured()) {
    logger.debug("Outbox worker skipped — DATABASE_URL not set");
    return null;
  }

  const pool = getPlatformPool();
  if (!pool) return null;

  const intervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS) || 15_000;

  stopPoller = startOutboxPoller(pool, {
    intervalMs,
    log: (msg, meta) => logger.debug(msg, meta),
    onEvent: handleStreamAutomatorOutboxEvent,
  });

  logger.info("Outbox sync worker started", { intervalMs });
  return stopPoller;
}

export function stopOutboxSyncWorker() {
  if (stopPoller) {
    stopPoller();
    stopPoller = null;
  }
}
