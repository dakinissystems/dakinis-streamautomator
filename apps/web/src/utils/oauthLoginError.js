const OAUTH_LOGIN_ERROR_KEY = 'sa_oauth_login_error';
const AUTH_DEBUG_KEY = 'sa_last_auth_debug';
const MAX_AGE_MS = 10 * 60 * 1000;

export function persistOAuthLoginError(message, detail = null) {
  if (typeof sessionStorage === 'undefined' || !message) return;
  try {
    sessionStorage.setItem(
      OAUTH_LOGIN_ERROR_KEY,
      JSON.stringify({ message, detail, at: Date.now() }),
    );
    sessionStorage.setItem(
      AUTH_DEBUG_KEY,
      JSON.stringify({ message, detail, at: new Date().toISOString(), source: 'oauth' }),
    );
  } catch {
    // ignore quota errors
  }
}

export function consumeOAuthLoginError() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(OAUTH_LOGIN_ERROR_KEY);
    sessionStorage.removeItem(OAUTH_LOGIN_ERROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.message || Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function logAuthDebug(context, err) {
  const message = err?.message || err?.response?.data?.error || String(err);
  console.error(`[auth] ${context}`, err);
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      AUTH_DEBUG_KEY,
      JSON.stringify({
        context,
        message,
        at: new Date().toISOString(),
        stack: err?.stack || null,
      }),
    );
  } catch {
    // ignore
  }
}
