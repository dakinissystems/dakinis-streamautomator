import { contentService } from '../../content/application/contentService.js';

const CAMPAIGN_KITS = [
  {
    id: 'game-launch',
    name: 'Lanzamiento de juego',
    description: 'Anuncio previo, directo launch day y post recap',
    items: [
      {
        offsetDays: -2,
        titleTemplate: 'En 2 días: {game}',
        contentType: 'post',
        platforms: ['twitter', 'discord'],
      },
      {
        offsetDays: 0,
        titleTemplate: '🔴 EN DIRECTO: {game}',
        contentType: 'event',
        platforms: ['twitch', 'discord'],
      },
      {
        offsetDays: 1,
        titleTemplate: 'Recap {game}',
        contentType: 'post',
        platforms: ['twitter'],
      },
    ],
  },
  {
    id: 'weekly-series',
    name: 'Serie semanal',
    description: 'Anuncio + 3 episodios + cierre de temporada',
    items: [
      {
        offsetDays: 0,
        titleTemplate: 'Nueva serie: {game}',
        contentType: 'post',
        platforms: ['twitter', 'discord'],
      },
      {
        offsetDays: 2,
        titleTemplate: 'Ep. 1 — {game}',
        contentType: 'event',
        platforms: ['twitch'],
      },
      {
        offsetDays: 9,
        titleTemplate: 'Ep. 2 — {game}',
        contentType: 'event',
        platforms: ['twitch'],
      },
      {
        offsetDays: 16,
        titleTemplate: 'Ep. 3 — {game}',
        contentType: 'event',
        platforms: ['twitch'],
      },
      {
        offsetDays: 23,
        titleTemplate: 'Fin de temporada — {game}',
        contentType: 'event',
        platforms: ['twitch', 'discord'],
      },
    ],
  },
  {
    id: 'collab-hype',
    name: 'Hype colaboración',
    description: 'Teaser, countdown y directo colab',
    items: [
      {
        offsetDays: -3,
        titleTemplate: 'Colab incoming — {game}',
        contentType: 'post',
        platforms: ['twitter'],
      },
      {
        offsetDays: -1,
        titleTemplate: 'Mañana: colab especial {game}',
        contentType: 'post',
        platforms: ['discord'],
      },
      {
        offsetDays: 0,
        titleTemplate: '🔴 COLAB EN DIRECTO: {game}',
        contentType: 'event',
        platforms: ['twitch', 'youtube'],
      },
    ],
  },
];

export function listCampaignKits() {
  return CAMPAIGN_KITS.map(({ id, name, description, items }) => ({
    id,
    name,
    description,
    itemCount: items.length,
  }));
}

export async function applyCampaignKit(userId, kitId, { game, launchDate, tenantId } = {}) {
  const kit = CAMPAIGN_KITS.find((k) => k.id === kitId);
  if (!kit) {
    const err = new Error('kit_not_found');
    err.status = 404;
    throw err;
  }

  const gameName = String(game || 'Nuevo juego').slice(0, 120);
  const base = launchDate ? new Date(launchDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(base.getTime())) {
    const err = new Error('invalid_launch_date');
    err.status = 400;
    throw err;
  }

  const created = [];
  for (const item of kit.items) {
    const scheduledFor = new Date(base.getTime() + item.offsetDays * 24 * 60 * 60 * 1000);
    const title = item.titleTemplate.replace(/\{game\}/g, gameName);
    const rows = await contentService.createContent(
      userId,
      {
        title,
        content: title,
        contentType: item.contentType,
        scheduledFor: scheduledFor.toISOString(),
        platforms: item.platforms,
      },
      { tenantId },
    );
    const first = Array.isArray(rows) ? rows[0] : rows;
    if (first) created.push(first);
  }

  return { kitId, game: gameName, launchDate: base.toISOString(), created };
}
