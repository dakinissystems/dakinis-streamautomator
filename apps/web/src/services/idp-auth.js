/**
 * Login contra IdP central (platform/auth) + exchange en StreamAutomator API.
 */

import { apiClient } from '../shared/api/client';

const IDP_REFRESH_KEY = 'sa_idp_refresh_token';

export function getIdpAuthUrl() {
  const raw =
    process.env.REACT_APP_DAKINIS_AUTH_URL ||
    process.env.REACT_APP_AUTH_URL ||
    '';
  return String(raw).replace(/\/$/, '');
}

export function isIdpAuthEnabled() {
  const url = getIdpAuthUrl();
  if (!url) return false;
  if (process.env.REACT_APP_USE_IDP_AUTH === 'false') return false;
  return true;
}

export function getIdpRefreshToken() {
  try {
    return localStorage.getItem(IDP_REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setIdpRefreshToken(token) {
  try {
    if (token) localStorage.setItem(IDP_REFRESH_KEY, token);
    else localStorage.removeItem(IDP_REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export async function loginViaIdp(email, password) {
  const base = getIdpAuthUrl();
  if (!base) throw new Error('REACT_APP_DAKINIS_AUTH_URL not configured');

  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'IdP login failed');
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

export async function refreshIdpToken(refreshToken) {
  const base = getIdpAuthUrl();
  const res = await fetch(`${base}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'IdP refresh failed');
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

export async function exchangePlatformToken(platformAccessToken) {
  const res = await apiClient.post(
    '/user/auth/exchange',
    {},
    { headers: { Authorization: `Bearer ${platformAccessToken}` } }
  );
  return res.data;
}
