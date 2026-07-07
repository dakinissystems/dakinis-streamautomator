import { devCatchLog, devCatchLogThrottled } from './devCatchLog';

export const AUTH_TOKEN_KEY = 'auth_token:v1';
export const AUTH_USER_KEY = 'auth_user:v1';
const LEGACY_AUTH_TOKEN_KEY = 'auth_token';
const LEGACY_AUTH_USER_KEY = 'auth_user';

function migrateLegacyAuthKeys() {
  try {
    if (!localStorage.getItem(AUTH_TOKEN_KEY) && localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)) {
      localStorage.setItem(AUTH_TOKEN_KEY, localStorage.getItem(LEGACY_AUTH_TOKEN_KEY));
      localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    }
    if (!localStorage.getItem(AUTH_USER_KEY) && localStorage.getItem(LEGACY_AUTH_USER_KEY)) {
      localStorage.setItem(AUTH_USER_KEY, localStorage.getItem(LEGACY_AUTH_USER_KEY));
      localStorage.removeItem(LEGACY_AUTH_USER_KEY);
    }
  } catch (error) {
    devCatchLog('auth.migrateLegacyAuthKeys', error);
  }
}

migrateLegacyAuthKeys();

export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return exp < (now + 60);
  } catch (error) {
    devCatchLogThrottled('auth.isTokenExpired', error, 60_000);
    return true;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_USER_KEY);
}

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch (error) {
    devCatchLog('auth.getStoredAuth', error);
    return { token: null, user: null };
  }
}

export function persistAuthUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function persistAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}
