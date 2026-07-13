import { Op } from 'sequelize';
import { StreamTimelineEvent } from '../../content/infrastructure/models.js';
import { PublicationMetric } from '../../system/infrastructure/models.js';

export async function getStreamHeatmap(userId, { days = 90 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await StreamTimelineEvent.findAll({
    where: { userId, createdAt: { [Op.gte]: since } },
    attributes: ['type', 'createdAt'],
  });

  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  const byType = {};

  for (const event of events) {
    const d = new Date(event.createdAt);
    if (!Number.isNaN(d.getTime())) {
      heatmap[d.getDay()][d.getHours()] += 1;
    }
    byType[event.type] = (byType[event.type] || 0) + 1;
  }

  return { days, heatmap, totalEvents: events.length, byType };
}

export async function getPublicationAnalytics(userId, { days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const metrics = await PublicationMetric.findAll({
    where: { userId, completedAt: { [Op.gte]: since } },
    attributes: ['platform', 'success', 'durationMs'],
  });

  const byPlatform = {};
  for (const metric of metrics) {
    const platform = metric.platform || 'unknown';
    if (!byPlatform[platform]) {
      byPlatform[platform] = { total: 0, success: 0, totalDurationMs: 0 };
    }
    byPlatform[platform].total += 1;
    if (metric.success) byPlatform[platform].success += 1;
    byPlatform[platform].totalDurationMs += metric.durationMs || 0;
  }

  return {
    days,
    totalJobs: metrics.length,
    byPlatform: Object.entries(byPlatform).map(([platform, stats]) => ({
      platform,
      total: stats.total,
      success: stats.success,
      successRate: stats.total ? Math.round((stats.success / stats.total) * 100) : 0,
      avgDurationMs: stats.total ? Math.round(stats.totalDurationMs / stats.total) : 0,
    })),
  };
}

export async function getCreatorAnalyticsSummary(userId, opts = {}) {
  const [heatmap, publications] = await Promise.all([
    getStreamHeatmap(userId, opts),
    getPublicationAnalytics(userId, opts),
  ]);
  return { heatmap, publications };
}
