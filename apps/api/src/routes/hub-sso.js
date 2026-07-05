import { streamautomatorExchangeHubSsoToken } from '../lib/hub-sso.js';

/**
 * POST /api/auth/hub-sso — intercambia JWT IdP (Hub) por sesión StreamAutomator.
 */
export async function hubSsoHandler(req, res) {
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const platformToken = bearer || String(req.body?.platformToken || req.body?.token || '').trim();

  if (!platformToken) {
    return res.status(400).json({ error: 'platformToken required' });
  }

  try {
    const result = await streamautomatorExchangeHubSsoToken(platformToken);
    return res.json({
      user: result.user,
      token: result.token,
      sso: { source: 'dakinis-hub', provisioned: Boolean(result.provisioned) },
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: status === 401 ? 'invalid_platform_token' : 'hub_sso_failed',
      message: err instanceof Error ? err.message : 'Hub SSO failed',
    });
  }
}
