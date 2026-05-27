/** Sentry opcional — solo si SENTRY_DSN está definido. */

let sentryReady = false;

export async function dakinisInitSentry(serviceName) {
  const dsn = String(process.env.SENTRY_DSN || "").trim();
  if (!dsn) return false;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
      release: process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
      sendDefaultPii: false,
      initialScope: { tags: { service: serviceName } },
    });
    sentryReady = true;
    return true;
  } catch (err) {
    console.warn("[sentry] init skipped:", err?.message || err);
    return false;
  }
}

export function dakinisCaptureException(error, context = {}) {
  if (!sentryReady || !error) return;
  import("@sentry/node")
    .then((Sentry) => {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
        Sentry.captureException(error);
      });
    })
    .catch(() => {});
}

export function dakinisIsSentryEnabled() {
  return sentryReady;
}
