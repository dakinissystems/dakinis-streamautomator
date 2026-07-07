/**
 * Client-side logout (clear session + optional revoke + redirect).
 * Canonical: platform/shared/packages/auth-client/src/client-logout.js
 */

export const DAKINIS_LOGOUT_REDIRECT = '/login';

async function runBestEffortSteps(steps) {
  await Promise.all(
    steps.map(async (step) => {
      try {
        await step();
      } catch {
        /* best-effort */
      }
    })
  );
}

export async function dakinisPerformClientLogout(options) {
  const {
    clearLocalSession,
    revokeServer = [],
    afterClear = [],
    navigate,
    redirectTo = DAKINIS_LOGOUT_REDIRECT,
  } = options;

  await runBestEffortSteps([
    () => runBestEffortSteps(revokeServer),
    clearLocalSession,
    () => runBestEffortSteps(afterClear),
  ]);

  if (typeof navigate === 'function') {
    navigate(redirectTo, { replace: true });
  }
}

export async function dakinisRevokeIdpRefreshToken({ authBaseUrl, refreshToken }) {
  const base = String(authBaseUrl || '').replace(/\/$/, '');
  const rt = String(refreshToken || '').trim();
  if (!base || !rt) return;
  const url = base.endsWith('/auth') ? `${base}/logout` : `${base}/auth/logout`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  }).catch(() => undefined);
}
