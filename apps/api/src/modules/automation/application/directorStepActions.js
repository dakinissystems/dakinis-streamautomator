/**
 * Director step hints + side effects when completing a checklist step.
 */

import logger from '../../../utils/logger.js';
import { announceStreamStarted } from '../../../utils/discordAnnounce.js';
import { dispatchAssistantStreamEvent } from '../../../services/platformIntegrationService.js';

function frontendOrigin() {
  const raw = process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://streamautomator.com';
  if (process.env.NODE_ENV === 'production' && raw.includes('localhost')) {
    return 'https://streamautomator.com';
  }
  return raw.replace(/\/$/, '');
}

export function buildDirectorStepHints(user, step, session) {
  const hints = [];
  const title = session?.title || 'Live session';
  const platform = session?.platform || 'twitch';
  const origin = frontendOrigin();
  const overlayKey = user?.nightbotApiKey?.trim() || '';

  switch (step?.kind) {
    case 'stream_start':
      hints.push({ type: 'route', label: 'Ver calendario', path: '/schedule' });
      break;
    case 'discord':
      hints.push({ type: 'open', label: 'Abrir Discord', url: 'https://discord.com/app' });
      if (user?.discordAnnounceWebhookUrl) {
        hints.push({
          type: 'info',
          label: 'Al marcar Hecho se publicará anuncio en Discord (si está configurado)',
        });
      } else {
        hints.push({ type: 'route', label: 'Configurar webhook Discord', path: '/settings' });
      }
      break;
    case 'social':
      hints.push({
        type: 'copy',
        label: 'Copiar post para X',
        text: `🔴 En directo: ${title}\n#stream #${platform}`,
      });
      break;
    case 'obs':
      if (overlayKey) {
        const overlayUrl = `${origin}/overlay/nextstream?key=${encodeURIComponent(overlayKey)}`;
        hints.push({ type: 'copy', label: 'Copiar URL overlay OBS', text: overlayUrl });
        hints.push({ type: 'open', label: 'Vista previa overlay', url: overlayUrl });
      } else {
        hints.push({ type: 'route', label: 'Obtener API key en Ajustes', path: '/settings' });
      }
      break;
    case 'reminder':
      hints.push({
        type: 'copy',
        label: 'Recordatorio patrocinador',
        text: `Gracias a nuestros patrocinadores por apoyar el stream «${title}».`,
      });
      break;
    case 'clip':
      hints.push({ type: 'route', label: 'Subir media / clip', path: '/media' });
      break;
    case 'engagement':
      hints.push({
        type: 'copy',
        label: 'Texto encuesta sugerido',
        text: `¿Qué jugamos después? Responde en el chat — ${title}`,
      });
      break;
    case 'stream_end':
      hints.push({ type: 'info', label: 'Finaliza el directo en Twitch y marca este paso' });
      break;
    default:
      break;
  }

  return hints;
}

export async function runDirectorStepSideEffects(user, step, session) {
  if (!user || !step) return [];

  const results = [];
  const title = session?.title || 'Live session';

  try {
    if (step.kind === 'discord' && user.discordAnnounceWebhookUrl?.trim()) {
      await announceStreamStarted(user.discordAnnounceWebhookUrl.trim(), title);
      results.push({ action: 'discord.announce', ok: true });
    }
    if (step.kind === 'social') {
      await dispatchAssistantStreamEvent(user, 'stream.social.reminder', { title, platform: session?.platform });
      results.push({ action: 'akoenet.assistant', ok: true });
    }
    if (step.kind === 'stream_end') {
      await dispatchAssistantStreamEvent(user, 'stream.ended', { title, source: 'director' });
      results.push({ action: 'akoenet.stream.ended', ok: true });
    }
  } catch (err) {
    logger.warn('Director step side effect failed', { kind: step.kind, error: err.message, userId: user.id });
    results.push({ action: step.kind, error: err.message });
  }

  return results;
}
