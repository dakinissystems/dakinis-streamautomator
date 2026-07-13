import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  seedDefaultRules,
  getAutomationCatalog,
} from '../modules/automation/application/automationService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/catalog', requireAuth, (_req, res) => {
  res.json(getAutomationCatalog());
});

router.get('/rules', requireAuth, async (req, res) => {
  try {
    const items = await listRules(req.user.id);
    res.json({ items });
  } catch (err) {
    logger.error('Automation list error', { error: err.message });
    res.status(500).json({ error: 'Failed to load automation rules' });
  }
});

router.post('/rules', requireAuth, async (req, res) => {
  try {
    const rule = await createRule(req.user.id, req.body || {});
    res.status(201).json(rule);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'create_failed' });
  }
});

router.patch('/rules/:id', requireAuth, async (req, res) => {
  try {
    const rule = await updateRule(req.user.id, Number(req.params.id), req.body || {});
    res.json(rule);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'update_failed' });
  }
});

router.delete('/rules/:id', requireAuth, async (req, res) => {
  try {
    await deleteRule(req.user.id, Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'delete_failed' });
  }
});

router.post('/rules/seed-defaults', requireAuth, async (req, res) => {
  try {
    const result = await seedDefaultRules(req.user.id);
    res.json(result);
  } catch (err) {
    logger.error('Automation seed error', { error: err.message });
    res.status(500).json({ error: 'seed_failed' });
  }
});

export default router;
