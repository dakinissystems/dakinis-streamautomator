/**
 * API origin (no trailing slash). Build-time env + runtime fallback for production hosts.
 */
export function getApiOrigin() {
  const fromEnv = (process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '')
    .trim()
    .replace(/\/$/, '');

  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (!host.includes('localhost') && !host.startsWith('127.')) {
      if (host.startsWith('api.')) {
        return `${window.location.protocol}//${host}`;
      }
      if (host === 'streamautomator.com' || host.endsWith('.streamautomator.com')) {
        return 'https://api.streamautomator.com';
      }
      const base = host.replace(/^www\./, '');
      return `https://api.${base}`;
    }
  }

  return fromEnv || 'http://localhost:5000';
}

export function getApiBasePath() {
  const origin = getApiOrigin();
  return origin.endsWith('/api') ? origin : `${origin}/api`;
}
