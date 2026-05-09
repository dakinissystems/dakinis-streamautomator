/**
 * Authentication Utilities
 * Helper functions for JWT generation and user response formatting
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import jwt from 'jsonwebtoken';
import { buildLicenseSummary } from './licenseUtils.js';
import {
  getStreamautomatorJwtAudience,
  getStreamautomatorJwtIssuer,
} from './jwtAccess.js';

const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/** Thrown when user requests active tenant membership they do not have */
export const TENANT_SWITCH_FORBIDDEN = 'TENANT_SWITCH_FORBIDDEN';

/**
 * Create a short-lived state token for OAuth link flow (userId in state)
 * @param {number} userId - User id to link the provider to
 * @param {string} purpose - e.g. 'link_discord', 'link_google'
 * @returns {string} JWT state token
 */
export function createLinkState(userId, purpose) {
  return jwt.sign(
    { userId, purpose },
    jwtSecret,
    { expiresIn: '10m' }
  );
}

/**
 * Verify link state token and return userId
 * @param {string} stateToken - JWT from OAuth state
 * @param {string} purpose - expected purpose
 * @returns {{ userId: number }|null}
 */
export function verifyLinkState(stateToken, purpose) {
  try {
    const payload = jwt.verify(stateToken, jwtSecret);
    if (payload.purpose !== purpose) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Create state for X (Twitter) OAuth 2.0 with PKCE. Stores code_verifier so callback can exchange code.
 * @param {string} codeVerifier - PKCE code_verifier
 * @param {string} purpose - 'twitter_oauth2_login' | 'link_twitter'
 * @param {number} [userId] - For link_twitter only
 * @returns {string} JWT state token
 */
export function createTwitterOAuth2State(codeVerifier, purpose, userId) {
  const payload = { purpose, verifier: codeVerifier };
  if (purpose === 'link_twitter' && userId != null) payload.userId = userId;
  return jwt.sign(payload, jwtSecret, { expiresIn: '10m' });
}

/**
 * Verify X OAuth 2.0 state and return verifier (and userId for link).
 * @param {string} stateToken - JWT from OAuth state
 * @param {string} purpose - 'twitter_oauth2_login' | 'link_twitter'
 * @returns {{ verifier: string, userId?: number }|null}
 */
export function verifyTwitterOAuth2State(stateToken, purpose) {
  try {
    const payload = jwt.verify(stateToken, jwtSecret);
    if (payload.purpose !== purpose || !payload.verifier) return null;
    const out = { verifier: payload.verifier };
    if (purpose === 'link_twitter' && payload.userId != null) out.userId = payload.userId;
    return out;
  } catch {
    return null;
  }
}

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, username, isAdmin
 * @param {number|null} [tenantId] - Active SaaS tenant (workspace)
 * @returns {string} JWT token
 */
export function generateToken(user, tenantId = null) {
  const payload = {
    id: user.id,
    sub: String(user.id),
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    role: user.isAdmin ? 'admin' : 'member',
    permissions: [],
    iss: getStreamautomatorJwtIssuer(),
    aud: getStreamautomatorJwtAudience(),
  };
  const tid = tenantId !== undefined && tenantId !== null ? Number(tenantId) : null;
  if (tid !== null && Number.isFinite(tid)) {
    payload.tenantId = tid;
    payload.tenant = String(tid);
  }
  return jwt.sign(
    payload,
    jwtSecret,
    { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
  );
}

/**
 * Build standardized user response object
 * @param {Object} user - Sequelize User instance or plain user object
 * @returns {Object} Formatted user response with license summary
 */
/** True when server .env provides AkoeNet webhook + secret fallback (GET /akoenet/guilds works without per-user URL). */
export function isAkoenetGlobalWebhookConfigured() {
  const url = String(process.env.AKOENET_SCHEDULER_WEBHOOK_URL || '').trim();
  const secret = String(process.env.SCHEDULER_WEBHOOK_SECRET || '').trim();
  return !!(url && secret);
}

export function buildUserResponse(user, extras = {}) {
  // Convert Sequelize instance to plain object if needed
  const userPlain = user.get ? user.get({ plain: true }) : user;
  const licenseSummary = buildLicenseSummary(userPlain);
  const akoenetGlobalWebhookConfigured = isAkoenetGlobalWebhookConfigured();
  const { tenantId = undefined } = extras;

  const out = {
    id: userPlain.id,
    username: userPlain.username,
    email: userPlain.email,
    licenseKey: userPlain.licenseKey,
    licenseExpiresAt: userPlain.licenseExpiresAt,
    licenseType: userPlain.licenseType,
    licenseAlert: licenseSummary.alert,
    licenseDaysLeft: licenseSummary.daysLeft,
    isAdmin: userPlain.isAdmin,
    merchandisingLink: userPlain.merchandisingLink,
    merchandisingButtonPosition: userPlain.merchandisingButtonPosition || 'bottom-right',
    profileImageUrl: userPlain.profileImageUrl || null,
    dashboardShowTwitchSubs: userPlain.dashboardShowTwitchSubs !== false,
    dashboardShowTwitchBits: userPlain.dashboardShowTwitchBits !== false,
    dashboardShowTwitchDonations: userPlain.dashboardShowTwitchDonations === true,
    discordClipsGuildId: userPlain.discordClipsGuildId || null,
    discordClipsChannelId: userPlain.discordClipsChannelId || null,
    publicPageBannerUrl: userPlain.publicPageBannerUrl || null,
    publicPageBannerPosition: userPlain.publicPageBannerPosition || 'top',
    akoenetWebhookUrl: userPlain.akoenetWebhookUrl || null,
    akoenetAnnounceChannelId: userPlain.akoenetAnnounceChannelId || null,
    akoenetServerId: userPlain.akoenetServerId || null,
    akoenetWebhookSecretSet: !!(userPlain.akoenetWebhookSecret && String(userPlain.akoenetWebhookSecret).trim()),
    akoenetSendClips: userPlain.akoenetSendClips === true,
    akoenetGlobalWebhookConfigured,
  };
  if (tenantId != null && Number.isFinite(Number(tenantId))) {
    out.tenantId = Number(tenantId);
  }
  return out;
}

/**
 * Generate authentication response with token and user data
 * @param {Object} user - Sequelize User instance or plain user object
 * @param {{ activeTenantId?: number|null }} [options]
 * @returns {Promise<Object>} Object with token and user data
 */
export async function generateAuthData(user, options = {}) {
  const svc = await import('../modules/tenants/application/tenantResolutionService.js');
  await svc.ensureDefaultTenantForUser(user.id);

  let tenantId;
  const chosen = options.activeTenantId;

  if (chosen !== undefined && chosen !== null && chosen !== '') {
    const tid = Number(chosen);
    if (!Number.isFinite(tid)) {
      const e = new Error('Invalid tenant');
      e.code = TENANT_SWITCH_FORBIDDEN;
      throw e;
    }
    const ok = await svc.verifyUserTenantMembership(user.id, tid);
    if (!ok) {
      const e = new Error('Not a member of this tenant');
      e.code = TENANT_SWITCH_FORBIDDEN;
      throw e;
    }
    tenantId = tid;
  } else {
    tenantId = await svc.getPrimaryTenantIdForUser(user.id);
  }

  const token = generateToken(user, tenantId);
  const userResponse = buildUserResponse(user, { tenantId });

  return {
    token,
    user: userResponse,
  };
}
