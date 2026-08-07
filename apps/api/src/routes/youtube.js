/**
 * YouTube OAuth Routes
 * Handles YouTube OAuth flow and token management
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { Integration } from '../modules/integrations/infrastructure/models.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getFrontendPublicUrl } from '../utils/publicUrls.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const FRONTEND_URL = getFrontendPublicUrl();

// Base URL without trailing slash so callback URI never has double slash
const backendBaseUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || `${backendBaseUrl}/api/youtube/callback`
);

function settingsRedirect(query) {
  const q = new URLSearchParams(query).toString();
  return `${FRONTEND_URL.replace(/\/$/, '')}/settings${q ? `?${q}` : ''}`;
}

function youtubeErrorParam(value) {
  const raw = String(value || 'unknown').slice(0, 120);
  return raw.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim() || 'unknown';
}

/**
 * GET /api/youtube/connect
 * Initiates YouTube OAuth flow (signed state JWT, same pattern as Kick/Twitch).
 */
router.get('/connect', requireAuth, (req, res) => {
  try {
    const state = jwt.sign(
      { userId: req.user.id, purpose: 'youtube_connect' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      prompt: 'consent',
      state,
    });

    logger.info('YouTube OAuth flow initiated', { userId: req.user.id });
    res.redirect(url);
  } catch (error) {
    logger.error('Failed to initiate YouTube OAuth', {
      userId: req.user.id,
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to initiate YouTube connection' });
  }
});

/**
 * GET /api/youtube/callback
 */
router.get('/callback', async (req, res) => {
  try {
    const oauthError = typeof req.query.error === 'string' ? req.query.error : null;
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';

    if (!stateRaw) {
      return res.redirect(settingsRedirect({ youtube_error: 'missing_state' }));
    }

    let decoded;
    try {
      decoded = jwt.verify(stateRaw, JWT_SECRET);
    } catch (e) {
      logger.warn('YouTube callback invalid state', { error: e.message });
      return res.redirect(settingsRedirect({ youtube_error: 'invalid_state' }));
    }
    if (decoded.purpose !== 'youtube_connect' || !decoded.userId) {
      return res.redirect(settingsRedirect({ youtube_error: 'invalid_state' }));
    }

    if (oauthError) {
      logger.warn('YouTube OAuth error', { error: oauthError });
      return res.redirect(settingsRedirect({ youtube_error: youtubeErrorParam(oauthError) }));
    }

    if (!code) {
      logger.warn('YouTube OAuth callback missing code');
      return res.redirect(settingsRedirect({ youtube_error: 'missing_code' }));
    }

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      logger.warn('YouTube OAuth: No refresh_token received', {
        hasAccessToken: Boolean(tokens.access_token),
      });
      return res.redirect(settingsRedirect({ youtube_error: 'no_refresh_token' }));
    }

    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    const providerUserId = channel?.id || null;
    const channelTitle = channel?.snippet?.title || 'YouTube Channel';
    const userId = Number(decoded.userId);

    const [integration, created] = await Integration.findOrCreate({
      where: { userId, provider: 'youtube' },
      defaults: {
        userId,
        provider: 'youtube',
        providerUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope
          ? Array.isArray(tokens.scope)
            ? tokens.scope
            : tokens.scope.split(' ')
          : null,
        status: 'active',
        metadata: {
          channelId: providerUserId,
          channelTitle,
          connectedAt: new Date().toISOString(),
        },
      },
    });

    if (!created) {
      await integration.update({
        providerUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope
          ? Array.isArray(tokens.scope)
            ? tokens.scope
            : tokens.scope.split(' ')
          : null,
        status: 'active',
        metadata: {
          ...integration.metadata,
          channelId: providerUserId,
          channelTitle,
          connectedAt: new Date().toISOString(),
        },
      });
    }

    logger.info('YouTube integration saved', {
      userId,
      providerUserId,
      channelTitle,
      created,
    });

    res.redirect(settingsRedirect({ youtube_connected: 'true' }));
  } catch (error) {
    logger.error('YouTube OAuth callback error', {
      error: error.message,
      stack: error.stack,
    });
    res.redirect(settingsRedirect({ youtube_error: youtubeErrorParam(error.message) }));
  }
});

/**
 * POST /api/youtube/disconnect
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'youtube' },
    });

    if (!integration) {
      return res.status(404).json({ error: 'YouTube not connected' });
    }

    await integration.update({
      status: 'revoked',
      accessToken: null,
      refreshToken: null,
    });

    logger.info('YouTube integration disconnected', { userId: req.user.id });
    res.json({ message: 'YouTube disconnected successfully' });
  } catch (error) {
    logger.error('Failed to disconnect YouTube', {
      userId: req.user.id,
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to disconnect YouTube' });
  }
});

/**
 * GET /api/youtube/status
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const integration = await Integration.findOne({
      where: { userId: req.user.id, provider: 'youtube', status: 'active' },
      attributes: ['id', 'provider', 'providerUserId', 'status', 'metadata', 'expiresAt', 'createdAt'],
    });

    if (!integration) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      channelId: integration.providerUserId,
      channelTitle: integration.metadata?.channelTitle || null,
      expiresAt: integration.expiresAt,
      connectedAt: integration.metadata?.connectedAt || null,
    });
  } catch (error) {
    logger.error('YouTube status error', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to get YouTube status' });
  }
});

export default router;
