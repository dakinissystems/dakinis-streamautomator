import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function AuthCallback({ setAuth }) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    let timeoutId = null;
    const run = async () => {
      // Prevent double run (e.g. React Strict Mode): second run often sees hash already cleared
      if (handledRef.current) return;

      const hashRaw = window.location.hash?.substring(1) || '';
      const hashParams = new URLSearchParams(hashRaw);
      const accessToken = hashParams.get('access_token');
      const errorParam = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const queryError = searchParams.get('error');
      const hasOAuthPayload = Boolean(accessToken || (token && userParam) || errorParam || queryError);

      // Already logged in but landed on /auth/callback (refresh, back button, stale URL)
      if (!hasOAuthPayload) {
        const { token: storedToken, user: storedUser } = getStoredAuth();
        if (storedToken && storedUser && !isTokenExpired(storedToken)) {
          handledRef.current = true;
          setAuth(storedUser, storedToken);
          navigate(consumePostLoginRedirect() || '/dashboard', { replace: true });
          return;
        }
        navigate(queryError ? `/login?error=${queryError}` : '/login', { replace: true });
        return;
      }

      // Handle OAuth errors from Supabase
      if (errorParam && !accessToken) {
        console.error('OAuth error in hash', { error: errorParam, description: errorDescription });
        const errorMsg = errorDescription || errorParam || t('login.oauthFailed');
        window.alert(errorMsg);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (accessToken) {
        handledRef.current = true;
        const linkMode = getOAuthLinkMode();
        if (linkMode === 'google') {
          try {
            await linkGoogleWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            navigate('/settings?linked=google');
          } catch (error) {
            clearOAuthLinkMode();
            const msg = error?.response?.data?.error || error?.message || t('login.linkGoogleFailed');
            window.alert(msg);
            navigate('/settings?error=link_google_failed');
          }
          return;
        }
        if (linkMode === 'twitch') {
          try {
            await linkTwitchWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            navigate('/settings?linked=twitch');
          } catch (error) {
            clearOAuthLinkMode();
            const msg = error?.response?.data?.error || error?.message || t('login.linkTwitchFailed');
            window.alert(msg);
            navigate('/settings?error=link_twitch_failed');
          }
          return;
        }
        if (linkMode === 'twitter') {
          try {
            await linkTwitterWithSupabaseToken(accessToken);
            clearOAuthLinkMode();
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            navigate('/settings?linked=twitter');
          } catch (error) {
            console.error('Link Twitter error:', error);
            clearOAuthLinkMode();
            const msg = error?.response?.data?.error || error?.message || t('login.linkTwitterFailed');
            window.alert(msg);
            navigate('/settings?error=link_twitter_failed');
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
          const { token: jwt, user } = data;
          setAuth(user, jwt);
          const postLoginRedirect = consumePostLoginRedirect();
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          navigate(postLoginRedirect || '/dashboard', { replace: true });
        } catch (error) {
          const msg = error?.name === 'AbortError'
            ? (t('login.oauthTimeout') || 'Authentication timed out. Try again.')
            : (error?.message || error?.response?.data?.error || 'OAuth login failed');
          window.alert(msg);
          navigate('/login?error=oauth_failed');
        }
        return;
      }

      // 2) Backend Passport OAuth callback: token and user in query (?token=...&user=...)
      const returnTo = consumeOAuthReturnTo();
      const error = queryError;
      const reason = searchParams.get('reason');

      if (error && !token) {
        console.error('OAuth error in query params', { error, reason });
        const errorMsg = reason || error || t('login.oauthFailed');
        window.alert(errorMsg);
        navigate(`/login?error=${error}`);
        return;
      }

      if (token && userParam) {
        handledRef.current = true;
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          setAuth(user, token);
          const postLoginRedirect = consumePostLoginRedirect();
          
          // Clean URL before navigation to prevent Chrome navigation issues
          window.history.replaceState(null, '', window.location.pathname);
          
          // Use setTimeout to ensure state is set before navigation
          timeoutId = setTimeout(() => {
            if (returnTo === 'discord') {
              navigate('/schedule', { replace: true });
              return;
            }
            navigate(postLoginRedirect || '/dashboard', { replace: true });
          }, 100);
        } catch (error) {
          console.error('Error parsing user data:', error);
          window.alert(t('login.authDataError'));
          navigate('/login?error=oauth_failed', { replace: true });
        }
        return;
      }

      navigate('/login', { replace: true });
    };

    run();
    return () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [searchParams, setAuth, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('login.completingAuth')}</p>
      </div>
    </div>
  );
}
