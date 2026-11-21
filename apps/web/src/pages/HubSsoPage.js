import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiBasePath } from '../shared/config/apiOrigin.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useExternalPoll } from '../hooks/useExternalPoll';

/** A3: Hub launches with a one-time code in the query, not a JWT in the hash. */
const SSO_CODE_PARAM = 'dakinis_sso_code';
const HASH_TOKEN_KEY = 'platform_token';
const ALLOWED_RETURN_PATHS = new Set([
  '/dashboard',
  '/schedule',
  '/settings',
  '/media',
  '/messages',
  '/profile',
  '/templates',
  '/admin',
]);

function dakinisAuthBaseUrl() {
  const fromEnv = String(
    process.env.REACT_APP_DAKINIS_AUTH_URL || process.env.REACT_APP_AUTH_URL || ''
  )
    .trim()
    .replace(/\/$/, '');
  if (fromEnv) return fromEnv.endsWith('/auth') ? fromEnv : `${fromEnv}/auth`;
  return 'https://auth.dakinissystems.com/auth';
}

function readLegacyHashToken() {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  if (!hash) return '';
  return new URLSearchParams(hash).get(HASH_TOKEN_KEY) || '';
}

function safeReturnPath(raw) {
  const path = String(raw || '').trim();
  if (!path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  if (path.startsWith('/auth/hub-sso')) return '/dashboard';
  if (!ALLOWED_RETURN_PATHS.has(path) && !path.startsWith('/dashboard')) return '/dashboard';
  return path;
}

function clearSsoArtifactsFromUrl() {
  if (typeof window === 'undefined' || !window.history.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete(SSO_CODE_PARAM);
  url.hash = '';
  window.history.replaceState(null, '', url.pathname + url.search);
}

/**
 * Resolve IdP access token: prefer A3 handoff code, fall back to legacy hash JWT.
 * @param {string} handoffCode
 * @param {string} legacyToken
 */
async function resolvePlatformToken(handoffCode, legacyToken) {
  if (handoffCode) {
    const res = await fetch(`${dakinisAuthBaseUrl()}/sso/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: handoffCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'SSO handoff consume failed');
    }
    const token = String(data.accessToken || data.token || '').trim();
    if (!token) throw new Error('Auth did not return an access token');
    return token;
  }
  if (legacyToken) return legacyToken;
  return '';
}

export default function HubSsoPage({ setAuth }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handoffCode = String(searchParams.get(SSO_CODE_PARAM) || '').trim();
  const legacyToken = readLegacyHashToken();
  const hasCredential = Boolean(handoffCode || legacyToken);
  const handledRef = useRef(false);
  const navigateRef = useRef(navigate);
  const setAuthRef = useRef(setAuth);
  navigateRef.current = navigate;
  setAuthRef.current = setAuth;
  const missingTokenMessage =
    t('login.hubSsoMissingToken') || 'No session code received from Dakinis Hub.';

  const returnPath = safeReturnPath(searchParams.get('return_url'));
  const pollKey = handoffCode
    ? `hub-sso-code-${handoffCode.slice(0, 12)}`
    : legacyToken
      ? `hub-sso-legacy-${legacyToken.slice(0, 12)}`
      : 'hub-sso-idle';

  const poll = useExternalPoll(
    pollKey,
    async () => {
      if (!hasCredential) return null;
      const platformToken = await resolvePlatformToken(handoffCode, legacyToken);
      const res = await fetch(`${getApiBasePath()}/auth/hub-sso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        body: JSON.stringify({ platformToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Hub SSO failed');
      }
      if (!handledRef.current) {
        handledRef.current = true;
        setAuthRef.current(data.user, data.token);
        clearSsoArtifactsFromUrl();
        queueMicrotask(() => navigateRef.current(returnPath, { replace: true }));
      }
      return { user: data.user, token: data.token, returnPath };
    },
    0
  );

  const error = !hasCredential
    ? missingTokenMessage
    : poll.status === 'error'
      ? poll.error instanceof Error
        ? poll.error.message
        : 'Hub SSO failed'
      : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              type="button"
              className="btn btn-primary dakinis-btn dakinis-btn--primary"
              onClick={() => navigate('/login', { replace: true })}
            >
              {t('login.title') || 'Login'}
            </button>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {t('login.hubSsoLoading') || 'Signing in with your Dakinis account…'}
          </p>
        )}
      </div>
    </div>
  );
}
