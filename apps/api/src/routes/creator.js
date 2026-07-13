import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCalendarReadiness, getContentReadiness } from '../modules/creator/application/calendarReadinessService.js';
import { suggestCopilot } from '../modules/creator/application/creatorCopilotService.js';
import { getCreatorAnalyticsSummary } from '../modules/creator/application/creatorAnalyticsService.js';
import { listCampaignKits, applyCampaignKit } from '../modules/creator/application/campaignKitService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/readiness', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    res.json(await getCalendarReadiness(req.user.id, { limit }));
  } catch (err) {
    logger.error('Creator readiness error', { error: err.message });
    res.status(500).json({ error: 'Failed to load readiness' });
  }
});

router.get('/readiness/:contentId', requireAuth, async (req, res) => {
  try {
    res.json(await getContentReadiness(req.user.id, Number(req.params.contentId)));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'readiness_failed' });
  }
});

router.post('/copilot/suggest', requireAuth, async (req, res) => {
  try {
    res.json(await suggestCopilot(req.user.id, req.body || {}));
  } catch (err) {
    logger.error('Creator copilot error', { error: err.message });
    res.status(500).json({ error: 'copilot_failed' });
  }
});

router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    res.json(await getCreatorAnalyticsSummary(req.user.id, { days }));
  } catch (err) {
    logger.error('Creator analytics error', { error: err.message });
    res.status(500).json({ error: 'analytics_failed' });
  }
});

router.get('/campaign-kits', requireAuth, (_req, res) => {
  res.json({ items: listCampaignKits() });
});

router.post('/campaign-kits/:kitId/apply', requireAuth, async (req, res) => {
  try {
    const result = await applyCampaignKit(req.user.id, req.params.kitId, req.body || {});
    res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'apply_failed' });
  }
});

export default router;
