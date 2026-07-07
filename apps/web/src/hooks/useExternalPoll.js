import { useSyncExternalStore } from 'react';

const caches = new Map();

function getCache(cacheKey, fetcher, intervalMs) {
  if (!caches.has(cacheKey)) {
    let snapshot = { data: null, error: null, status: 'idle' };
    const listeners = new Set();
    let timer = null;
    let inflight = false;

    const emit = () => {
      listeners.forEach((listener) => listener());
    };

    const poll = async () => {
      if (inflight) return;
      inflight = true;
      snapshot = { ...snapshot, status: snapshot.status === 'idle' ? 'loading' : snapshot.status };
      emit();
      try {
        const data = await fetcher();
        snapshot = { data, error: null, status: 'ready' };
      } catch (error) {
        snapshot = { data: null, error, status: 'error' };
      } finally {
        inflight = false;
        emit();
      }
    };

    const subscribe = (listener) => {
      listeners.add(listener);
      if (listeners.size === 1) {
        poll();
        if (intervalMs > 0) {
          timer = setInterval(poll, intervalMs);
        }
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          if (timer) clearInterval(timer);
          timer = null;
          caches.delete(cacheKey);
        }
      };
    };

    const getSnapshot = () => snapshot;
    caches.set(cacheKey, { subscribe, getSnapshot });
  }
  return caches.get(cacheKey);
}

/** Poll/fetch outside React effects via useSyncExternalStore (OBS overlays, SSO bootstrap). */
export function useExternalPoll(cacheKey, fetcher, intervalMs = 0) {
  const cache = getCache(cacheKey, fetcher, intervalMs);
  return useSyncExternalStore(cache.subscribe, cache.getSnapshot, cache.getSnapshot);
}
