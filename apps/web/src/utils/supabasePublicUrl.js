/**
 * Public Supabase Storage URLs without loading the Supabase JS SDK.
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

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

export function getPublicImageUrl(filePath) {
  if (!supabaseUrl) {
    throw new Error('Supabase no está configurado');
  }
  if (!isStoragePathValid(filePath)) {
    throw new Error('requested path is invalid');
  }

  const path = filePath.trim().replace(/^\/+/, '');
  const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/images/${path}`;
  ensureNotBaseUrl(publicUrl);
  return publicUrl;
}
