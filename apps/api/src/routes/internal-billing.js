import express from 'express';
import { User } from '../modules/users/infrastructure/models.js';
import {
  applyBillingPlanToUser,
  mapBillingPlanToLicenseType,
} from '../lib/billingUnifiedSync.js';
import logger from '../utils/logger.js';

const router = express.Router();

function requireInternalServiceKey(req, res, next) {
  const expected = String(
    process.env.DAKINIS_INTERNAL_SERVICE_KEY ||
      process.env.STREAMAUTOMATOR_INTERNAL_SERVICE_KEY ||
      '',
  ).trim();
  if (!expected) {
    return res.status(503).json({ error: 'internal_not_configured' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-internal-api-key'];
  if (token !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}

router.post('/license-sync', requireInternalServiceKey, async (req, res) => {
  const {
    saUserId,
    platformUserId,
    planCode,
    saLicenseType,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
    currentPeriodEnd,
  } = req.body || {};

  const licenseType = saLicenseType || mapBillingPlanToLicenseType(planCode);
  if (!licenseType) {
    return res.status(400).json({ error: 'invalid_plan', planCode });
  }

  let user = null;
  if (saUserId) {
    user = await User.findByPk(parseInt(String(saUserId), 10));
  }
  if (!user && platformUserId) {
    user = await User.findOne({ where: { platformAuthSub: platformUserId } });
  }

  if (!user) {
    return res.status(404).json({ error: 'user_not_found', saUserId, platformUserId });
  }

  try {
    await applyBillingPlanToUser(user, {
      planCode,
      saLicenseType: licenseType,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
      currentPeriodEnd,
    });

    logger.info('Internal billing license-sync applied', {
      userId: user.id,
      planCode,
      licenseType,
    });

    return res.json({
      ok: true,
      userId: user.id,
      licenseType: user.licenseType,
      licenseExpiresAt: user.licenseExpiresAt,
    });
  } catch (err) {
    logger.error('Internal billing license-sync failed', {
      error: err instanceof Error ? err.message : String(err),
      saUserId,
      platformUserId,
    });
    return res.status(500).json({
      error: 'license_sync_failed',
      message: err instanceof Error ? err.message : 'unknown',
    });
  }
});

export default router;
