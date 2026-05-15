/**
 * Detect automated vulnerability scans (not real app traffic).
 * Used to avoid WARN log noise on expected 404s.
 */
const PROBE_PATTERNS = [
  /\.php(\.|$)/i,
  /\.ya?ml$/i,
  /\.save$/i,
  /config\.js$/i,
  /^\/app\.js$/i,
  /\.env/i,
  /^\/api\/objects\//i,
  /^\/apis\//i,
  /^\/backend\/config\//i,
  /^\/cloud\//i,
  /^\/controller\//i,
  /^\/configs\//i,
  /wp-admin|wp-login|wp-content/i,
  /\.git/i,
  /phpunit|vendor\/phpunit/i,
  /\.aws\/|\.ssh\//i,
];

export function isProbeRequest(path = '') {
  const p = String(path).toLowerCase();
  return PROBE_PATTERNS.some((re) => re.test(p));
}
