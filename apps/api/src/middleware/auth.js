/**
 * Authentication middleware
 * Validates JWT tokens and attaches user to request
 */

import { User } from '../modules/users/infrastructure/models.js';
import { normalizeLicenseType, resolveLicenseExpiry } from '../utils/licenseUtils.js';
import { generateLicenseKey } from '../utils/cryptoUtils.js';
import logger from '../utils/logger.js';
import { verifyStreamautomatorAccessToken } from '../utils/jwtAccess.js';
import {
  isPlatformAuthSubject,
  loadOrProvisionStreamAutomatorUser,
  resolveTenantNumericId,
} from '../services/platformAuthBridge.js';

const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';

/**
 * If user has no valid license and never used trial, and has OAuth (Google/Twitch/Discord), assign trial once.
 * So users created with licenseType 'none' get trial on next request without re-login.
 */
async function ensureTrialForOAuthUser(user) {
  if (!user || user.isAdmin) return user;
  const plain = user.get ? user.get({ plain: true }) : user;
  const hasOAuth = !!(plain.googleId || plain.twitchId || plain.discordId || plain.twitterId || (plain.oauthProvider === 'twitter' && plain.oauthId));
  const noLicense = !plain.licenseKey || String(plain.licenseKey).length < 10;
  const neverUsedTrial = !plain.hasUsedTrial;
  if (!hasOAuth || !noLicense || !neverUsedTrial) return user;

  try {
    const expiryResult = resolveLicenseExpiry({ licenseType: normalizeLicenseType('trial') });
    user.licenseType = normalizeLicenseType('trial');
    user.licenseKey = generateLicenseKey('TRIAL', 12);
    user.licenseExpiresAt = expiryResult.error ? null : expiryResult.value;
    user.hasUsedTrial = true;
    await user.save();
    return user;
  } catch (err) {
    logger.warn('Could not assign trial in auth middleware', { userId: plain.id, error: err.message });
    return user;
  }
}

function legacyNumericTenantFromPayload(payload) {
  let tokenTenantId =
    payload.tenantId !== undefined && payload.tenantId !== null
      ? Number(payload.tenantId)
      : payload.tenant_id !== undefined && payload.tenant_id !== null
        ? Number(payload.tenant_id)
        : null;
  if (!Number.isFinite(tokenTenantId) && payload.tenant != null && String(payload.tenant).trim() !== '') {
    tokenTenantId = Number(payload.tenant);
  }
  if (!Number.isFinite(tokenTenantId)) tokenTenantId = null;
  return tokenTenantId;
}

/**
 * Middleware to authenticate requests using JWT
 * Attaches user object to req.user if token is valid.
 * For GET /api/user/twitch/connect, also accepts token in query (redirect flow has no Authorization header).
 *
 * Supports Dakinis platform/auth tokens (UUID `sub`, tenant slug in `tenantId`) and legacy app tokens (numeric sub).
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && req.method === 'GET' && req.query?.token) {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/user/twitch/connect') || url.startsWith('/api/youtube/connect')) {
      token = req.query.token;
    }
  }

  if (!token) {
    req.user = null;
    req.tenantId = null;
    return next();
  }

  (async () => {
    try {
      const payload = verifyStreamautomatorAccessToken(token, jwtSecret);
      const uidRaw = payload.id !== undefined ? payload.id : payload.sub;

      if (isPlatformAuthSubject(uidRaw)) {
        const tenantNumeric = await resolveTenantNumericId(payload, req);
        const email = typeof payload.email === 'string' ? payload.email : '';
        const platformRole = typeof payload.role === 'string' ? payload.role : 'user';
        const user = await loadOrProvisionStreamAutomatorUser({
          platformSub: String(uidRaw),
          email,
          platformRole,
          tenantNumericId: tenantNumeric,
        });
        if (!user || user.isDisabled) {
          if (user?.isDisabled) {
            logger.info('Blocked request from disabled user (platform auth)', { userId: user.id });
          }
          req.user = null;
          req.tenantId = null;
          return next();
        }
        await ensureTrialForOAuthUser(user);
        req.user = user.get({ plain: true });
        req.tenantId = tenantNumeric;
        return next();
      }

      let tokenTenantId = legacyNumericTenantFromPayload(payload);

      if (process.env.TRUST_GATEWAY_IDENTITY_HEADERS === 'true') {
        const h = (req.get('x-tenant-id') || '').trim();
        if (h) {
          const n = Number(h);
          if (Number.isFinite(n)) tokenTenantId = n;
        }
      }

      const userIdNum = uidRaw !== undefined && uidRaw !== null ? Number(uidRaw) : NaN;
      if (!Number.isFinite(userIdNum)) {
        req.user = null;
        req.tenantId = null;
        return next();
      }

      const user = await User.findByPk(userIdNum);
      if (!user) {
        req.user = null;
        req.tenantId = null;
        return next();
      }
      if (user.isDisabled) {
        logger.info('Blocked request from disabled user', { userId: user.id });
        req.user = null;
        req.tenantId = null;
        return next();
      }
      await ensureTrialForOAuthUser(user);
      req.user = user.get({ plain: true });
      req.tenantId = tokenTenantId;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        req.user = null;
      } else if (error.name === 'JsonWebTokenError') {
        req.user = null;
      } else {
        logger.error('authenticateToken error', {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
        req.user = null;
      }
      req.tenantId = null;
      return next();
    }
  })().catch((err) => {
    logger.error('authenticateToken async failure', { message: err.message });
    req.user = null;
    req.tenantId = null;
    next();
  });
}

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to require admin role
 * Returns 403 if user is not admin
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
