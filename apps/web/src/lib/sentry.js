import * as Sentry from "@sentry/react";

function envStr(...keys) {
  for (const key of keys) {
    const v =
      (typeof import.meta !== 'undefined' && import.meta.env?.[key]) ||
      process.env[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}

export function saInitSentryBrowser() {
  const dsn = envStr('VITE_SENTRY_DSN', 'REACT_APP_SENTRY_DSN');
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment:
      envStr('VITE_SENTRY_ENVIRONMENT', 'REACT_APP_SENTRY_ENVIRONMENT') ||
      import.meta.env?.MODE ||
      'development',
    release: envStr('VITE_SENTRY_RELEASE', 'REACT_APP_SENTRY_RELEASE') || undefined,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: Number(
      envStr('VITE_SENTRY_TRACES_SAMPLE_RATE', 'REACT_APP_SENTRY_TRACES_SAMPLE_RATE') || 0.1
    ),
    replaysSessionSampleRate: Number(
      envStr(
        'VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE',
        'REACT_APP_SENTRY_REPLAY_SESSION_SAMPLE_RATE'
      ) || 0.05
    ),
    replaysOnErrorSampleRate: Number(
      envStr(
        'VITE_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE',
        'REACT_APP_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE'
      ) || 1
    ),
  });

  return true;
}

export { Sentry };
