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
import {
  automationRuleCreateSchema,
  automationRuleUpdateSchema,
  parseOrThrow,
} from '@dakinis/shared-validation/stream';
import { mapToHttp } from '@dakinis/shared-error';
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
    const input = parseOrThrow(automationRuleCreateSchema, req.body || {});
    const rule = await createRule(req.user.id, input);
    res.status(201).json(rule);
  } catch (err) {
    const mapped = mapToHttp(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.patch('/rules/:id', requireAuth, async (req, res) => {
  try {
    const patch = parseOrThrow(automationRuleUpdateSchema, req.body || {});
    const rule = await updateRule(req.user.id, Number(req.params.id), patch);
    res.json(rule);
  } catch (err) {
    const mapped = mapToHttp(err);
    res.status(mapped.status).json(mapped.body);
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
