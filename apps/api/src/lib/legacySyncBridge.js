import {
  reconcileDirectorSessionToPublic,
  reconcileAutomationRuleToPublic,
  deleteAutomationRuleFromPublic,
} from "@dakinis/shared-db/legacy/public-sync";
import { isPlatformPgConfigured, platformQuery } from "./platformDb.js";
import logger from "../utils/logger.js";

function legacySyncEnabled() {
  return process.env.LEGACY_SYNC_MODE === "true" && isPlatformPgConfigured();
}

/**
 * Reconcile stream.* → public.* from outbox payload (Fase 1C).
 * @param {string} eventType
 * @param {object} payload
 */
export async function reconcileLegacyFromOutboxEvent(eventType, payload) {
  if (!legacySyncEnabled()) return null;

  const legacyId = Number(payload?.legacyId);
  if (!Number.isFinite(legacyId)) return null;

  try {
    if (eventType.startsWith("stream.director.")) {
      return await reconcileDirectorSessionToPublic(platformQuery, legacyId);
    }

    if (eventType === "stream.automation.deleted") {
      const deleted = await deleteAutomationRuleFromPublic(platformQuery, legacyId);
      return { synced: deleted, legacyId, action: "delete" };
    }

    if (eventType.startsWith("stream.automation.")) {
      return await reconcileAutomationRuleToPublic(platformQuery, legacyId);
    }
  } catch (err) {
    logger.warn("legacy sync from outbox failed", {
      eventType,
      legacyId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  return null;
}
