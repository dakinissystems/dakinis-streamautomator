import { Op } from 'sequelize';
import StreamDirectorSession from '../infrastructure/StreamDirectorSession.model.js';
import Content from '../../content/infrastructure/Content.model.js';
import { CONTENT_STATUS } from '../../../constants/contentStatus.js';
import { User } from '../../users/infrastructure/models.js';
import {
  buildDirectorStepHints,
  runDirectorStepSideEffects,
} from './directorStepActions.js';

function normalizePlatform(value, fallback = 'twitch') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value.trim().slice(0, 40) || fallback;
  if (typeof value === 'object') {
    const candidate = value.id ?? value.name ?? value.platform;
    if (candidate != null && String(candidate).trim()) {
      return String(candidate).trim().slice(0, 40);
    }
  }
  const asString = String(value).trim().slice(0, 40);
  return asString || fallback;
}

function resolveUserId(user) {
  const userId = typeof user === 'object' && user != null ? user.id : user;
  if (userId == null || userId === '') {
    const err = new Error('user_required');
    err.status = 400;
    throw err;
  }
  return userId;
}

function stepId(prefix, index) {
  return `${prefix}_${index}`;
}

function buildDefaultSteps({ title, platform, content }) {
  const now = new Date();
  const base = [
    { id: 'go_live', label: 'Iniciar directo', kind: 'stream_start', status: 'active' },
    { id: 'discord', label: 'Anunciar en Discord', kind: 'discord', status: 'pending' },
    { id: 'twitter', label: 'Publicar en X/Twitter', kind: 'social', status: 'pending' },
    { id: 'overlay', label: 'Activar overlay OBS', kind: 'obs', status: 'pending' },
    { id: 'sponsor', label: 'Recordar patrocinador', kind: 'reminder', status: 'pending' },
    { id: 'clip', label: 'Publicar clip destacado', kind: 'clip', status: 'pending' },
    { id: 'poll', label: 'Lanzar encuesta', kind: 'engagement', status: 'pending' },
    { id: 'end', label: 'Finalizar directo', kind: 'stream_end', status: 'pending' },
  ];

  if (content?.title) {
    base[0].label = `Iniciar: ${content.title.slice(0, 80)}`;
  } else if (title) {
    base[0].label = `Iniciar: ${title.slice(0, 80)}`;
  }

  return base.map((s, i) => ({
    ...s,
    dueAt: new Date(now.getTime() + i * 15 * 60 * 1000).toISOString(),
    meta: { platform: platform || content?.platforms?.[0] || 'twitch' },
  }));
}

async function findUpcomingContent(userId) {
  const now = new Date();
  return Content.findOne({
    where: {
      userId,
      contentType: { [Op.in]: ['stream', 'event'] },
      status: { [Op.in]: [CONTENT_STATUS.SCHEDULED, CONTENT_STATUS.QUEUED] },
      scheduledFor: { [Op.gte]: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    },
    order: [['scheduledFor', 'ASC']],
  });
}

export async function getActiveDirectorSession(userId) {
  return StreamDirectorSession.findOne({
    where: { userId, status: 'live' },
    order: [['startedAt', 'DESC']],
  });
}

export async function startDirectorForStream(user, opts = {}) {
  const userId = resolveUserId(user);
  const existing = await getActiveDirectorSession(userId);
  if (existing) return existing;

  let content = null;
  if (opts.contentId) {
    content = await Content.findOne({ where: { id: opts.contentId, userId } });
  } else {
    content = await findUpcomingContent(userId);
  }

  const title = opts.title || content?.title || 'Live session';
  const platform = normalizePlatform(
    opts.platform || (Array.isArray(content?.platforms) ? content.platforms[0] : null),
  );

  try {
    return await StreamDirectorSession.create({
      userId,
      contentId: content?.id || null,
      title: String(title).slice(0, 500),
      status: 'live',
      platform,
      steps: buildDefaultSteps({ title, platform, content }),
      startedAt: new Date(),
    });
  } catch (err) {
    const wrapped = new Error(err?.original?.message || err.message);
    wrapped.cause = err;
    wrapped.pgCode = err?.original?.code;
    throw wrapped;
  }
}

export async function completeDirectorStep(userId, sessionId, stepIdValue) {
  const session = await StreamDirectorSession.findOne({
    where: { id: sessionId, userId, status: 'live' },
  });
  if (!session) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }

  const steps = Array.isArray(session.steps) ? [...session.steps] : [];
  const currentStep = steps.find((s) => s.id === stepIdValue && s.status === 'active');
  if (!currentStep) {
    const err = new Error('step_not_found');
    err.status = 404;
    throw err;
  }

  const user = await User.findByPk(userId);
  const sideEffects = user
    ? await runDirectorStepSideEffects(user, currentStep, session.get({ plain: true }))
    : [];

  let found = false;
  let nextActive = false;
  const updated = steps.map((step) => {
    if (step.id === stepIdValue) {
      found = true;
      return { ...step, status: 'done', completedAt: new Date().toISOString() };
    }
    if (found && !nextActive && step.status === 'pending') {
      nextActive = true;
      return { ...step, status: 'active' };
    }
    return step;
  });

  session.steps = updated;
  await session.save();

  const plain = session.get({ plain: true });
  plain.lastStepEffects = sideEffects;
  return plain;
}

export async function endDirectorSession(userId, sessionId) {
  const session = await StreamDirectorSession.findOne({
    where: { id: sessionId, userId, status: 'live' },
  });
  if (!session) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  return finalizeDirectorSession(session);
}

async function finalizeDirectorSession(session) {
  session.status = 'completed';
  session.endedAt = new Date();
  const steps = Array.isArray(session.steps) ? session.steps : [];
  session.steps = steps.map((s) =>
    s.status === 'done' ? s : { ...s, status: s.status === 'active' ? 'skipped' : s.status },
  );
  await session.save();
  return session;
}

/** Close any live director session (e.g. stream/end webhook). */
export async function endActiveDirectorSession(userId) {
  const session = await getActiveDirectorSession(userId);
  if (!session) return null;
  return finalizeDirectorSession(session);
}

export async function getDirectorSummary(userId) {
  const session = await getActiveDirectorSession(userId);
  if (!session) return { active: false, session: null };
  const steps = Array.isArray(session.steps) ? session.steps : [];
  const activeStep = steps.find((s) => s.status === 'active') || null;
  const done = steps.filter((s) => s.status === 'done').length;

  const user = await User.findByPk(userId);
  const sessionPlain = session.get({ plain: true });
  const activeStepWithHints = activeStep
    ? {
        ...activeStep,
        hints: user ? buildDirectorStepHints(user, activeStep, sessionPlain) : [],
      }
    : null;

  return {
    active: true,
    session: {
      id: session.id,
      title: session.title,
      platform: session.platform,
      status: session.status,
      startedAt: session.startedAt,
      progress: { done, total: steps.length },
      activeStep: activeStepWithHints,
      steps: steps.map((step) =>
        step.id === activeStep?.id
          ? activeStepWithHints
          : step,
      ),
    },
  };
}
