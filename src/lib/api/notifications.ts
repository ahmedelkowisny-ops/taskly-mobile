import { apiRequest } from './client';
import {
  NotificationPreferenceUpdatePayload,
  NotificationPreferencesResponse,
  NotificationTokenRegistrationPayload,
  NotificationTokenRegistrationResponse,
  NotificationTokenUnregisterPayload,
} from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';

export function getNotificationPreferences(authToken: string): Promise<ApiResult<NotificationPreferencesResponse>> {
  return apiRequest<NotificationPreferencesResponse>(endpoints.notifications.preferences, {
    authToken,
    method: 'GET',
  });
}

export function updateNotificationPreferences(
  payload: NotificationPreferenceUpdatePayload,
  authToken: string,
): Promise<ApiResult<NotificationPreferencesResponse>> {
  return apiRequest<NotificationPreferencesResponse>(endpoints.notifications.preferences, {
    authToken,
    body: payload,
    method: 'PATCH',
  });
}

export function registerNotificationToken(
  payload: NotificationTokenRegistrationPayload,
  authToken: string,
): Promise<ApiResult<NotificationTokenRegistrationResponse>> {
  return apiRequest<NotificationTokenRegistrationResponse>(endpoints.notifications.registerPushToken, {
    authToken,
    body: payload,
    method: 'POST',
  });
}

export function unregisterNotificationToken(
  payload: NotificationTokenUnregisterPayload,
  authToken: string,
): Promise<ApiResult<NotificationTokenRegistrationResponse>> {
  return apiRequest<NotificationTokenRegistrationResponse>(endpoints.notifications.unregisterPushToken, {
    authToken,
    body: payload,
    method: 'POST',
  });
}
