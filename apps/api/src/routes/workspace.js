import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildWorkspaceWidgetPayload } from '../services/workspaceWidgetService.js';
import { fetchWorkspaceSearch, reindexAllContentForSearch } from '../lib/workspace-search.js';
import { isSearchPlatformConfigured } from '../lib/search-platform-index.js';
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

router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const scope = String(req.query.scope || 'all');
    if (q.length < 2) {
      return res.json({ hits: [], stub: true, reason: 'query_too_short' });
    }
    if (q.length > 200) {
      return res.status(400).json({ error: 'query_too_long' });
    }
    const data = await fetchWorkspaceSearch(req.user.id, q, scope);
    res.json(data);
  } catch (err) {
    logger.error('Workspace search error', { error: err.message });
    res.status(500).json({ hits: [], stub: true, error: 'search_failed' });
  }
});

/** Cron / ops: POST with header X-Cron-Secret or Bearer matching CRON_SECRET */
router.post('/search/reindex', async (req, res) => {
  const secret = String(process.env.CRON_SECRET || process.env.DAKINIS_CRON_SECRET || '').trim();
  const authHeader = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const cronHeader = String(req.headers['x-cron-secret'] || '');
  if (!secret || (authHeader !== secret && cronHeader !== secret)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!isSearchPlatformConfigured()) {
    return res.status(503).json({ error: 'search_not_configured' });
  }
  try {
    const limit = Math.min(Number(req.query.limit) || 1000, 5000);
    const result = await reindexAllContentForSearch({ limit });
    res.json({ ok: true, ...result });
  } catch (err) {
    logger.error('Workspace search reindex error', { error: err.message });
    res.status(500).json({ error: 'reindex_failed' });
  }
});

export default router;
