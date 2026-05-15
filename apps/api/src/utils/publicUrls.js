/**
 * Public URLs for OAuth redirect_uri and post-login redirects.
 * In production, never fall back to localhost when env is missing (Railway/Render).
 */

function trimUrl(url = '') {
  return String(url || '').trim().replace(/\/$/, '');
}

function isLocalhost(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function isSupabaseHost(url) {
  return url.includes('supabase.co');
}

/**
 * OAuth callback base (no trailing slash). Priority:
 * TWITCH_OAUTH_REDIRECT_BASE_URL → BACKEND_URL → PUBLIC_API_URL → RAILWAY_PUBLIC_DOMAIN
 */
export function getBackendPublicUrl() {
  const isProd = process.env.NODE_ENV === 'production';
  const candidates = [
    process.env.TWITCH_OAUTH_REDIRECT_BASE_URL,
    process.env.BACKEND_URL,
    process.env.PUBLIC_API_URL,
    process.env.API_PUBLIC_URL,
  ]
    .map(trimUrl)
    .filter(Boolean);

  for (const url of candidates) {
    if (isSupabaseHost(url)) continue;
    if (isProd && isLocalhost(url)) continue;
    return url;
  }

  if (isProd) {
    const railway = trimUrl(process.env.RAILWAY_PUBLIC_DOMAIN).replace(/^https?:\/\//i, '');
    if (railway) return `https://${railway}`;
  }

  return 'http://localhost:5000';
}

/**
 * Frontend origin for redirects after OAuth (no trailing slash).
 */
export function getFrontendPublicUrl() {
  const raw = trimUrl(
    process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URLS?.split(',')[0]
  );
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!raw || isLocalhost(raw))) {
    return 'https://streamautomator.com';
  }
  return raw || 'http://localhost:3000';
}
