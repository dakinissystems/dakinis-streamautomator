const PRODUCTION_AKOENET_API_ORIGIN = 'https://api.akoenet.dakinissystems.com';

const WEBHOOK_PATH = '/integrations/scheduler/webhooks/stream-scheduled';

export function isLegacyAkoenetHost(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return host.endsWith('.onrender.com');
  } catch {
    return false;
  }
}

export function normalizeAkoenetWebhookUrl(urlStr) {
  const raw = String(urlStr || '').trim();
  if (!raw) return '';
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
  const env = String(process.env.REACT_APP_AKOENET_SCHEDULER_WEBHOOK_URL || '').trim();
  if (env) return normalizeAkoenetWebhookUrl(env);
  return `${PRODUCTION_AKOENET_API_ORIGIN}${WEBHOOK_PATH}`;
}
