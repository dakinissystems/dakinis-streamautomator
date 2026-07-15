import { OutboxPublisher } from "@dakinis/shared-db/outbox";
import { isPlatformPgConfigured, platformQuery } from "./platformDb.js";
import logger from "../utils/logger.js";

let outbox = null;

function getOutbox() {
  if (!isPlatformPgConfigured()) return null;
  if (!outbox) outbox = new OutboxPublisher(platformQuery);
  return outbox;
}

/**
 * @param {{
 *   aggregateType: string,
 *   aggregateId: string,
 *   eventType: string,
 *   payload?: object,
 *   idempotencyKey?: string,
 * }} input
 */
export async function publishPlatformOutbox(input) {
  const publisher = getOutbox();
  if (!publisher) return null;
  try {
    return await publisher.publish(input);
  } catch (err) {
    logger.debug("platform outbox publish skipped", {
      eventType: input.eventType,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
