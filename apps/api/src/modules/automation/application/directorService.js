import { Op } from 'sequelize';
import { DirectorSession } from '@dakinis/domain/director';
import { publishDomainEvents } from '@dakinis/shared-db/outbox/domain-events';
import { OutboxPublisher } from '@dakinis/shared-db/outbox';
import StreamDirectorSession from '../infrastructure/StreamDirectorSession.model.js';
import Content from '../../content/infrastructure/Content.model.js';
import { CONTENT_STATUS } from '../../../constants/contentStatus.js';
import { User } from '../../users/infrastructure/models.js';
import {
  buildDirectorStepHints,
  runDirectorStepSideEffects,
} from './directorStepActions.js';
import {
  syncDirectorSessionToStream,
  readActiveDirectorFromStream,
} from '../../../lib/directorStreamSync.js';
import { isPlatformPgConfigured, platformQuery } from '../../../lib/platformDb.js';
import logger from '../../../utils/logger.js';

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
  const fromStream = await readActiveDirectorFromStream(userId);
  if (fromStream) return fromStream;

  return StreamDirectorSession.findOne({
    where: {
      userId,
      status: { [Op.in]: ['live', 'preparing', 'ready', 'post'] },
    },
    order: [['startedAt', 'DESC']],
  });
}

/**
 * Advance domain SM draft→preparing→ready→live (product still starts “live”).
 * @param {{ userId: string|number; sessionId?: string }} opts
 */
function buildLiveDirectorAggregate(opts) {
  const domain = DirectorSession.create({
    id: opts.sessionId || crypto.randomUUID(),
    userId: opts.userId != null ? String(opts.userId) : null,
  });
  domain.prepare();
  domain.ready();
  domain.start();
  return domain;
}

async function publishDirectorDomainEvents(domain, legacyUserId, sessionId) {
  if (!isPlatformPgConfigured()) return;
  try {
    const id = String(sessionId || domain.id);
    const events = domain.pullDomainEvents().map((event) => ({
      ...event,
      aggregateId: id,
      payload: {
        ...event.payload,
        legacyUserId,
        sessionId: id,
      },
    }));
    if (!events.length) return;
    const publisher = new OutboxPublisher(platformQuery);
    await publishDomainEvents(publisher, events);
  } catch (err) {
    logger.debug('director domain outbox skipped', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
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
    const domain = buildLiveDirectorAggregate({ userId });
    const session = await StreamDirectorSession.create({
      userId,
      contentId: content?.id || null,
      title: String(title).slice(0, 500),
      status: domain.status,
      platform,
      steps: buildDefaultSteps({ title, platform, content }),
      startedAt: new Date(),
    });
    await publishDirectorDomainEvents(domain, userId, session.id);
    await syncDirectorSessionToStream(session, 'stream.director.started');
    return session;
  } catch (err) {
    const wrapped = new Error(err?.original?.message || err.message);
    wrapped.cause = err;
    wrapped.pgCode = err?.original?.code;
    throw wrapped;
  }
}

export async function completeDirectorStep(userId, sessionId, stepIdValue) {
  const session = await StreamDirectorSession.findOne({
    where: {
      id: sessionId,
      userId,
      status: { [Op.in]: ['live', 'preparing', 'ready', 'post'] },
    },
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
  await syncDirectorSessionToStream(session, 'stream.director.step_completed');

  const plain = session.get({ plain: true });
  plain.lastStepEffects = sideEffects;
  return plain;
}

export async function endDirectorSession(userId, sessionId) {
  const session = await StreamDirectorSession.findOne({
    where: {
      id: sessionId,
      userId,
      status: { [Op.in]: ['live', 'preparing', 'ready', 'post'] },
    },
  });
  if (!session) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  return finalizeDirectorSession(session);
}

async function finalizeDirectorSession(session) {
  const domain = DirectorSession.reconstitute({
    id: String(session.id),
    userId: session.userId != null ? String(session.userId) : null,
    status: session.status || 'live',
  });

  try {
    if (domain.status === 'draft') {
      domain.prepare();
      domain.ready();
      domain.start();
    } else if (domain.status === 'preparing') {
      domain.ready();
      domain.start();
    } else if (domain.status === 'ready') {
      domain.start();
    }
    if (domain.status === 'live') domain.end();
    if (domain.status === 'post') domain.complete();
  } catch (err) {
    logger.warn('director finalize SM transition', {
      sessionId: session.id,
      status: session.status,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  session.status = 'completed';
  session.endedAt = new Date();
  const steps = Array.isArray(session.steps) ? session.steps : [];
  session.steps = steps.map((s) =>
    s.status === 'done' ? s : { ...s, status: s.status === 'active' ? 'skipped' : s.status },
  );
  await session.save();
  await publishDirectorDomainEvents(domain, session.userId, session.id);
  await syncDirectorSessionToStream(session, 'stream.director.ended');
  return session;
}

/** Close any live director session (e.g. stream/end webhook). */
export async function endActiveDirectorSession(userId) {
  const session = await getActiveDirectorSession(userId);
  if (!session) return null;
  return finalizeDirectorSession(session);
}

function sessionToPlain(session) {
  if (!session) return null;
  return typeof session.get === 'function' ? session.get({ plain: true }) : session;
}

export async function getDirectorSummary(userId) {
  const session = await getActiveDirectorSession(userId);
  if (!session) return { active: false, session: null };
  const steps = Array.isArray(session.steps) ? session.steps : [];
  const activeStep = steps.find((s) => s.status === 'active') || null;
  const done = steps.filter((s) => s.status === 'done').length;

  const user = await User.findByPk(userId);
  const sessionPlain = sessionToPlain(session);
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
