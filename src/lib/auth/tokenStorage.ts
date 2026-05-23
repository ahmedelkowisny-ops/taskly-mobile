import * as SecureStore from 'expo-secure-store';

import { AuthTokens } from '@/src/lib/api/types';

const ACCESS_TOKEN_KEY = 'taskly_mobile_access_token';
const ACCESS_TOKEN_EXPIRES_IN_KEY = 'taskly_mobile_access_token_expires_in';
const REFRESH_TOKEN_KEY = 'taskly_mobile_refresh_token';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'taskly_mobile_refresh_token_expires_at';

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function setItem(key: string, value: string) {
  if (!(await isSecureStoreAvailable())) {
    return false;
  }

  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch {
    return false;
  }
}

async function getItem(key: string) {
  if (!(await isSecureStoreAvailable())) {
    return null;
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function deleteItem(key: string) {
  if (!(await isSecureStoreAvailable())) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Keep auth teardown best-effort; never surface token values.
  }
}

export async function saveAuthTokens(tokens: AuthTokens) {
  const writes = await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(ACCESS_TOKEN_EXPIRES_IN_KEY, String(tokens.accessTokenExpiresIn)),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    setItem(REFRESH_TOKEN_EXPIRES_AT_KEY, tokens.refreshTokenExpiresAt),
  ]);

  return writes.every(Boolean);
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresAt] = await Promise.all([
    getItem(ACCESS_TOKEN_KEY),
    getItem(ACCESS_TOKEN_EXPIRES_IN_KEY),
    getItem(REFRESH_TOKEN_KEY),
    getItem(REFRESH_TOKEN_EXPIRES_AT_KEY),
  ]);

  if (!accessToken || !refreshToken || !refreshTokenExpiresAt) {
    return null;
  }

  return {
    accessToken,
    accessTokenExpiresIn: Number(accessTokenExpiresIn) || 900,
    refreshToken,
    refreshTokenExpiresAt,
  };
}

export function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(ACCESS_TOKEN_EXPIRES_IN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_EXPIRES_AT_KEY),
  ]);
}
