/**
 * Poll service — in-memory poll per streamer with points + prize award/refund.
 * Viewers vote via bot webhook; overlay shows live tallies; streamer settles prizes.
 */

import crypto from 'crypto';
import logger from '../../../utils/logger.js';

/** @typedef {'draft'|'open'|'closed'} PollStatus */
/** @typedef {'pending'|'awarded'|'refunded'} PrizeStatus */

const pollsByUser = new Map();

/** Safe voter key (chat username); rejects prototype pollution keys. */
function normalizeVoterKey(username) {
  const key = String(username || '').trim().toLowerCase();
  if (!key || key.length > 64) return null;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return null;
  return key;
}

function emptyPoll(userId) {
  return {
    id: null,
    userId,
    question: '',
    options: [],
    /** Points charged / shown as stake to vote */
    entryCost: 0,
    /** Points delivered to each voter of the winning option */
    prizePoints: 0,
    status: /** @type {PollStatus} */ ('draft'),
    /** @type {Map<string, { optionIndex: number, username: string, prizeStatus: PrizeStatus }>} */
    votes: new Map(),
    winningOptionIndex: null,
    closedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function getPoll(userId) {
  if (!pollsByUser.has(userId)) {
    pollsByUser.set(userId, emptyPoll(userId));
  }
  return pollsByUser.get(userId);
}

function optionCounts(poll) {
  const counts = poll.options.map(() => 0);
  for (const v of poll.votes.values()) {
    if (v.optionIndex >= 0 && v.optionIndex < counts.length) counts[v.optionIndex] += 1;
  }
  return counts;
}

function totalVotes(poll) {
  return poll.votes.size;
}

export function getPublicState(userId) {
  const poll = getPoll(userId);
  const counts = optionCounts(poll);
  const total = totalVotes(poll);
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map((label, i) => ({
      index: i,
      label,
      votes: counts[i],
      pct: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
    })),
    entryCost: poll.entryCost,
    prizePoints: poll.prizePoints,
    status: poll.status,
    totalVotes: total,
    winningOptionIndex: poll.winningOptionIndex,
    closedAt: poll.closedAt,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };
}

export function getAdminState(userId) {
  const poll = getPoll(userId);
  const publicState = getPublicState(userId);
  const votes = [...poll.votes.values()].map((v) => ({
    username: v.username,
    optionIndex: v.optionIndex,
    optionLabel: poll.options[v.optionIndex] || '',
    prizeStatus: v.prizeStatus,
  }));
  const winners =
    poll.winningOptionIndex == null
      ? []
      : votes.filter((v) => v.optionIndex === poll.winningOptionIndex);
  return {
    ...publicState,
    votes,
    winners,
    pendingAwards: winners.filter((w) => w.prizeStatus === 'pending').length,
    pendingRefunds: votes.filter((v) => v.prizeStatus === 'pending').length,
  };
}

/**
 * Create / replace poll (draft). Call open() to accept votes.
 */
export function create(userId, { question, options, entryCost = 0, prizePoints = 0 }) {
  const q = String(question || '').trim();
  const opts = (Array.isArray(options) ? options : [])
    .map((o) => String(o || '').trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!q) throw new Error('question is required');
  if (opts.length < 2) throw new Error('At least 2 options are required');

  const cost = Math.max(0, Math.floor(Number(entryCost) || 0));
  const prize = Math.max(0, Math.floor(Number(prizePoints) || 0));
  const now = new Date().toISOString();
  const poll = {
    id: `poll_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    question: q,
    options: opts,
    entryCost: cost,
    prizePoints: prize,
    status: 'draft',
    votes: new Map(),
    winningOptionIndex: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  pollsByUser.set(userId, poll);
  logger.info('Poll created', { userId, pollId: poll.id, options: opts.length, entryCost: cost, prizePoints: prize });
  return getAdminState(userId);
}

export function open(userId) {
  const poll = getPoll(userId);
  if (!poll.id) throw new Error('No poll to open. Create one first.');
  if (poll.status === 'open') return getAdminState(userId);
  if (poll.status === 'closed') throw new Error('Poll already closed. Create a new poll.');
  poll.status = 'open';
  poll.updatedAt = new Date().toISOString();
  return getAdminState(userId);
}

/**
 * Close poll and pick winning option (most votes; tie → first max index).
 */
export function close(userId) {
  const poll = getPoll(userId);
  if (!poll.id) throw new Error('No poll to close');
  if (poll.status !== 'open' && poll.status !== 'draft') {
    return getAdminState(userId);
  }
  const counts = optionCounts(poll);
  let winning = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] > counts[winning]) winning = i;
  }
  poll.winningOptionIndex = counts.every((c) => c === 0) ? null : winning;
  poll.status = 'closed';
  poll.closedAt = new Date().toISOString();
  poll.updatedAt = poll.closedAt;
  logger.info('Poll closed', { userId, pollId: poll.id, winningOptionIndex: poll.winningOptionIndex });
  return getAdminState(userId);
}

/**
 * Vote by option index (0-based) or option label / 1-based number from chat.
 */
export function vote(userId, username, optionRaw) {
  const poll = getPoll(userId);
  if (!poll.id || poll.status !== 'open') {
    return { ok: false, error: 'poll_not_open', state: getPublicState(userId) };
  }
  const name = String(username || '').trim();
  const key = normalizeVoterKey(name);
  if (!key) return { ok: false, error: 'username_required', state: getPublicState(userId) };

  if (poll.votes.has(key)) {
    return { ok: false, error: 'already_voted', state: getPublicState(userId) };
  }

  let optionIndex = -1;
  if (typeof optionRaw === 'number' && Number.isFinite(optionRaw)) {
    optionIndex = Math.floor(optionRaw);
  } else {
    const raw = String(optionRaw || '').trim();
    const asNum = Number(raw);
    if (Number.isFinite(asNum) && String(asNum) === raw) {
      // Chat often uses 1-based: !vote 1
      optionIndex = asNum >= 1 && asNum <= poll.options.length ? asNum - 1 : asNum;
    } else {
      optionIndex = poll.options.findIndex((o) => o.toLowerCase() === raw.toLowerCase());
    }
  }

  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { ok: false, error: 'invalid_option', state: getPublicState(userId) };
  }

  // Map avoids remote property injection on dynamic object keys
  poll.votes.set(key, {
    username: name,
    optionIndex,
    prizeStatus: 'pending',
  });
  poll.updatedAt = new Date().toISOString();
  logger.debug('Poll vote', { userId, username: name, optionIndex });
  return { ok: true, state: getPublicState(userId) };
}

export function reset(userId) {
  pollsByUser.set(userId, emptyPoll(userId));
  logger.debug('Poll reset', { userId });
  return getAdminState(userId);
}

function buildPointsCommands(action, rows, points) {
  if (!points || points <= 0) return [];
  const cmd = action === 'add' ? 'add' : 'remove';
  return rows.map((r) => `!points ${cmd} ${r.username} ${points}`);
}

/**
 * Deliver prizes to winning-option voters still pending.
 * Returns Nightbot-style commands for the streamer/bot to run.
 */
export function awardPrizes(userId, { username } = {}) {
  const poll = getPoll(userId);
  if (!poll.id || poll.status !== 'closed') {
    throw new Error('Close the poll before awarding prizes');
  }
  if (poll.winningOptionIndex == null) {
    throw new Error('No winning option (no votes)');
  }
  if (poll.prizePoints <= 0) {
    throw new Error('prizePoints is 0 — set prize points when creating the poll');
  }

  const target = username ? normalizeVoterKey(username) : null;
  const awarded = [];
  for (const [key, v] of poll.votes.entries()) {
    if (v.optionIndex !== poll.winningOptionIndex) continue;
    if (v.prizeStatus !== 'pending') continue;
    if (target && key !== target) continue;
    v.prizeStatus = 'awarded';
    awarded.push({ username: v.username, points: poll.prizePoints });
  }
  poll.updatedAt = new Date().toISOString();
  const commands = buildPointsCommands('add', awarded, poll.prizePoints);
  logger.info('Poll prizes awarded', { userId, count: awarded.length, prizePoints: poll.prizePoints });
  return { awarded, commands, state: getAdminState(userId) };
}

/**
 * Refund entry cost to voters still pending (all, losers only, or one user).
 * @param {{ username?: string, losersOnly?: boolean }} opts
 */
export function refundPrizes(userId, { username, losersOnly = false } = {}) {
  const poll = getPoll(userId);
  if (!poll.id) throw new Error('No poll');
  if (poll.entryCost <= 0) {
    throw new Error('entryCost is 0 — nothing to refund');
  }

  const target = username ? normalizeVoterKey(username) : null;
  const refunded = [];
  for (const [key, v] of poll.votes.entries()) {
    if (v.prizeStatus !== 'pending') continue;
    if (target && key !== target) continue;
    if (losersOnly && poll.winningOptionIndex != null && v.optionIndex === poll.winningOptionIndex) {
      continue;
    }
    v.prizeStatus = 'refunded';
    refunded.push({ username: v.username, points: poll.entryCost });
  }
  poll.updatedAt = new Date().toISOString();
  // Refund = give points back (add), since entry was charged by bot at vote time.
  const commands = buildPointsCommands('add', refunded, poll.entryCost);
  logger.info('Poll entry refunds', { userId, count: refunded.length, entryCost: poll.entryCost });
  return { refunded, commands, state: getAdminState(userId) };
}

export default {
  getPublicState,
  getAdminState,
  create,
  open,
  close,
  vote,
  reset,
  awardPrizes,
  refundPrizes,
};
