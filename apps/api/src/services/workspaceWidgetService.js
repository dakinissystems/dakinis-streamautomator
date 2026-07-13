/**
 * Workspace / Hub widget data for Creator Suite (stream-deck, obs-companion).
 */

import { Op } from 'sequelize';
import { Content } from '../modules/content/infrastructure/models.js';
import { CONTENT_STATUS } from '../constants/contentStatus.js';
import { getDirectorSummary } from '../modules/automation/application/directorService.js';
import AutomationRule from '../modules/automation/infrastructure/AutomationRule.model.js';
import { isDakinisInternalConfigured } from '../lib/dakinisInternalClient.js';

const UPCOMING = [
  CONTENT_STATUS.SCHEDULED,
  CONTENT_STATUS.QUEUED,
  CONTENT_STATUS.PUBLISHING,
];

export async function buildWorkspaceWidgetPayload(userId) {
  const now = new Date();
  const next = await Content.findOne({
    where: {
      userId,
      contentType: { [Op.in]: ['stream', 'event'] },
      status: { [Op.in]: UPCOMING },
      scheduledFor: { [Op.gte]: now },
    },
    order: [['scheduledFor', 'ASC']],
    attributes: ['id', 'title', 'scheduledFor', 'platforms', 'contentType', 'status'],
  });

  const director = await getDirectorSummary(userId);
  const rulesEnabled = await AutomationRule.count({ where: { userId, enabled: true } });

  const live = director.active;
  const nextStream = next
    ? {
        id: next.id,
        title: next.title,
        startsAt: next.scheduledFor,
        platforms: next.platforms,
        contentType: next.contentType,
      }
    : null;

  return {
    product: 'streamautomator',
    platformIntegration: isDakinisInternalConfigured(),
    widgets: {
      'streamautomator.next-stream': nextStream
        ? {
            title: nextStream.title,
            startsAt: nextStream.startsAt,
            platform: nextStream.platforms?.[0] || 'twitch',
          }
        : null,
      'streamautomator.obs-status': {
        live,
        label: live ? 'En directo' : nextStream ? 'Programado' : 'Offline',
        directorActive: director.active,
        currentStep: director.session?.activeStep?.label || null,
      },
      'streamautomator.director': director.session,
      'streamautomator.automation': { rulesEnabled },
    },
    automation: { rulesEnabled },
    nextStream,
    director: director.session,
  };
}
