import { getApiBaseUrl } from './config';

export function resolveApiMediaUrl(url: string) {
  const trimmedUrl = String(url || '').trim();

  if (!trimmedUrl) return '';
  if (/^(data:|file:|https?:\/\/)/i.test(trimmedUrl)) return trimmedUrl;

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return trimmedUrl;

  const normalizedPath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
  return `${baseUrl}${normalizedPath}`;
}
