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
import { mapSequelizeRouteError, sequelizeErrorMessage } from '../utils/sequelizeErrors.js';

const router = express.Router();

router.get('/active', requireAuth, async (req, res) => {
  try {
    res.json(await getDirectorSummary(req.user.id));
  } catch (err) {
    logger.error('Director active error', {
      error: sequelizeErrorMessage(err),
      userId: req.user?.id,
    });
    const mapped = mapSequelizeRouteError(err, {
      defaultMessage: 'Failed to load director session',
      schemaMessage: 'Database schema out of date — run npm run migrate on the API or apply Supabase migration 037',
    });
    res.status(mapped.status).json(mapped.body);
  }
});

router.post('/start', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'user_not_found' });
    }
    const session = await startDirectorForStream(user, req.body || {});
    res.status(201).json(session);
  } catch (err) {
    logger.error('Director start error', {
      error: sequelizeErrorMessage(err),
      pgCode: err?.pgCode || err?.cause?.original?.code,
      userId: req.user?.id,
    });
    const mapped = mapSequelizeRouteError(err, {
      defaultMessage: 'Failed to start director session',
      schemaMessage: 'Database schema out of date — run npm run migrate on the API or apply Supabase migration 037',
    });
    res.status(mapped.status).json(mapped.body);
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
