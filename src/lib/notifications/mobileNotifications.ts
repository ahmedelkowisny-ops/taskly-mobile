import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  registerNotificationToken,
  unregisterNotificationToken,
} from '@/src/lib/api/notifications';
import { NotificationPreferences } from '@/src/lib/api/domain';
import {
  clearNotificationToken,
  getNotificationToken,
  getOrCreateNotificationDeviceId,
  saveNotificationToken,
} from '@/src/lib/notifications/tokenStorage';

const TASKLY_DEFAULT_CHANNEL_ID = 'taskly-default';
const TASKLY_NOTIFICATION_SOUND = 'taskly_notification.wav';

type NotificationWorkspace = 'both' | 'customer' | 'provider';

export type NotificationSetupResult =
  | { ok: true; token: string }
  | {
      code:
        | 'BACKEND_ERROR'
        | 'DEMO_MODE'
        | 'PERMISSION_DENIED'
        | 'PROJECT_ID_MISSING'
        | 'REGISTRATION_FAILED'
        | 'UNSUPPORTED_PLATFORM';
      message: string;
      ok: false;
    };

function getPlatform() {
  if (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') return Platform.OS;
  return 'unknown';
}

function getProjectId() {
  const constants = Constants as typeof Constants & {
    easConfig?: { projectId?: string };
  };

  return constants.expoConfig?.extra?.eas?.projectId ?? constants.easConfig?.projectId ?? null;
}

function getLocale(): 'bg' | 'en' {
  const locale = String(Constants.expoConfig?.extra?.locale || '').toLowerCase();
  return locale === 'bg' ? 'bg' : 'en';
}

function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

async function configureAndroidChannel(preferences: NotificationPreferences) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(TASKLY_DEFAULT_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'Taskly alerts',
    sound: preferences.soundEnabled ? TASKLY_NOTIFICATION_SOUND : undefined,
    vibrationPattern: preferences.vibrationEnabled ? [0, 250, 250, 250] : [],
  });
}

export async function requestAndRegisterNotifications({
  authToken,
  isDemoMode,
  preferences,
  workspace,
}: {
  authToken: string | null;
  isDemoMode: boolean;
  preferences: NotificationPreferences;
  workspace: NotificationWorkspace;
}): Promise<NotificationSetupResult> {
  if (isDemoMode) {
    return { code: 'DEMO_MODE', message: 'Demo mode does not register real notification tokens.', ok: false };
  }

  if (!authToken) {
    return { code: 'BACKEND_ERROR', message: 'Login is required to enable notifications.', ok: false };
  }

  if (Platform.OS === 'web') {
    return { code: 'UNSUPPORTED_PLATFORM', message: 'Native push notifications are not available on web preview.', ok: false };
  }

  await configureAndroidChannel(preferences);

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return { code: 'PERMISSION_DENIED', message: 'Notification permission was not granted.', ok: false };
  }

  const projectId = getProjectId();
  if (!projectId) {
    return { code: 'PROJECT_ID_MISSING', message: 'Expo project id is required before registering a push token.', ok: false };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const deviceId = await getOrCreateNotificationDeviceId();
    const result = await registerNotificationToken(
      {
        appVersion: Constants.expoConfig?.version ?? null,
        appWorkspace: workspace,
        deviceId,
        locale: getLocale(),
        platform: getPlatform(),
        timezone: getTimezone(),
        token,
        tokenType: 'expo',
      },
      authToken,
    );

    if (!result.ok) {
      return { code: 'BACKEND_ERROR', message: result.error.message, ok: false };
    }

    await saveNotificationToken(token);
    return { ok: true, token };
  } catch {
    return { code: 'REGISTRATION_FAILED', message: 'Could not register notifications on this device.', ok: false };
  }
}

export async function unregisterStoredNotificationToken(authToken: string | null) {
  const token = await getNotificationToken();
  if (!authToken || !token) {
    await clearNotificationToken();
    return;
  }

  await unregisterNotificationToken({ token }, authToken);
  await clearNotificationToken();
}
