import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getDirectorSummary,
  startDirectorForStream,
  completeDirectorStep,
  endDirectorSession,
} from '../modules/automation/application/directorService.js';
import { handleStreamEnded } from '../services/platformIntegrationService.js';
import { User } from '../modules/users/infrastructure/models.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/active', requireAuth, async (req, res) => {
  try {
    res.json(await getDirectorSummary(req.user.id));
  } catch (err) {
    logger.error('Director active error', { error: err.message });
    res.status(500).json({ error: 'Failed to load director session' });
  }
});

router.post('/start', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const session = await startDirectorForStream(user, req.body || {});
    res.status(201).json(session);
  } catch (err) {
    logger.error('Director start error', { error: err.message });
    res.status(500).json({ error: 'Failed to start director session' });
  }
});

router.post('/:sessionId/steps/:stepId/complete', requireAuth, async (req, res) => {
  try {
    const session = await completeDirectorStep(
      req.user.id,
      Number(req.params.sessionId),
      req.params.stepId,
    );
    res.json(session);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'step_failed' });
  }
});

router.post('/:sessionId/end', requireAuth, async (req, res) => {
  try {
    const session = await endDirectorSession(req.user.id, Number(req.params.sessionId));
    const user = await User.findByPk(req.user.id);
    await handleStreamEnded(user, { title: session.title, source: 'director' });
    res.json(session);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'end_failed' });
  }
});

export default router;
