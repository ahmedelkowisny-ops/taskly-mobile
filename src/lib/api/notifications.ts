import { apiRequest } from './client';
import {
  MobileNotificationsResponse,
  NotificationPreferenceUpdatePayload,
  NotificationPreferencesResponse,
  NotificationTokenRegistrationPayload,
  NotificationTokenRegistrationResponse,
  NotificationTokenUnregisterPayload,
} from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';

export function getNotifications(authToken: string): Promise<ApiResult<MobileNotificationsResponse>> {
  return apiRequest<MobileNotificationsResponse>(endpoints.notifications.list, {
    authToken,
    method: 'GET',
  });
}

export function markNotificationAsRead(
  notificationId: number,
  authToken: string,
): Promise<ApiResult<MobileNotificationsResponse>> {
  return apiRequest<MobileNotificationsResponse>(endpoints.notifications.markRead(String(notificationId)), {
    authToken,
    method: 'PATCH',
  });
}

export function markAllNotificationsAsRead(authToken: string): Promise<ApiResult<MobileNotificationsResponse>> {
  return apiRequest<MobileNotificationsResponse>(endpoints.notifications.markAllRead, {
    authToken,
    method: 'PATCH',
  });
}

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
