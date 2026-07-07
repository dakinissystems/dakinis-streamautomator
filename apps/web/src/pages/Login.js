import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, register, loginWithGoogle, loginWithTwitch, loginWithTwitter, loginWithDiscord, forgotPassword } from '../features/auth/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye } from 'lucide-react';
import LoginOAuthButtons from './Login/LoginOAuthButtons';

export default function Login({ setAuth }) {
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseOption, setLicenseOption] = useState('trial'); // 'trial' or 'monthly'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getSafeNextPath = () => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('next');
    if (!raw) return '/dashboard';
    try {
      const decoded = decodeURIComponent(raw);
      if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard';
      return decoded;
    } catch {
      return '/dashboard';
    }
  };

  const getSlugFromLocation = () => {
    const params = new URLSearchParams(location.search);
    const directSlug = (params.get('slug') || '').trim();
    if (directSlug) return directSlug;
    const nextPath = getSafeNextPath();
    try {
      const nextUrl = new URL(nextPath, window.location.origin);
      return (nextUrl.searchParams.get('slug') || '').trim();
    } catch {
      return '';
    }
  };

  const oauthFromUrl = useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    const oauthError = urlParams.get('error');
    if (!oauthError) return null;
    let derivedError = null;
    let derivedNotice = null;
    if (oauthError === 'oauth_failed') {
      derivedError = t('login.oauthFailed') || 'OAuth authentication failed. Please try again.';
      const reasonRaw = urlParams.get('reason');
      let detail = null;
      try {
        detail = reasonRaw ? decodeURIComponent(reasonRaw) : null;
      } catch {
        detail = reasonRaw;
      }
      derivedNotice = detail || (t('login.oauthFailedTwitterHint') || 'If you were signing in with X (Twitter), their page may have had a temporary issue. Please try again.');
    } else if (oauthError === 'discord_not_configured') {
      derivedError = t('login.discordNotConfigured') || 'Discord login is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in the backend .env with the numeric Application ID from Discord Developer Portal.';
    } else if (oauthError === 'twitch_not_configured') {
      derivedError = t('login.twitchNotConfigured') || 'Twitch login is not configured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in the backend .env file.';
    } else if (oauthError === 'twitter_not_configured') {
      derivedError = t('login.twitterNotConfigured') || 'X (Twitter) login is not configured. Set TWITTER_OAUTH2_CLIENT_ID in the backend .env for OAuth2, or enable Twitter in Supabase Dashboard.';
    }
    return { oauthError, derivedError, derivedNotice };
  }, [location.search, t]);

  useEffect(() => {
    if (oauthFromUrl?.oauthError) {
      window.history.replaceState({}, document.title, '/login');
    }
  }, [oauthFromUrl?.oauthError]);

  const slug = getSlugFromLocation();
  const [slugRoute, setSlugRoute] = useState(location.search);
  if (location.search !== slugRoute) {
    setSlugRoute(location.search);
    if (slug) {
      setIsRegister(true);
      setUsername((prev) => (prev.trim() ? prev : slug.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40)));
    }
  }

  const displayError = error ?? oauthFromUrl?.derivedError ?? null;
  const displayNotice = notice ?? oauthFromUrl?.derivedNotice ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (isRegister) {
        if (!username.trim()) {
          setError(t('login.usernameRequired') || 'Username is required');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError(t('login.passwordsDoNotMatch') || 'Passwords do not match');
          setLoading(false);
          return;
        }
        // Convert licenseOption to startWithTrial format for backend
        // 'trial' -> startWithTrial: true
        // 'monthly' -> startWithTrial: false, licenseOption: 'monthly' (creates monthly license directly)
        const startWithTrial = licenseOption === 'trial';
        const registerRes = await register({ username, email, password, startWithTrial, licenseOption });
        
        // If registration returns token, use it directly (no need to login again)
        if (registerRes.data.token && registerRes.data.user) {
          setAuth(registerRes.data.user, registerRes.data.token);
          const licenseType = registerRes.data.user?.licenseType;
          
          // Show welcome message based on license type
          if (licenseType === 'trial') {
            setNotice(t('login.trialWelcome'));
          } else if (licenseType === 'monthly') {
            setNotice(t('login.monthlyAccountCreated'));
          } else if (!licenseType || licenseType === 'none') {
            setNotice(t('login.accountCreated'));
          }
          navigate(getSafeNextPath(), { replace: true });
          return;
        }
      }
      
      // Regular login flow (for existing users or if registration didn't return token)
      const res = await login({ email, password });
      setAuth(res.data.user, res.data.token);
      const alert = res.data.user?.licenseAlert;
      
      // Show welcome message (only for non-registration logins)
      if (alert === 'expired') {
        setNotice(t('login.licenseExpired'));
      } else if (alert === '7_days') {
        setNotice(t('login.licenseExpires7Days'));
      } else if (alert === '3_days') {
        setNotice(t('login.licenseExpires3Days'));
      }
      navigate(getSafeNextPath(), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || (isRegister ? t('login.registerFailed') : t('login.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('postLoginRedirect', getSafeNextPath());
      }
      if (provider === 'google') {
        await loginWithGoogle(isRegister);
      } else if (provider === 'twitch') {
        loginWithTwitch();
      } else if (provider === 'twitter') {
        await loginWithTwitter();
      } else if (provider === 'discord') {
        loginWithDiscord();
      }
    } catch (err) {
      setError(err?.message || err?.response?.data?.error || t('login.oauthFailed') || 'OAuth failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError(t('login.emailRequired') || 'Email is required');
      return;
    }
    setResetLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await forgotPassword({ email: resetEmail });
      if (res.data.tempPassword) {
        setNotice(t('login.passwordResetSuccess') || `Password reset! Your temporary password is: ${res.data.tempPassword}. Please change it after logging in.`);
      } else {
        setNotice(t('login.passwordResetEmailSent') || 'If an account with that email exists, a password reset has been processed.');
      }
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err) {
      setError(err.response?.data?.error || t('login.passwordResetFailed') || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <button type="button" onClick={() => navigate('/')} className="absolute top-4 left-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← {t('common.back')}</button>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-lg shadow-md w-full max-w-sm min-w-0">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">{isRegister ? t('login.createAccount') : t('login.title')}</h1>
        {displayError && <div className="mb-4 text-red-600 dark:text-red-400 text-center">{displayError}</div>}
        {displayNotice && <div className="mb-4 text-yellow-700 dark:text-yellow-400 text-center">{displayNotice}</div>}
        
        <LoginOAuthButtons isRegister={isRegister} loading={loading} onOAuthLogin={handleOAuthLogin} t={t} />
        {isRegister && (
          <div className="mb-4">
            <label htmlFor="login-username" className="block text-gray-700 dark:text-gray-300 mb-2">{t('common.username')}</label>
            <input
              id="login-username"
              name="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="login-email" className="block text-gray-700 dark:text-gray-300 mb-2">{t('common.email')}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="login-password" className="block text-gray-700 dark:text-gray-300 mb-2">{t('common.password')}</label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowPassword(true);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                setShowPassword(false);
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                setShowPassword(false);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                setShowPassword(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowPassword(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none select-none cursor-pointer"
              tabIndex={-1}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
        {isRegister && (
          <>
            <div className="mb-6">
              <label htmlFor="login-confirm" className="block text-gray-700 dark:text-gray-300 mb-2">{t('common.confirmPassword')}</label>
              <div className="relative">
                <input
                  id="login-confirm"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowConfirmPassword(true);
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    setShowConfirmPassword(false);
                  }}
                  onMouseLeave={(e) => {
                    e.preventDefault();
                    setShowConfirmPassword(false);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setShowConfirmPassword(true);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setShowConfirmPassword(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none select-none cursor-pointer"
                  tabIndex={-1}
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <label className="block text-gray-700 dark:text-gray-300 mb-3 font-semibold">{t('login.howToStart')}</label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="registrationOption"
                    value="trial"
                    checked={licenseOption === 'trial'}
                    onChange={() => setLicenseOption('trial')}
                    className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{t('login.trialOption')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('login.trialDescription')}</div>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="registrationOption"
                    value="monthly"
                    checked={licenseOption === 'monthly'}
                    onChange={() => setLicenseOption('monthly')}
                    className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{t('login.monthlyOption')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('login.monthlyDescription')}</div>
                  </div>
                </label>
              </div>
            </div>
          </>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          {loading ? (isRegister ? t('common.creating') || 'Creating...' : t('common.loggingIn') || 'Logging in...') : (isRegister ? t('login.createAccount') : t('common.login'))}
        </button>
        
        {!isRegister && (
          <button
            type="button"
            className="w-full mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => {
              setError(null);
              setShowForgotPassword(true);
            }}
          >
            {t('login.forgotPassword')}
          </button>
        )}
        
        <button
          type="button"
          className="w-full mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => {
            setError(null);
            setShowForgotPassword(false);
            setIsRegister(!isRegister);
          }}
        >
          {isRegister ? t('login.alreadyHaveAccount') : t('login.createUser')}
        </button>
        
        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('login.resetPassword')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('login.resetPasswordInstructions') || 'Enter your email address and we will reset your password.'}
              </p>
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label htmlFor="reset-email" className="block text-gray-700 dark:text-gray-300 mb-2">{t('common.email')}</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('common.email')}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px]"
                    disabled={resetLoading}
                  >
                    {resetLoading ? t('common.loading') || 'Loading...' : t('login.resetPassword') || 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setError(null);
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 
