/**
 * Kick OAuth Routes
 * Settings connect flow (OAuth 2.1 + PKCE). Callback on API host.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { Integration } from '../modules/integrations/infrastructure/models.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getFrontendPublicUrl } from '../utils/publicUrls.js';
import {
  KickService,
  generateKickPkce,
  getKickRedirectUri,
  isKickConfigured,
  KICK_SCOPES,
} from '../modules/integrations/application/kickService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const FRONTEND_URL = getFrontendPublicUrl();

function settingsRedirect(query) {
  const q = new URLSearchParams(query).toString();
  return `${FRONTEND_URL.replace(/\/$/, '')}/settings${q ? `?${q}` : ''}`;
}

/** Only allow short safe error tokens in redirects (no raw provider / exception text). */
function kickErrorParam(value) {
  const raw = String(value || 'unknown').slice(0, 120);
  const safe = raw.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim() || 'unknown';
  return safe;
}

/**
 * GET /api/kick/connect
 * Auth via requireAuth (Bearer or ?token=).
 */
router.get('/connect', requireAuth, (req, res) => {
  try {
    if (!isKickConfigured()) {
      return res.redirect(settingsRedirect({ kick_error: 'not_configured' }));
    }
    const { codeVerifier, codeChallenge } = generateKickPkce();
    const state = jwt.sign(
      { userId: req.user.id, codeVerifier, purpose: 'kick_connect' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );
    const kick = new KickService();
    const url = kick.getAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri: getKickRedirectUri(),
      scopes: KICK_SCOPES,
    });
    logger.info('Kick OAuth flow initiated', { userId: req.user.id });
    res.redirect(url);
  } catch (error) {
    logger.error('Failed to initiate Kick OAuth', {
      userId: req.user?.id,
      error: error.message,
    });
    res.redirect(settingsRedirect({ kick_error: kickErrorParam(error.message) }));
  }
});
router.get('/callback', async (req, res) => {
  try {
    const oauthError = typeof req.query.error === 'string' ? req.query.error : null;
    const errorDescription =
      typeof req.query.error_description === 'string' ? req.query.error_description : null;
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';

    // Cryptographic gate first (signed state from /connect) — not bypassable via query flags.
    if (!stateRaw) {
      return res.redirect(settingsRedirect({ kick_error: 'missing_state' }));
    }

    let decoded;
    try {
      decoded = jwt.verify(stateRaw, JWT_SECRET);
    } catch (e) {
      logger.warn('Kick callback invalid state', { error: e.message });
      return res.redirect(settingsRedirect({ kick_error: 'invalid_state' }));
    }
    if (decoded.purpose !== 'kick_connect' || !decoded.userId || !decoded.codeVerifier) {
      return res.redirect(settingsRedirect({ kick_error: 'invalid_state' }));
    }

    if (oauthError) {
      logger.warn('Kick OAuth error', { error: oauthError, errorDescription });
      return res.redirect(
        settingsRedirect({ kick_error: kickErrorParam(errorDescription || oauthError) })
      );
    }

    if (!code) {
      return res.redirect(settingsRedirect({ kick_error: 'missing_code' }));
    }

    const kick = new KickService();
    const tokens = await kick.exchangeCode({
      code,
      codeVerifier: decoded.codeVerifier,
      redirectUri: getKickRedirectUri(),
    });

    const users = await kick.getUsers(tokens.accessToken);
    const kickUser = users[0] || null;
    const providerUserId = kickUser?.user_id != null ? String(kickUser.user_id) : null;
    const channelName = kickUser?.name || null;

    let channelSlug = null;
    let channelTitle = channelName;
    try {
      const channels = await kick.getChannels(tokens.accessToken, {
        broadcasterUserId: providerUserId,
      });
      const channel = channels[0];
      if (channel) {
        channelSlug = channel.slug || null;
        channelTitle = channel.stream_title || channel.slug || channelName;
      }
    } catch (channelErr) {
      logger.warn('Kick channels fetch after OAuth failed', { error: channelErr.message });
    }

    const userId = Number(decoded.userId);
    const [integration, created] = await Integration.findOrCreate({
      where: { userId, provider: 'kick' },
      defaults: {
        userId,
        provider: 'kick',
        providerUserId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes?.length ? tokens.scopes : KICK_SCOPES,
        status: 'active',
        metadata: {
          channelSlug,
          channelTitle,
          kickUserName: channelName,
          connectedAt: new Date().toISOString(),
        },
      },
    });

    if (!created) {
      await integration.update({
        providerUserId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || integration.refreshToken,
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes?.length ? tokens.scopes : integration.scopes,
        status: 'active',
        metadata: {
          ...(integration.metadata || {}),
          channelSlug,
          channelTitle,
          kickUserName: channelName,
          connectedAt: new Date().toISOString(),
        },
      });
    }

    try {
      const sub = await kick.subscribeLivestreamEvents(tokens.accessToken, {
        broadcasterUserId: providerUserId,
      });
      const meta = {
        ...(integration.metadata || {}),
        channelSlug,
        channelTitle,
        kickUserName: channelName,
        eventSubscriptions: sub,
        eventsSubscribedAt: new Date().toISOString(),
      };
      await integration.update({ metadata: meta });
      logger.info('Kick livestream event subscriptions created', { userId, providerUserId });
    } catch (subErr) {
      logger.warn('Kick event subscription failed (connect still ok)', {
        userId,
        error: subErr.message,
        status: subErr.response?.status,
      });
    }

    logger.info('Kick integration saved', { userId, providerUserId, created });
    return res.redirect(settingsRedirect({ kick_connected: '1' }));
  } catch (error) {
    logger.error('Kick OAuth callback error', {
      error: error.message,
      stack: error.stack,
    });
    return res.redirect(settingsRedirect({ kick_error: kickErrorParam(error.message) }));
  }
});
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'kick' },
    });
    if (!integration) {
      return res.status(404).json({ error: 'Kick not connected' });
    }
    await integration.update({ status: 'revoked', accessToken: null, refreshToken: null });
    logger.info('Kick integration disconnected', { userId: req.user.id });
    res.json({ message: 'Kick disconnected successfully' });
  } catch (error) {
    logger.error('Failed to disconnect Kick', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to disconnect Kick', details: error.message });
  }
});

/**
 * GET /api/kick/status
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'kick', status: 'active' },
      attributes: ['id', 'provider', 'providerUserId', 'status', 'metadata', 'expiresAt', 'createdAt', 'accessToken'],
    });
    if (!integration) {
      return res.json({ connected: false });
    }

    let live = false;
    let streamTitle = null;
    try {
      if (integration.accessToken && integration.providerUserId) {
        const kick = new KickService();
        const liveInfo = await kick.getLivestreamByUserId(
          integration.accessToken,
          integration.providerUserId
        );
        live = liveInfo.live;
        streamTitle = liveInfo.title;
      }
    } catch (liveErr) {
      logger.debug('Kick live status check failed', { error: liveErr.message });
    }

    res.json({
      connected: true,
      channelId: integration.providerUserId,
      channelSlug: integration.metadata?.channelSlug || null,
      channelTitle: integration.metadata?.channelTitle || null,
      live,
      streamTitle,
      expiresAt: integration.expiresAt,
      connectedAt: integration.metadata?.connectedAt || null,
    });
  } catch (error) {
    logger.error('Kick status error', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to get Kick status' });
  }
});

export default router;
