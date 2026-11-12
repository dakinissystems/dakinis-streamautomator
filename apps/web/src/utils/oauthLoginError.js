const OAUTH_LOGIN_ERROR_KEY = 'sa_oauth_login_error';
const MAX_AGE_MS = 10 * 60 * 1000;

export function persistOAuthLoginError() {
  // The login page reads the error code from the URL. Do not store the
  // OAuth message, detail, or token material in sessionStorage.
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

export function logAuthDebug(context) {
  console.error(`[auth] ${context}`);
}
