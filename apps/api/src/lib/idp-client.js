/**
 * Verificación de JWT IdP (dakinis-auth) para Hub SSO.
 */

const DEFAULT_AUTH_URL = 'https://auth.dakinissystems.com/auth';

function dakinisAuthBaseUrl() {
  return String(process.env.DAKINIS_AUTH_URL || process.env.AUTH_URL || DEFAULT_AUTH_URL).replace(/\/$/, '');
}

/**
 * @param {string} token
 * @returns {Promise<{ sub: string; email?: string; tenant?: string; role?: string } | null>}
 */
export async function streamautomatorVerifyIdpToken(token) {
  const accessToken = String(token || '').trim();
  if (!accessToken) return null;

  const base = dakinisAuthBaseUrl();
  try {
    const res = await fetch(`${base}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const sub = data?.sub ?? data?.id;
    if (!sub) return null;
    return {
      sub: String(sub),
      email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : undefined,
      tenant: data.tenant ?? data.tenantId,
      role: data.role,
    };
  } catch (err) {
    console.warn('[streamautomator/idp]', err instanceof Error ? err.message : err);
    return null;
  }
}
