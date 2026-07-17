import { getPlatform, isDakinisInternalConfigured } from '../../../lib/dakinis-platform.js';
import { Content } from '../../content/infrastructure/models.js';

const LOCAL_SUGGESTIONS = {
  title: [
    'Stream chill + chat con la comunidad',
    'Nuevo juego en directo — primera impresión',
    'Colab especial con viewers',
  ],
  description: [
    'Hoy stream relajado. Preguntad lo que queráis en chat y decidimos juntos el plan.',
    'Probamos algo nuevo en directo. Recordad seguir para no perderos los próximos streams.',
    'Directo especial: retos, votaciones y sorpresas para la comunidad.',
  ],
  hashtags: ['#live #streaming #gaming #twitch', '#directo #comunidad #streamer'],
};

export async function suggestCopilot(userId, { type = 'title', contentId, prompt } = {}) {
  const normalizedType = ['title', 'description', 'hashtags'].includes(type) ? type : 'title';
  let contextBlock = '';

  if (contentId) {
    const content = await Content.findOne({ where: { id: contentId, userId } });
    if (content) {
      contextBlock = [
        `Title: ${content.title}`,
        `Type: ${content.contentType}`,
        `Platforms: ${(content.platforms || []).join(', ')}`,
        `Copy: ${(content.content || '').slice(0, 500)}`,
      ].join('\n');
    }
  }

  const query =
    prompt?.trim()
    || `Suggest a ${normalizedType} for a live stream creator.${contextBlock ? `\nContext:\n${contextBlock}` : ''}`;

  if (isDakinisInternalConfigured()) {
    try {
      const platform = getPlatform();
      const result = await platform.knowledge.query({
        query,
        context: { product: 'streamautomator', type: normalizedType, userId },
      });
      const answer = result?.answer || result?.text || result?.results?.[0]?.text;
      if (answer) {
        return { source: 'platform', type: normalizedType, suggestions: [String(answer).slice(0, 2000)] };
      }
    } catch {
      // fall through to local suggestions
    }
  }

  return {
    source: 'local',
    type: normalizedType,
    suggestions: LOCAL_SUGGESTIONS[normalizedType] || LOCAL_SUGGESTIONS.title,
  };
}
