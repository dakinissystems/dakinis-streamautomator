import {
  dakinisInternalFetch,
  isDakinisInternalConfigured,
} from "./dakinisInternalClient.js";
import { reconcileLegacyFromOutboxEvent } from "./legacySyncBridge.js";
import logger from "../utils/logger.js";

const PLATFORM_EVENT_MAP = {
  "stream.director.started": "stream.started",
  "stream.director.ended": "stream.ended",
  "stream.director.step_completed": "stream.director.step",
  "stream.automation.created": "stream.automation.changed",
  "stream.automation.updated": "stream.automation.changed",
  "stream.automation.deleted": "stream.automation.deleted",
  "workspace.addon_data.saved": "workspace.addon_data.saved",
  "director.started.v1": "stream.director.started",
  "director.ended.v1": "stream.director.ended",
  "director.completed.v1": "stream.director.ended",
  "invite.accepted.v1": "workspace.member.accepted",
};

/**
 * @param {import('pg').Pool} _pool
 * @param {object} event
 * @param {(msg: string, meta?: object) => void} log
 */
export async function handleStreamAutomatorOutboxEvent(_pool, event, log) {
  const eventType = String(event.event_type || "");
  const payload =
    event.payload && typeof event.payload === "object" ? event.payload : {};

  const legacyResult = await reconcileLegacyFromOutboxEvent(eventType, payload);
  if (legacyResult) {
    log("outbox_legacy_sync", { id: event.id, eventType, legacyResult });
  }

  if (isDakinisInternalConfigured()) {
    const platformEvent = PLATFORM_EVENT_MAP[eventType] || eventType;
    try {
      await dakinisInternalFetch("/events", {
        method: "POST",
        body: {
          event: platformEvent,
          payload: {
            ...payload,
            outboxId: event.id,
            aggregateType: event.aggregate_type,
            aggregateId: event.aggregate_id,
            source: "streamautomator-outbox",
            legacySync: legacyResult,
          },
          source: "streamautomator-outbox",
        },
      });
      log("outbox_forwarded_internal", { id: event.id, eventType, platformEvent });
      return;
    } catch (err) {
      logger.warn("outbox internal forward failed", {
        id: event.id,
        eventType,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  log("outbox_event_handled_local", {
    id: event.id,
    eventType,
    aggregateId: event.aggregate_id,
  });
}
