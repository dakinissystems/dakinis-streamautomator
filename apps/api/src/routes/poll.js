/**
 * Poll API – streamer controls (create, open, close, award, refund)
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pollService from '../modules/content/application/pollService.js';
import { emitPollToUser } from '../services/websocketService.js';
import logger from '../utils/logger.js';

const router = express.Router();

function emitState(userId) {
  emitPollToUser(userId, 'poll_state', pollService.getPublicState(userId));
}

/** GET /api/poll/state */
router.get('/state', requireAuth, (req, res) => {
  try {
    res.json(pollService.getAdminState(req.user.id));
  } catch (error) {
    logger.error('Poll state error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to get poll state' });
  }
});

/** POST /api/poll/create — body: { question, options[], entryCost?, prizePoints? } */
router.post('/create', requireAuth, (req, res) => {
  try {
    const state = pollService.create(req.user.id, {
      question: req.body?.question,
      options: req.body?.options,
      entryCost: req.body?.entryCost ?? req.body?.costPoints,
      prizePoints: req.body?.prizePoints ?? req.body?.prize,
    });
    emitState(req.user.id);
    res.json(state);
  } catch (error) {
    logger.warn('Poll create failed', { error: error.message, userId: req.user?.id });
    res.status(400).json({ error: error.message });
  }
});

/** POST /api/poll/open */
router.post('/open', requireAuth, (req, res) => {
  try {
    const state = pollService.open(req.user.id);
    emitState(req.user.id);
    res.json(state);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/** POST /api/poll/close */
router.post('/close', requireAuth, (req, res) => {
  try {
    const state = pollService.close(req.user.id);
    emitState(req.user.id);
    res.json(state);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/** POST /api/poll/vote — body: { username, option } (dashboard test) */
router.post('/vote', requireAuth, (req, res) => {
  try {
    const username = req.body?.username?.trim();
    const option = req.body?.option ?? req.body?.optionIndex;
    if (!username) return res.status(400).json({ error: 'username is required' });
    const result = pollService.vote(req.user.id, username, option);
    emitState(req.user.id);
    if (!result.ok) {
      return res.status(400).json({ error: result.error, ...result.state });
    }
    res.json(result.state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/poll/reset */
router.post('/reset', requireAuth, (req, res) => {
  try {
    const state = pollService.reset(req.user.id);
    emitState(req.user.id);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/poll/award — deliver prize points to winners; body: { username? } */
router.post('/award', requireAuth, (req, res) => {
  try {
    const result = pollService.awardPrizes(req.user.id, { username: req.body?.username });
    emitState(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/** POST /api/poll/refund — refund entry cost; body: { username?, losersOnly? } */
router.post('/refund', requireAuth, (req, res) => {
  try {
    const result = pollService.refundPrizes(req.user.id, {
      username: req.body?.username,
      losersOnly: Boolean(req.body?.losersOnly),
    });
    emitState(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
