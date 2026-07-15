import { createAutomationRuleRepository } from "@dakinis/shared-db/repositories/automation";
import { isPlatformPgConfigured, platformQuery } from "./platformDb.js";
import { publishPlatformOutbox } from "./platformOutbox.js";
import logger from "../utils/logger.js";

let repo = null;

function getRepo() {
  if (!isPlatformPgConfigured()) return null;
  if (!repo) repo = createAutomationRuleRepository(platformQuery);
  return repo;
}

export function getAutomationRepository() {
  return getRepo();
}

function streamReadEnabled() {
  return process.env.AUTOMATION_READ_FROM_STREAM === "true";
}

/**
 * @param {number} legacyUserId
 */
export async function readAutomationRulesFromStream(legacyUserId) {
  if (!streamReadEnabled()) return null;
  const repository = getRepo();
  if (!repository) return null;
  try {
    return await repository.listLegacyRulesForUser(legacyUserId);
  } catch (err) {
    logger.debug("automation stream list failed, fallback sequelize", {
      userId: legacyUserId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * @param {number} legacyUserId
 * @param {string} triggerType
 */
export async function readAutomationRulesForTriggerFromStream(legacyUserId, triggerType) {
  if (!streamReadEnabled()) return null;
  const repository = getRepo();
  if (!repository) return null;
  try {
    return await repository.listLegacyRulesForTrigger(legacyUserId, triggerType);
  } catch (err) {
    logger.debug("automation stream trigger list failed, fallback sequelize", {
      userId: legacyUserId,
      triggerType,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * @param {object} rule — Sequelize instance or plain row
 * @param {string} eventType
 */
export async function syncAutomationRuleToStream(rule, eventType) {
  const repository = getRepo();
  if (!repository || !rule) return null;

  const plain = typeof rule.get === "function" ? rule.get({ plain: true }) : rule;

  try {
    const row = await repository.upsertFromLegacyRule(plain);
    if (row) {
      await publishPlatformOutbox({
        aggregateType: "automation_rule",
        aggregateId: String(plain.id),
        eventType,
        payload: {
          legacyId: plain.id,
          streamId: row.id,
          userId: plain.userId,
          triggerType: plain.triggerType,
          enabled: plain.enabled,
          name: plain.name,
        },
      });
    }
    return row;
  } catch (err) {
    logger.warn("automation stream sync failed (non-fatal)", {
      legacyId: plain.id,
      eventType,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * @param {number} legacyRuleId
 */
export async function syncAutomationRuleDeleteToStream(legacyRuleId) {
  const repository = getRepo();
  if (!repository || !legacyRuleId) return false;
  try {
    const deleted = await repository.deleteByLegacyId(legacyRuleId);
    if (deleted) {
      await publishPlatformOutbox({
        aggregateType: "automation_rule",
        aggregateId: String(legacyRuleId),
        eventType: "stream.automation.deleted",
        payload: { legacyId: legacyRuleId },
      });
    }
    return deleted;
  } catch (err) {
    logger.warn("automation stream delete sync failed (non-fatal)", {
      legacyId: legacyRuleId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
