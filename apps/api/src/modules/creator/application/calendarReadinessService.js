import { Op } from 'sequelize';
import { Content } from '../../content/infrastructure/models.js';
import Integration from '../../integrations/infrastructure/Integration.model.js';
import User from '../../users/infrastructure/User.model.js';
import { CONTENT_STATUS } from '../../../constants/contentStatus.js';

const UPCOMING = [CONTENT_STATUS.SCHEDULED, CONTENT_STATUS.QUEUED];

function hasMediaFiles(content) {
  const files = content.files;
  if (!files) return false;
  if (Array.isArray(files?.items)) return files.items.length > 0;
  return typeof files === 'object' && Object.keys(files).length > 0;
}

function assessContent(content, user, integrations) {
  const platforms = Array.isArray(content.platforms) ? content.platforms : [];
  const checks = [];

  checks.push({
    id: 'title',
    label: 'Título definido',
    ok: Boolean(content.title?.trim()),
    required: true,
  });

  checks.push({
    id: 'description',
    label: 'Descripción / copy',
    ok: Boolean(content.content?.trim() && content.content.trim().length >= 20),
    required: false,
  });

  checks.push({
    id: 'platforms',
    label: 'Plataformas seleccionadas',
    ok: platforms.length > 0,
    required: true,
  });

  const needsMedia = platforms.some((p) => ['instagram', 'twitter'].includes(String(p).toLowerCase()));
  checks.push({
    id: 'media',
    label: 'Imagen / thumbnail',
    ok: !needsMedia || hasMediaFiles(content),
    required: needsMedia,
  });

  if (platforms.some((p) => String(p).toLowerCase() === 'discord')) {
    const hasDiscord = integrations.some((i) => i.provider === 'discord' && i.status === 'active');
    checks.push({
      id: 'discord',
      label: 'Discord conectado o canal configurado',
      ok: hasDiscord || Boolean(content.discordGuildId),
      required: true,
    });
  }

  if (platforms.some((p) => String(p).toLowerCase() === 'twitch')) {
    const hasTwitch = integrations.some((i) => i.provider === 'twitch' && i.status === 'active');
    checks.push({ id: 'twitch', label: 'Twitch conectado', ok: hasTwitch, required: true });
  }

  if (platforms.some((p) => ['twitter', 'x'].includes(String(p).toLowerCase()))) {
    const hasTwitter = integrations.some(
      (i) => ['twitter', 'x'].includes(i.provider) && i.status === 'active',
    );
    checks.push({ id: 'twitter', label: 'X/Twitter conectado', ok: hasTwitter, required: true });
  }

  checks.push({
    id: 'announce',
    label: 'Webhook anuncio Discord',
    ok: Boolean(user?.discordAnnounceWebhookUrl?.trim()),
    required: false,
  });

  const missingRequired = checks.filter((c) => c.required && !c.ok).map((c) => c.id);
  const score = checks.length ? Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) : 0;

  return {
    contentId: content.id,
    title: content.title,
    scheduledFor: content.scheduledFor,
    platforms,
    readinessScore: score,
    ready: missingRequired.length === 0,
    checks,
    missingRequired,
  };
}

export async function getCalendarReadiness(userId, { limit = 10 } = {}) {
  const now = new Date();
  const [contents, integrations, user] = await Promise.all([
    Content.findAll({
      where: {
        userId,
        contentType: { [Op.in]: ['stream', 'event'] },
        status: { [Op.in]: UPCOMING },
        scheduledFor: { [Op.gte]: now },
        deletedAt: null,
      },
      order: [['scheduledFor', 'ASC']],
      limit,
    }),
    Integration.findAll({ where: { userId }, attributes: ['provider', 'status'] }),
    User.findByPk(userId, { attributes: ['discordAnnounceWebhookUrl'] }),
  ]);

  const items = contents.map((c) => assessContent(c, user, integrations));

  return {
    items,
    summary: {
      total: items.length,
      ready: items.filter((i) => i.ready).length,
    },
  };
}

export async function getContentReadiness(userId, contentId) {
  const [content, integrations, user] = await Promise.all([
    Content.findOne({ where: { id: contentId, userId, deletedAt: null } }),
    Integration.findAll({ where: { userId }, attributes: ['provider', 'status'] }),
    User.findByPk(userId, { attributes: ['discordAnnounceWebhookUrl'] }),
  ]);
  if (!content) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  return assessContent(content, user, integrations);
}
