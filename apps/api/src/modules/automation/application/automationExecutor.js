/**
 * Executes automation rule actions for a trigger.
 */

import logger from '../../../utils/logger.js';
import AutomationRule from '../infrastructure/AutomationRule.model.js';
import { StreamTimelineEvent } from '../../content/infrastructure/models.js';
import {
  emitPlatformEvent,
  dispatchAssistantStreamEvent,
  sendPlatformNotification,
  PLATFORM_EVENTS,
} from '../../../services/platformIntegrationService.js';
import { announceStreamStarted } from '../../../utils/discordAnnounce.js';
import { enqueueAkoeNetStreamScheduled } from '../../../services/akoeNetWebhookService.js';
import { readAutomationRulesForTriggerFromStream } from '../../../lib/automationStreamSync.js';

const SUPPORTED_ACTIONS = new Set([
  'platform.event',
  'akoenet.assistant',
  'akoenet.schedule_notify',
  'discord.announce',
  'timeline.log',
  'platform.notification',
]);

function matchesTrigger(rule, triggerType, ctx) {
  if (rule.triggerType !== triggerType) return false;
  const cfg = rule.triggerConfig && typeof rule.triggerConfig === 'object' ? rule.triggerConfig : {};
  if (cfg.platform && ctx.platform && cfg.platform !== ctx.platform) return false;
  return true;
}

async function runAction(user, action, ctx) {
  const type = String(action?.type || '').trim();
  const params = action?.params && typeof action.params === 'object' ? action.params : {};

  switch (type) {
    case 'platform.event': {
      const event = params.event || PLATFORM_EVENTS.STREAM_STARTED;
      return emitPlatformEvent(event, ctx.payload || {}, { userId: user.platformAuthSub, source: 'automation' });
    }
    case 'akoenet.assistant': {
      const assistantType = params.type || 'stream.started';
      return dispatchAssistantStreamEvent(user, assistantType, ctx.payload || {});
    }
    case 'akoenet.schedule_notify': {
      if (ctx.content) enqueueAkoeNetStreamScheduled(user.id, ctx.content);
      return { ok: true };
    }
    case 'discord.announce': {
      const url = user.discordAnnounceWebhookUrl?.trim();
      if (!url) return { skipped: true, reason: 'no_discord_webhook' };
      await announceStreamStarted(url, params.message || ctx.note || '');
      return { ok: true };
    }
    case 'timeline.log': {
      await StreamTimelineEvent.create({
        userId: user.id,
        type: params.type || 'automation',
        payload: { rule: params.label || type, ...(ctx.payload || {}) },
      });
      return { ok: true };
    }
    case 'platform.notification': {
      if (!user.platformAuthSub) return { skipped: true };
      return sendPlatformNotification(user.platformAuthSub, {
        title: params.title || 'StreamAutomator',
        body: params.body || ctx.title || '',
        type: params.notificationType || 'streamautomator.automation',
      });
    }
    default:
      logger.warn('Unknown automation action', { type, userId: user.id });
      return { skipped: true, reason: 'unknown_action' };
  }
}

/**
 * @param {object} user
 * @param {string} triggerType
 * @param {object} ctx
 */
export async function runAutomationForTrigger(user, triggerType, ctx = {}) {
  let rules = await readAutomationRulesForTriggerFromStream(user.id, triggerType);
  if (!rules) {
    rules = await AutomationRule.findAll({
      where: { userId: user.id, enabled: true, triggerType },
      order: [['id', 'ASC']],
    });
  }

  const results = [];
  for (const rule of rules) {
    if (!matchesTrigger(rule, triggerType, ctx)) continue;
    const actions = Array.isArray(rule.actions) ? rule.actions : [];
    for (const action of actions) {
      const actionType = String(action?.type || '');
      if (!SUPPORTED_ACTIONS.has(actionType)) continue;
      try {
        const result = await runAction(user, action, ctx);
        results.push({ ruleId: rule.id, action: actionType, result });
      } catch (err) {
        logger.warn('Automation action error', {
          ruleId: rule.id,
          action: actionType,
          error: err.message,
        });
        results.push({ ruleId: rule.id, action: actionType, error: err.message });
      }
    }
  }
  return results;
}

export function listSupportedAutomationActions() {
  return [...SUPPORTED_ACTIONS];
}

export { SUPPORTED_ACTIONS };
