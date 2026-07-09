/**
 * Supabase client for storage/OAuth — SDK loaded on demand (separate chunk).
 * Public image URLs are built without shipping createClient in the main bundle.
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const AUTH_SETTINGS_PATH = '/auth/v1/settings';
const globalKey = '__STREAMER_SCHEDULER_SUPABASE__';

function createSafeFetch() {
  const base = (supabaseUrl || '').replace(/\/$/, '');
  return function safeFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url);
    if (url && base) {
      const u = String(url).replace(/\/$/, '').split('?')[0];
      if (u === base) {
        const newUrl = base + AUTH_SETTINGS_PATH;
        input = typeof input === 'string' ? newUrl : new Request(newUrl, input);
      }
    }
    return fetch(input, init);
  };
}

/** Lazy singleton — keeps @supabase/supabase-js out of the main app chunk. */
export async function getSupabase() {
  if (typeof window !== 'undefined' && window[globalKey]) {
    return window[globalKey];
  }
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: createSafeFetch() },
  });
  if (typeof window !== 'undefined') {
    window[globalKey] = client;
  }
  return client;
}

export async function uploadFile(file, bucket, userId) {
  const supabase = await getSupabase();
  if (!supabase) {
    const error = new Error('Supabase no está configurado. Verifica REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY');
    return { path: null, error };
  }

  if (bucket !== 'images' && bucket !== 'videos') {
    const error = new Error('Bucket debe ser "images" o "videos"');
    return { path: null, error };
  }

  try {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = userId ? `${userId}/${fileName}` : fileName;

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      if (error.message.includes('Bucket not found')) {
        return { path: null, error: new Error('Bucket no encontrado. Verifica que los buckets "images" y "videos" existan en Supabase Storage') };
      }
      if (error.message.includes('new row violates')) {
        return { path: null, error: new Error('Error de permisos. Verifica las politicas de Storage en Supabase') };
      }
      return { path: null, error };
    }

    return { path: data.path, error: null };
  } catch (error) {
    return { path: null, error };
  }
}

function isStoragePathValid(filePath) {
  if (filePath == null || typeof filePath !== 'string') return false;
  const trimmed = filePath.trim();
  if (!trimmed) return false;
  if (/[\\:*?"<>|]/.test(trimmed)) return false;
  return true;
}

function ensureNotBaseUrl(url) {
  if (!url || typeof url !== 'string') return;
  const base = (supabaseUrl || '').replace(/\/$/, '');
  const u = url.replace(/\/$/, '').split('?')[0];
  if (base && u === base) {
    throw new Error('requested path is invalid');
  }
}

export async function getSignedVideoUrl(filePath, expiresIn = 3600) {
  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  if (!isStoragePathValid(filePath)) {
    throw new Error('requested path is invalid');
  }

  const path = filePath.trim().replace(/^\/+/, '');
  const { data, error } = await supabase.storage.from('videos').createSignedUrl(path, expiresIn);

  if (error) throw error;

  ensureNotBaseUrl(data.signedUrl);
  return data.signedUrl;
}
