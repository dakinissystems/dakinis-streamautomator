import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  exchangePlatformToken,
  getIdpRefreshToken,
  isIdpAuthEnabled,
  refreshIdpToken,
  setIdpRefreshToken,
} from '../services/idp-auth';

const HASH_TOKEN_KEY = 'platform_token';

function readHashToken() {
  if (typeof window === 'undefined') return '';
  const raw = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const token = params.get(HASH_TOKEN_KEY) || '';
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

function clearHashToken() {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}

function resolveDestination(searchParams) {
  const returnUrl = searchParams.get('return_url');
  if (!returnUrl) return '/dashboard';
  try {
    const u = new URL(returnUrl);
    if (u.origin === window.location.origin) {
      return `${u.pathname}${u.search}${u.hash}` || '/dashboard';
    }
  } catch {
    /* ignore */
  }
  return '/dashboard';
}

export default function HubSso({ setAuth }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function finish(platformToken) {
      const data = await exchangePlatformToken(platformToken);
      if (cancelled) return;
      setAuth(data.user, data.token);
      if (data.refreshToken) setIdpRefreshToken(data.refreshToken);
      clearHashToken();
      navigate(resolveDestination(searchParams), { replace: true });
    }

    async function run() {
      if (!isIdpAuthEnabled()) {
        setError(t('hubSso.idpDisabled') || 'Ecosystem SSO is not configured.');
        return;
      }

      const hashToken = readHashToken();
      if (hashToken) {
        try {
          await finish(hashToken);
        } catch (err) {
          if (!cancelled) {
            setError(err?.response?.data?.error || err.message || 'SSO failed');
          }
        }
        return;
      }

      const idpRt = getIdpRefreshToken();
      if (idpRt) {
        try {
          const refreshed = await refreshIdpToken(idpRt);
          if (refreshed.refreshToken) setIdpRefreshToken(refreshed.refreshToken);
          await finish(refreshed.token);
          return;
        } catch {
          /* fall through */
        }
      }

      const loginQs = new URLSearchParams();
      const emailHint = searchParams.get('email');
      const returnUrl = searchParams.get('return_url');
      if (emailHint) loginQs.set('email', emailHint);
      if (returnUrl) loginQs.set('next', returnUrl);
      loginQs.set('from', 'dakinis-hub');
      navigate(`/login?${loginQs.toString()}`, { replace: true });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setAuth, t]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-300 text-center">
        {error || t('hubSso.working') || 'Linking your Dakinis account…'}
      </p>
      {error ? (
        <button
          type="button"
          className="mt-4 px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: 'var(--accent)' }}
          onClick={() => navigate('/login')}
        >
          {t('hubSso.goLogin') || 'Sign in'}
        </button>
      ) : null}
    </div>
  );
}
