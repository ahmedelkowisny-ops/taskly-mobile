export function getApiBaseUrl() {
  const rawBaseUrl = process.env.EXPO_PUBLIC_TASKLY_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return null;
  }

  return rawBaseUrl.replace(/\/+$/, '');
}

export function assertApiBaseUrl(baseUrl = getApiBaseUrl()) {
  if (!baseUrl) {
    throw new Error('Missing EXPO_PUBLIC_TASKLY_API_BASE_URL');
  }

  return baseUrl.replace(/\/+$/, '');
}
