import api from '@/lib/api';

/**
 * Returns a full image URL for display (handles relative paths from API).
 */
export function getImageSrc(url) {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
  return base + (url.startsWith('/') ? url : `/${url}`);
}
