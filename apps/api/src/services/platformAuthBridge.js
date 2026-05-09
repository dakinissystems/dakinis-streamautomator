/**
 * Bridge Dakinis platform/auth JWTs (UUID sub, tenant slug) → StreamAutomator Users + memberships.
 */

import { User, sequelize } from '../modules/users/infrastructure/models.js';
import { Tenant, Membership } from '../modules/tenants/infrastructure/models.js';
import { LICENSE_TYPES } from '../constants/licenseTypes.js';
import logger from '../utils/logger.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlatformAuthSubject(sub) {
  if (sub == null) return false;
  return UUID_RE.test(String(sub));
}

async function keyToTenantId(key) {
  if (key == null || String(key).trim() === '') return null;
  const k = String(key).trim();
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    if (/^\d+$/.test(k)) {
      const n = Number(k);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  if (/^\d+$/.test(k)) {
    const n = Number(k);
    if (!Number.isFinite(n)) return null;
    const byId = await Tenant.findByPk(n);
    return byId ? Number(byId.id) : null;
  }

  const bySlug = await Tenant.findOne({ where: { slug: k } });
  return bySlug ? Number(bySlug.id) : null;
}

/**
 * Resolve active tenant id from JWT + optional gateway X-Tenant-Id (numeric id or slug).
 */
export async function resolveTenantNumericId(payload, req) {
  if (process.env.TRUST_GATEWAY_IDENTITY_HEADERS === 'true') {
    const h = (req.get('x-tenant-id') || '').trim();
    if (h) {
      const fromHeader = await keyToTenantId(h);
      if (fromHeader != null) return fromHeader;
    }
  }

  const fromJwt = payload.tenant ?? payload.tenantId ?? payload.tenant_id;
  if (fromJwt != null && String(fromJwt).trim() !== '') {
    const tid = await keyToTenantId(String(fromJwt).trim());
    if (tid != null) return tid;
  }

  if (sequelize.getDialect() === 'postgres') {
    return keyToTenantId('default');
  }
  return null;
}

async function pickUniqueUsernameFromEmail(email) {
  const local = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 24);
  const base = local || 'user';
  let candidate = base;
  let n = 0;
  while (await User.findOne({ where: { username: candidate } })) {
    n += 1;
    candidate = `${base}${n}`.slice(0, 30);
  }
  return candidate;
}

/**
 * Find or JIT-create StreamAutomator user and membership for a platform/auth identity.
 */
export async function loadOrProvisionStreamAutomatorUser({
  platformSub,
  email,
  platformRole,
  tenantNumericId,
}) {
  const normalizedEmail = email ? String(email).toLowerCase().trim() : '';
  if (!normalizedEmail) {
    logger.warn('platform auth JWT missing email; cannot map to StreamAutomator user');
    return null;
  }

  let user = await User.findOne({ where: { platformAuthSub: platformSub } });
  if (!user) {
    user = await User.findOne({ where: { email: normalizedEmail } });
  }

  if (user?.platformAuthSub && user.platformAuthSub !== platformSub) {
    logger.warn('platform auth subject mismatch for email', {
      email: normalizedEmail,
      expectedSub: platformSub,
    });
    return null;
  }

  if (user) {
    if (!user.platformAuthSub) {
      user.platformAuthSub = platformSub;
      await user.save();
    }
  } else {
    const username = await pickUniqueUsernameFromEmail(normalizedEmail);
    user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash: null,
      licenseType: LICENSE_TYPES.NONE,
      platformAuthSub: platformSub,
    });
  }

  const wantAdmin = String(platformRole || '').toLowerCase() === 'admin';
  if (wantAdmin && !user.isAdmin) {
    user.isAdmin = true;
    await user.save();
  }

  if (tenantNumericId != null && sequelize.getDialect() === 'postgres') {
    const membershipRole = wantAdmin ? 'admin' : 'member';
    const [m, created] = await Membership.findOrCreate({
      where: { userId: user.id, tenantId: tenantNumericId },
      defaults: { role: membershipRole },
    });
    if (!created && membershipRole === 'admin' && m.role !== 'admin') {
      m.role = 'admin';
      await m.save();
    }
  }

  return user;
}
