import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  linkGoogleWithSupabaseToken,
  linkTwitchWithSupabaseToken,
  linkTwitterWithSupabaseToken,
  getOAuthLinkMode,
  clearOAuthLinkMode,
} from '../features/auth/api';
import { API_BASE_URL } from '../shared/api/client';
import { getStoredAuth, isTokenExpired } from '../utils/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { persistOAuthLoginError, logAuthDebug } from '../utils/oauthLoginError';

function consumePostLoginRedirect() {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem('postLoginRedirect');
  sessionStorage.removeItem('postLoginRedirect');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function consumeOAuthReturnTo() {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem('oauthReturnTo');
  sessionStorage.removeItem('oauthReturnTo');
  return raw === 'discord' ? 'discord' : null;
}

function userFromJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.id) return null;
    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    return null;
  }
}

function redirectTo(path) {
  const target = path.startsWith('/') ? path : `/${path}`;
  window.location.replace(target);
}

function redirectToLoginWithError(message, code = 'oauth_failed', detail = null) {
  persistOAuthLoginError(message, detail);
  redirectTo(`/login?error=${encodeURIComponent(code)}`);
}

function applyAuth(setAuth, user, token) {
  const stored = getStoredAuth();
  if (stored.token === token && stored.user?.id === user?.id) {
    return;
  }
  setAuth(user, token);
}

export default function AuthCallback({ setAuth }) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const handlingRef = useRef(false);
  const queryString = searchParams.toString();

  useEffect(() => {
    const hashRaw = window.location.hash?.substring(1) || '';
    const lockKey = `sa_oauth:${queryString}:${hashRaw}`;
    if (sessionStorage.getItem('sa_oauth_lock') === lockKey) return;
    if (handlingRef.current) return;
    handlingRef.current = true;
    sessionStorage.setItem('sa_oauth_lock', lockKey);

    let cancelled = false;

    const finish = (path) => {
      if (cancelled) return;
      redirectTo(path);
    };

    const run = async () => {
      const hashParams = new URLSearchParams(hashRaw);
      const accessToken = hashParams.get('access_token');
      const errorParam = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const queryError = searchParams.get('error');
      const reason = searchParams.get('reason');
      const hasOAuthPayload = Boolean(accessToken || token || errorParam || queryError);

      if (!hasOAuthPayload) {
        const { token: storedToken, user: storedUser } = getStoredAuth();
        if (storedToken && storedUser && !isTokenExpired(storedToken)) {
          applyAuth(setAuth, storedUser, storedToken);
          finish(consumePostLoginRedirect() || '/dashboard');
          return;
        }
        finish(queryError ? `/login?error=${queryError}` : '/login');
        return;
      }

      if (errorParam && !accessToken) {
        const message = errorDescription || errorParam || t('login.oauthFailed');
        logAuthDebug('oauth.hash_error', { message, errorParam, errorDescription });
        redirectToLoginWithError(message, 'oauth_failed', errorDescription || null);
        return;
      }

      if (accessToken) {
        const linkMode = getOAuthLinkMode();
        if (linkMode === 'google') {
          try {
            await linkGoogleWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            finish('/settings?linked=google');
          } catch (error) {
            clearOAuthLinkMode();
            window.alert(error?.response?.data?.error || error?.message || t('login.linkGoogleFailed'));
            finish('/settings?error=link_google_failed');
          }
          return;
        }
        if (linkMode === 'twitch') {
          try {
            await linkTwitchWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            finish('/settings?linked=twitch');
          } catch (error) {
            clearOAuthLinkMode();
            window.alert(error?.response?.data?.error || error?.message || t('login.linkTwitchFailed'));
            finish('/settings?error=link_twitch_failed');
          }
          return;
        }
        if (linkMode === 'twitter') {
          try {
            await linkTwitterWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            finish('/settings?linked=twitter');
          } catch (error) {
            clearOAuthLinkMode();
            window.alert(error?.response?.data?.error || error?.message || t('login.linkTwitterFailed'));
            finish('/settings?error=link_twitter_failed');
          }
          return;
        }
        try {
          const controller = new AbortController();
          const abortTimer = setTimeout(() => controller.abort(), 20000);
          const res = await fetch(`${API_BASE_URL}/user/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          });
          clearTimeout(abortTimer);
          const data = await res.json();
          if (!res.ok) {
            const message = [data.error, data.details].filter(Boolean).join(' - ') || 'OAuth login failed';
            throw Object.assign(new Error(message), { response: { data, status: res.status } });
          }
          applyAuth(setAuth, data.user, data.token);
          finish(consumePostLoginRedirect() || '/dashboard');
        } catch (error) {
          const msg = error?.name === 'AbortError'
            ? (t('login.oauthTimeout') || 'Authentication timed out. Try again.')
            : (error?.message || error?.response?.data?.error || 'OAuth login failed');
          logAuthDebug('oauth.google_login', error);
          redirectToLoginWithError(msg, 'oauth_failed');
        }
        return;
      }

      const returnTo = consumeOAuthReturnTo();

      if (queryError && !token) {
        const message = reason || queryError || t('login.oauthFailed');
        logAuthDebug('oauth.query_error', { message, queryError, reason });
        redirectToLoginWithError(message, queryError, reason || null);
        return;
      }

      // Twitch / Discord / Twitter Passport OAuth → ?token=...&user=...
      if (token) {
        try {
          let user = null;
          if (userParam) {
            user = JSON.parse(decodeURIComponent(userParam));
          } else {
            user = userFromJwt(token);
          }
          if (!user) {
            throw new Error(t('login.authDataError') || 'Invalid auth data');
          }
          applyAuth(setAuth, user, token);
          if (returnTo === 'discord') {
            finish('/schedule');
            return;
          }
          finish(consumePostLoginRedirect() || '/dashboard');
        } catch (error) {
          logAuthDebug('oauth.passport_token', error);
          redirectToLoginWithError(
            error?.message || t('login.authDataError'),
            'oauth_failed',
          );
        }
        return;
      }

      finish('/login');
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [queryString, setAuth, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('login.completingAuth')}</p>
      </div>
    </div>
  );
}
