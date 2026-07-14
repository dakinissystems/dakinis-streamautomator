/**
 * Dual-write + checkout cutover StreamAutomator → Dakinis unified billing (Fase 1.2).
 */

import logger from '../utils/logger.js';
import { dakinisInternalFetch, isDakinisInternalConfigured } from './dakinisInternalClient.js';
import { getPrimaryTenantIdForUser } from '../modules/tenants/application/tenantResolutionService.js';
import { generateLicenseKey } from '../utils/cryptoUtils.js';
import { resolveLicenseExpiry } from '../utils/licenseUtils.js';
import { syncEntitlementsFromLicense } from '../modules/system/application/entitlementService.js';
import { LICENSE_TYPES } from '../constants/licenseTypes.js';

/** @type {Record<string, string>} */
const LICENSE_TO_PLAN = {
  monthly: 'sa-creator-monthly',
  quarterly: 'sa-pro-monthly',
  lifetime: 'sa-lifetime',
};

/** @type {Record<string, string>} */
const PLAN_TO_LICENSE = {
  'sa-creator-monthly': LICENSE_TYPES.MONTHLY,
  'sa-pro-monthly': LICENSE_TYPES.QUARTERLY,
  'sa-lifetime': LICENSE_TYPES.LIFETIME,
};

/**
 * @param {string | null | undefined} platformUserId — JWT sub (UUID)
 */
export async function isBillingUnifiedEnabled(platformUserId) {
  if (process.env.BILLING_UNIFIED === 'true') return true;
  if (!platformUserId || !isDakinisInternalConfigured()) return false;
  try {
    const qs = new URLSearchParams({
      keys: 'billing.unified',
      userId: platformUserId,
    });
    const data = await dakinisInternalFetch(`/feature-flags/evaluate?${qs}`);
    return Boolean(data?.flags?.['billing.unified']);
  } catch (err) {
    logger.debug('billing.unified flag lookup failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * @param {string | null | undefined} licenseType
 */
export function mapLicenseTypeToBillingPlan(licenseType) {
  if (!licenseType) return null;
  return LICENSE_TO_PLAN[String(licenseType).toLowerCase()] || null;
}

/**
 * @param {string | null | undefined} planCode
 */
export function mapBillingPlanToLicenseType(planCode) {
  if (!planCode) return null;
  return PLAN_TO_LICENSE[planCode] || null;
}

async function resolveTenantId(userId) {
  try {
    return await getPrimaryTenantIdForUser(userId);
  } catch {
    return `sa:${userId}`;
  }
}

/**
 * @param {object} user
 * @param {string} licenseType
 * @param {{ successUrl?: string; cancelUrl?: string }} [urls]
 */
export async function createUnifiedBillingCheckout(user, licenseType, urls = {}) {
  if (!user?.platformAuthSub || !isDakinisInternalConfigured()) return null;
  if (!(await isBillingUnifiedEnabled(user.platformAuthSub))) return null;

  const planCode = mapLicenseTypeToBillingPlan(licenseType);
  if (!planCode) return null;

  const tenantId = await resolveTenantId(user.id);
  const frontend =
    (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  return dakinisInternalFetch('/billing/checkout', {
    method: 'POST',
    body: {
      tenantId: String(tenantId),
      userId: user.platformAuthSub,
      planId: planCode,
      email: user.email,
      productKey: 'streamautomator',
      saLicenseType: licenseType,
      saUserId: String(user.id),
      successUrl:
        urls.successUrl ||
        `${frontend}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}&unified=1`,
      cancelUrl: urls.cancelUrl || `${frontend}/settings?payment=cancelled`,
    },
  });
}

/**
 * @param {object} user
 * @param {string} [returnUrl]
 */
export async function createUnifiedBillingPortal(user, returnUrl) {
  if (!user?.platformAuthSub || !isDakinisInternalConfigured()) return null;
  if (!(await isBillingUnifiedEnabled(user.platformAuthSub))) return null;

  const frontend =
    (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  return dakinisInternalFetch('/billing/portal', {
    method: 'POST',
    body: {
      userId: user.platformAuthSub,
      returnUrl: returnUrl || `${frontend}/settings`,
    },
  });
}

/**
 * Apply central billing plan → SA User license fields.
 *
 * @param {object} user — Sequelize User
 * @param {{
 *   planCode?: string;
 *   saLicenseType?: string;
 *   stripeCustomerId?: string | null;
 *   stripeSubscriptionId?: string | null;
 *   status?: string;
 *   currentPeriodEnd?: string | Date | null;
 * }} input
 */
export async function applyBillingPlanToUser(user, input) {
  const licenseType =
    input.saLicenseType || mapBillingPlanToLicenseType(input.planCode) || null;
  if (!licenseType) {
    throw new Error('invalid_plan');
  }

  if (input.stripeCustomerId) user.stripeCustomerId = input.stripeCustomerId;
  if (input.stripeSubscriptionId) user.stripeSubscriptionId = input.stripeSubscriptionId;
  if (input.status) user.subscriptionStatus = input.status;

  const expiryResult = resolveLicenseExpiry({
    licenseType,
    expiresAt: input.currentPeriodEnd || null,
  });
  if (expiryResult.error) throw new Error(expiryResult.error);

  if (!user.licenseKey) user.licenseKey = generateLicenseKey('', 16);
  user.licenseType = licenseType;
  user.licenseExpiresAt = expiryResult.value;
  await user.save();
  await syncEntitlementsFromLicense(user.id, user.licenseType, user.licenseExpiresAt);
  return user;
}

/**
 * @param {object} user
 * @param {string} sessionId
 */
export async function verifyUnifiedCheckoutSession(user, sessionId) {
  if (!user?.platformAuthSub || !isDakinisInternalConfigured()) return null;
  if (!(await isBillingUnifiedEnabled(user.platformAuthSub))) return null;

  const sync = await dakinisInternalFetch(
    `/billing/checkout/sessions/${encodeURIComponent(sessionId)}/sync`,
    { method: 'POST' },
  );
  if (!sync?.ok) return null;

  await user.reload();
  const expectedLicense = mapBillingPlanToLicenseType(sync.plan);
  if (expectedLicense && user.licenseType === expectedLicense) {
    return {
      status: 'paid',
      unified: true,
      licenseKey: user.licenseKey,
      licenseType: user.licenseType,
      licenseExpiresAt: user.licenseExpiresAt,
    };
  }

  await applyBillingPlanToUser(user, {
    planCode: sync.plan,
    status: 'active',
  });

  return {
    status: 'paid',
    unified: true,
    licenseKey: user.licenseKey,
    licenseType: user.licenseType,
    licenseExpiresAt: user.licenseExpiresAt,
  };
}

/**
 * Push SA license state to central billing when flag or shadow sync is on.
 *
 * @param {object} user — Sequelize User (id, platformAuthSub, stripeCustomerId, stripeSubscriptionId)
 * @param {{
 *   licenseType: string,
 *   stripeCustomerId?: string | null,
 *   stripeSubscriptionId?: string | null,
 *   status?: string,
 *   currentPeriodEnd?: Date | string | null,
 * }} opts
 */
export async function syncStreamAutomatorLicenseToUnifiedBilling(user, opts) {
  if (!user?.platformAuthSub) {
    return { skipped: 'no_platform_user' };
  }
  if (!isDakinisInternalConfigured()) {
    return { skipped: 'internal_not_configured' };
  }

  const shadow = process.env.BILLING_UNIFIED_SHADOW_SYNC === 'true';
  const unified = shadow || (await isBillingUnifiedEnabled(user.platformAuthSub));
  if (!unified) {
    return { skipped: 'billing_unified_disabled' };
  }

  const planCode = mapLicenseTypeToBillingPlan(opts.licenseType);
  if (!planCode) {
    return { skipped: 'no_plan_mapping', licenseType: opts.licenseType };
  }

  const tenantId = await resolveTenantId(user.id);

  try {
    const result = await dakinisInternalFetch('/billing/subscriptions/sync', {
      method: 'POST',
      body: {
        productKey: 'streamautomator',
        tenantId: String(tenantId),
        userId: user.platformAuthSub,
        planCode,
        saLicenseType: opts.licenseType,
        stripeCustomerId: opts.stripeCustomerId || user.stripeCustomerId || null,
        stripeSubscriptionId: opts.stripeSubscriptionId || user.stripeSubscriptionId || null,
        status: opts.status || 'active',
        currentPeriodEnd: opts.currentPeriodEnd
          ? new Date(opts.currentPeriodEnd).toISOString()
          : null,
      },
    });
    logger.info('Unified billing sync OK', {
      userId: user.id,
      platformAuthSub: user.platformAuthSub,
      planCode,
    });
    return result;
  } catch (err) {
    logger.warn('Unified billing sync failed', {
      userId: user.id,
      planCode,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: err instanceof Error ? err.message : 'sync_failed' };
  }
}

/**
 * @param {object} user
 * @param {string} licenseType
 * @param {object} [body] — optional successUrl/cancelUrl from request
 */
export async function tryUnifiedBillingCheckout(user, licenseType, body = {}) {
  try {
    const session = await createUnifiedBillingCheckout(user, licenseType, {
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
    if (!session?.url) return null;
    return {
      sessionId: session.sessionId,
      url: session.url,
      unified: true,
    };
  } catch (err) {
    logger.warn('Unified billing checkout failed, falling back to SA Stripe', {
      userId: user?.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
