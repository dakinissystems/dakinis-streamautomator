/**
 * Kick Events webhook receiver.
 * Mount with express.raw so signature verification uses the exact body bytes.
 */

import { User } from '../../models/index.js';
import { Integration } from '../../modules/integrations/infrastructure/models.js';
import { KickService } from '../../modules/integrations/application/kickService.js';
import { handleStreamStarted, handleStreamEnded } from '../../services/platformIntegrationService.js';
import logger from '../../utils/logger.js';

const processedMessageIds = new Map();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function rememberMessageId(id) {
  const now = Date.now();
  for (const [key, ts] of processedMessageIds) {
    if (now - ts > IDEMPOTENCY_TTL_MS) processedMessageIds.delete(key);
  }
  if (processedMessageIds.has(id)) return false;
  processedMessageIds.set(id, now);
  return true;
}

function rawBodyToString(raw) {
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (typeof raw === 'string') return raw;
  return '';
}

/**
 * Express handler: POST /api/webhooks/kick
 */
export async function handleKickWebhook(req, res) {
  const messageId = req.get('Kick-Event-Message-Id') || '';
  const timestamp = req.get('Kick-Event-Message-Timestamp') || '';
  const signature = req.get('Kick-Event-Signature') || '';
  const eventType = req.get('Kick-Event-Type') || '';
  const rawBody = rawBodyToString(req.body);

  try {
    const kick = new KickService();
    const ok = await kick.verifyWebhookSignature({
      messageId,
      timestamp,
      rawBody,
      signatureHeader: signature,
    });
    if (!ok) {
      logger.warn('Kick webhook invalid signature', { messageId, eventType });
      return res.status(401).json({ error: 'invalid_signature' });
    }

    if (messageId && !rememberMessageId(messageId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = {};
    }

    logger.info('Kick webhook received', {
      messageId,
      eventType,
      broadcasterUserId: payload?.broadcaster_user_id ?? payload?.broadcasterUserId,
    });

    if (eventType === 'livestream.status.updated') {
      await handleLivestreamStatusUpdated(payload);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Kick webhook handler error', { error: error.message, eventType, messageId });
    // Return 200 when possible to avoid Kick auto-unsubscribing on transient errors after verify.
    return res.status(200).json({ ok: false, error: error.message });
  }
}

async function handleLivestreamStatusUpdated(payload) {
  const broadcasterId = payload?.broadcaster_user_id ?? payload?.broadcasterUserId;
  if (broadcasterId == null) return;

  const integration = await Integration.findOne({
    where: {
      provider: 'kick',
      providerUserId: String(broadcasterId),
      status: 'active',
    },
  });
  if (!integration) {
    logger.debug('Kick livestream event: no integration for broadcaster', { broadcasterId });
    return;
  }

  const user = await User.findByPk(integration.userId);
  if (!user) return;

  const isLive =
    payload?.is_live === true ||
    payload?.isLive === true ||
    String(payload?.status || '').toLowerCase() === 'live' ||
    payload?.livestream?.is_live === true;

  const wentOffline =
    payload?.is_live === false ||
    payload?.isLive === false ||
    String(payload?.status || '').toLowerCase() === 'offline' ||
    payload?.livestream?.is_live === false;

  const title =
    payload?.title ||
    payload?.stream_title ||
    payload?.livestream?.session_title ||
    integration.metadata?.channelTitle ||
    'Live on Kick';

  if (isLive && !wentOffline) {
    await handleStreamStarted(user, { title, platform: 'kick', note: title });
    return;
  }
  if (wentOffline) {
    await handleStreamEnded(user, { platform: 'kick' });
  }
}

export default handleKickWebhook;
