const HUB_BASE = String(process.env.REACT_APP_DAKINIS_CORPORATE_URL || 'https://dakinissystems.com').replace(
  /\/$/,
  ''
);

/**
 * @param {{ scope?: string; path?: string; product?: string; external?: boolean; metadata?: { path?: string; product?: string; contentId?: number } }} hit
 */
export function resolveStreamSearchHitPath(hit) {
  if (hit?.external && hit?.path) {
    return { href: hit.path, external: true };
  }

  const explicit = hit?.path || hit?.metadata?.path;
  if (explicit) {
    if (explicit.startsWith('http')) return { href: explicit, external: true };
    if (explicit.startsWith('/')) return { path: explicit, external: false };
  }

  const product = String(hit?.product || hit?.metadata?.product || '').toLowerCase();
  if (product === 'streamautomator') {
    const contentId = hit?.metadata?.contentId;
    if (contentId) return { path: `/schedule?content=${contentId}`, external: false };
    return { path: '/schedule', external: false };
  }
  if (product === 'hub') return { href: `${HUB_BASE}/hub`, external: true };
  if (product === 'core') return { href: `${HUB_BASE}/core`, external: true };
  if (product === 'akoenet') return { href: 'https://akoenet.dakinissystems.com', external: true };
  if (product === 'lifeflow') return { href: 'https://finance.dakinissystems.com', external: true };

  const scope = hit?.scope || 'global';
  if (scope === 'events' || scope === 'streams') return { path: '/schedule', external: false };
  if (scope === 'knowledge' || scope === 'documentation') {
    return { href: `${HUB_BASE}/faq`, external: true };
  }

  return null;
}
