import { apiClient } from '../shared/api/client.js';

/**
 * @param {string} q
 * @param {string} [scope='all']
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function fetchWorkspaceSearchHits(q, scope = 'all', options = {}) {
  try {
    const { data } = await apiClient.get('/workspace/search', {
      params: { q: String(q || '').trim(), scope: String(scope || 'all') },
      signal: options.signal,
    });
    return data?.hits || [];
  } catch {
    return [];
  }
}
