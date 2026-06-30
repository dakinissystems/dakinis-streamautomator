const PRODUCTION_AKOENET_API_ORIGIN = 'https://api.akoenet.dakinissystems.com';

const WEBHOOK_PATH = '/integrations/scheduler/webhooks/stream-scheduled';

function isLegacyAkoenetHost(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return host.endsWith('.onrender.com') || host === 'akoenet-backend.onrender.com';
  } catch {
    return false;
  }
}

/**
 * Rewrites legacy Render AkoeNet webhook URLs to the production Railway API host (path unchanged).
 * @param {string | null | undefined} urlStr
 * @returns {string | null}
 */
export function normalizeAkoenetWebhookUrl(urlStr) {
  const raw = String(urlStr || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (isLegacyAkoenetHost(raw)) {
      const prod = new URL(PRODUCTION_AKOENET_API_ORIGIN);
      u.protocol = prod.protocol;
      u.host = prod.host;
      return u.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

export function getDefaultAkoenetSchedulerWebhookUrl() {
  const env = String(process.env.AKOENET_SCHEDULER_WEBHOOK_URL || '').trim();
  if (env) return normalizeAkoenetWebhookUrl(env);
  return `${PRODUCTION_AKOENET_API_ORIGIN}${WEBHOOK_PATH}`;
}

export { isLegacyAkoenetHost, PRODUCTION_AKOENET_API_ORIGIN, WEBHOOK_PATH };
