import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildWorkspaceWidgetPayload } from '../services/workspaceWidgetService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/** Data contract for Hub / Workspace widgets (stream-deck, obs-companion). */
router.get('/widgets', requireAuth, async (req, res) => {
  try {
    res.json(await buildWorkspaceWidgetPayload(req.user.id));
  } catch (err) {
    logger.error('Workspace widgets error', { error: err.message });
    res.status(500).json({ error: 'Failed to load workspace widgets' });
  }
});

export default router;
