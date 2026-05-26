import * as SecureStore from 'expo-secure-store';

const NOTIFICATION_TOKEN_KEY = 'taskly_mobile_notification_token';
const NOTIFICATION_DEVICE_ID_KEY = 'taskly_mobile_notification_device_id';

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveNotificationToken(token: string) {
  if (!(await isSecureStoreAvailable())) return false;
  try {
    await SecureStore.setItemAsync(NOTIFICATION_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export async function getNotificationToken() {
  if (!(await isSecureStoreAvailable())) return null;
  try {
    return await SecureStore.getItemAsync(NOTIFICATION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearNotificationToken() {
  if (!(await isSecureStoreAvailable())) return;
  try {
    await SecureStore.deleteItemAsync(NOTIFICATION_TOKEN_KEY);
  } catch {
    // Best-effort local cleanup; never surface stored token values.
  }
}

export async function getOrCreateNotificationDeviceId() {
  if (!(await isSecureStoreAvailable())) return null;

  try {
    const existing = await SecureStore.getItemAsync(NOTIFICATION_DEVICE_ID_KEY);
    if (existing) return existing;

    const next = `taskly-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync(NOTIFICATION_DEVICE_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
}
