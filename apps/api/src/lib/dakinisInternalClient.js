/**
 * Service-to-service client for Dakinis Internal API (events, Assistant, notifications).
 */

function resolveInternalBaseUrl() {
  const explicit = String(process.env.DAKINIS_INTERNAL_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    return 'http://dakinis-internal-api.railway.internal:4083';
  }
  return 'https://api.dakinissystems.com/internal';
}

function serviceKey() {
  return String(
    process.env.DAKINIS_INTERNAL_SERVICE_KEY
      || process.env.STREAMAUTOMATOR_INTERNAL_SERVICE_KEY
      || process.env.AKOENET_INTERNAL_SERVICE_KEY
      || '',
  ).trim();
}

export function isDakinisInternalConfigured() {
  return Boolean(serviceKey());
}

/**
 * @param {string} path
 * @param {{ method?: string; body?: unknown }} [opts]
 */
export async function dakinisInternalFetch(path, opts = {}) {
  const key = serviceKey();
  if (!key) {
    const err = new Error('internal_not_configured');
    err.code = 'internal_not_configured';
    throw err;
  }

  const base = resolveInternalBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const init = {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  };
  if (opts.body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `internal_${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
