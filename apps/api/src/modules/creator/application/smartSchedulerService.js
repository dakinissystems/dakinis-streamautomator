import { Op } from 'sequelize';
import { Content } from '../../content/infrastructure/models.js';
import { CONTENT_STATUS } from '../../../constants/contentStatus.js';
import { getStreamHeatmap } from './creatorAnalyticsService.js';

const DEFAULT_SLOTS = [
  { day: 2, hour: 21, label: 'Martes 21:00' },
  { day: 4, hour: 21, label: 'Jueves 21:00' },
  { day: 6, hour: 18, label: 'Sábado 18:00' },
];

function nextOccurrence(dayOfWeek, hour, from = new Date()) {
  const candidate = new Date(from);
  candidate.setHours(hour, 0, 0, 0);
  const delta = (dayOfWeek - candidate.getDay() + 7) % 7;
  candidate.setDate(candidate.getDate() + (delta === 0 && candidate <= from ? 7 : delta));
  if (delta === 0 && candidate <= from) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

function heatmapTopSlots(heatmap, limit = 3) {
  if (!Array.isArray(heatmap)) return [];
  const cells = [];
  for (let day = 0; day < heatmap.length; day += 1) {
    for (let hour = 0; hour < (heatmap[day]?.length || 0); hour += 1) {
      const count = heatmap[day][hour] || 0;
      if (count > 0) cells.push({ day, hour, count });
    }
  }
  cells.sort((a, b) => b.count - a.count);
  return cells.slice(0, limit);
}

export async function suggestSmartSchedule(userId, { days = 14 } = {}) {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const scheduled = await Content.findAll({
    where: {
      userId,
      contentType: { [Op.in]: ['stream', 'event'] },
      status: { [Op.in]: [CONTENT_STATUS.SCHEDULED, CONTENT_STATUS.QUEUED] },
      scheduledFor: { [Op.gte]: now, [Op.lte]: horizon },
    },
    attributes: ['scheduledFor'],
    order: [['scheduledFor', 'ASC']],
  });

  const heatmap = await getStreamHeatmap(userId, { days: 90 });
  const topCells = heatmapTopSlots(heatmap.heatmap);
  const slotDefs =
    topCells.length > 0
      ? topCells.map((c) => ({ day: c.day, hour: c.hour, label: null, reason: 'historial_actividad' }))
      : DEFAULT_SLOTS.map((s) => ({ ...s, reason: 'horario_recomendado' }));

  const suggestions = [];
  for (const slot of slotDefs) {
    const at = nextOccurrence(slot.day, slot.hour, now);
    if (at > horizon) continue;

    const conflict = scheduled.some((row) => {
      const diff = Math.abs(new Date(row.scheduledFor).getTime() - at.getTime());
      return diff < 2 * 60 * 60 * 1000;
    });
    if (conflict) continue;

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    suggestions.push({
      scheduledFor: at.toISOString(),
      platform: 'twitch',
      contentType: 'stream',
      title: 'Stream en directo',
      reason:
        slot.reason === 'historial_actividad'
          ? `Basado en tu actividad (${dayNames[slot.day]} ${slot.hour}:00)`
          : `Horario prime sugerido (${dayNames[slot.day]} ${slot.hour}:00)`,
    });
    if (suggestions.length >= 3) break;
  }

  return {
    suggestions,
    scheduledCount: scheduled.length,
    source: topCells.length > 0 ? 'heatmap' : 'defaults',
  };
}
