/**
 * Bridge StreamAutomator → Dakinis Platform (Internal API).
 * Domain logic stays here; auth/billing/notifications/AI come from platform over time.
 */

import logger from '../utils/logger.js';
import { dakinisInternalFetch, isDakinisInternalConfigured } from '../lib/dakinisInternalClient.js';
import { StreamTimelineEvent } from '../modules/content/infrastructure/models.js';
import { runAutomationForTrigger } from '../modules/automation/application/automationExecutor.js';
import { startDirectorForStream, endActiveDirectorSession } from '../modules/automation/application/directorService.js';

export const PLATFORM_EVENTS = {
  STREAM_SCHEDULED: 'stream.scheduled',
  STREAM_STARTED: 'stream.started',
  STREAM_ENDED: 'stream.ended',
  STREAM_PUBLISHED: 'stream.published',
  POST_PUBLISHED: 'stream.post_published',
};

function platformUserId(user) {
  return user?.platformAuthSub ? String(user.platformAuthSub).trim() : null;
}

function buildStreamPayload(user, extra = {}) {
  return {
    streamer: user?.username || null,
    scheduler_slug: user?.username || null,
    platformUserId: platformUserId(user),
    ...extra,
  };
}

export async function emitPlatformEvent(event, payload, meta = {}) {
  if (!isDakinisInternalConfigured()) return { skipped: true, reason: 'internal_not_configured' };
  try {
    return await dakinisInternalFetch('/events', {
      method: 'POST',
      body: {
        event,
        payload,
        userId: meta.userId || payload.platformUserId || null,
        tenantId: meta.tenantId || null,
        source: meta.source || 'streamautomator',
      },
    });
  } catch (err) {
    logger.warn('Platform event emit failed', { event, error: err.message });
    return { ok: false, error: err.message };
  }
}

export async function dispatchAssistantStreamEvent(user, type, payload = {}) {
  const serverId = String(user?.akoenetServerId || '').trim();
  if (!serverId || !isDakinisInternalConfigured()) {
    return { skipped: true, reason: !serverId ? 'no_akoenet_server' : 'internal_not_configured' };
  }
  try {
    return await dakinisInternalFetch(`/akoenet/servers/${encodeURIComponent(serverId)}/assistant/events`, {
      method: 'POST',
      body: {
        type,
        source: 'streamautomator',
        payload: buildStreamPayload(user, payload),
      },
    });
  } catch (err) {
    logger.warn('Assistant event dispatch failed', { type, error: err.message });
    return { ok: false, error: err.message };
  }
}

export async function sendPlatformNotification(userId, { title, body, type = 'streamautomator' }) {
  if (!userId || !isDakinisInternalConfigured()) return { skipped: true };
  try {
    return await dakinisInternalFetch('/notifications/send', {
      method: 'POST',
      body: {
        userId: String(userId),
        type,
        channel: 'in-app',
        payload: { title, body },
      },
    });
  } catch (err) {
    logger.warn('Platform notification failed', { error: err.message });
    return { ok: false, error: err.message };
  }
}

export function enqueuePlatformStreamScheduled(user, content) {
  const contentType = (content?.contentType || '').toLowerCase();
  if (contentType !== 'event' && contentType !== 'stream') return;

  const scheduled = content.scheduledFor instanceof Date ? content.scheduledFor : new Date(content.scheduledFor);
  if (Number.isNaN(scheduled.getTime())) return;

  const payload = buildStreamPayload(user, {
    contentId: content.id,
    title: (content.title || 'Scheduled stream').slice(0, 500),
    starts_at: scheduled.toISOString(),
    platform: Array.isArray(content.platforms) ? content.platforms[0] : 'twitch',
  });

  emitPlatformEvent(PLATFORM_EVENTS.STREAM_SCHEDULED, payload, {
    userId: platformUserId(user),
    source: 'streamautomator',
  }).catch(() => {});

  runAutomationForTrigger(user, 'stream.scheduled', { content, payload }).catch((err) => {
    logger.warn('Automation stream.scheduled failed', { error: err.message, userId: user?.id });
  });
}

/**
 * Central handler when a stream goes live (webhook / OBS / Streamer.bot).
 * @param {object} user — Sequelize User row (include akoenetServerId, platformAuthSub, username)
 * @param {{ note?: string; title?: string; platform?: string }} [opts]
 */
export async function handleStreamStarted(user, opts = {}) {
  const note = String(opts.note || '').trim();
  const title = String(opts.title || note || 'Live stream').slice(0, 500);
  const platform = String(opts.platform || 'twitch').slice(0, 40);

  await StreamTimelineEvent.create({
    userId: user.id,
    type: 'stream_start',
    payload: { note: note || null, title, platform, source: 'webhook' },
  });

  const payload = buildStreamPayload(user, { title, platform, note: note || null });

  await emitPlatformEvent(PLATFORM_EVENTS.STREAM_STARTED, payload, {
    userId: platformUserId(user),
  });

  await dispatchAssistantStreamEvent(user, 'stream.started', payload);

  const platformUid = platformUserId(user);
  if (platformUid) {
    await sendPlatformNotification(platformUid, {
      title: 'Directo iniciado',
      body: title,
      type: 'stream.started',
    });
  }

  await runAutomationForTrigger(user, 'stream.started', { payload, note, title, platform });

  const webhookUrl = user.discordAnnounceWebhookUrl?.trim();
  if (webhookUrl) {
    await announceStreamStarted(webhookUrl, note || title);
  }

  const director = await startDirectorForStream(user, { title, platform, note });

  return { timeline: true, director };
}

export async function handleStreamEnded(user, opts = {}) {
  const title = String(opts.title || 'Stream ended').slice(0, 500);
  const payload = buildStreamPayload(user, { title, ...opts });

  await StreamTimelineEvent.create({
    userId: user.id,
    type: 'stream_end',
    payload: { title, source: opts.source || 'webhook' },
  });

  await emitPlatformEvent(PLATFORM_EVENTS.STREAM_ENDED, payload, {
    userId: platformUserId(user),
  });

  await dispatchAssistantStreamEvent(user, 'stream.ended', payload);
  await runAutomationForTrigger(user, 'stream.ended', { payload, title });
  await endActiveDirectorSession(user.id);
}
