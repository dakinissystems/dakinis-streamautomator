import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiBasePath } from '../shared/config/apiOrigin.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useExternalPoll } from '../hooks/useExternalPoll';

const HASH_TOKEN_KEY = 'platform_token';
const ALLOWED_RETURN_PATHS = new Set(['/dashboard', '/schedule', '/settings', '/media', '/messages', '/profile', '/templates', '/admin']);

function readPlatformToken() {
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

export default function HubSsoPage({ setAuth }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platformToken = readPlatformToken();
  const handledRef = useRef(false);
  const navigateRef = useRef(navigate);
  const setAuthRef = useRef(setAuth);
  navigateRef.current = navigate;
  setAuthRef.current = setAuth;
  const missingTokenMessage = t('login.hubSsoMissingToken') || 'No session token received from Dakinis Hub.';

  const returnPath = safeReturnPath(searchParams.get('return_url'));
  const poll = useExternalPoll(
    platformToken ? `hub-sso-${platformToken}` : 'hub-sso-idle',
    async () => {
      if (!platformToken) return null;
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
        if (typeof window !== 'undefined' && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        queueMicrotask(() => navigateRef.current(returnPath, { replace: true }));
      }
      return { user: data.user, token: data.token, returnPath };
    },
    0
  );

  const error = !platformToken
    ? missingTokenMessage
    : poll.status === 'error'
      ? (poll.error instanceof Error ? poll.error.message : 'Hub SSO failed')
      : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button type="button" className="btn btn-primary dakinis-btn dakinis-btn--primary" onClick={() => navigate('/login', { replace: true })}>
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
