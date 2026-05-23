import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  ApiRequestOptions,
  ApiResult,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshRequest,
  RefreshResponse,
  UserSession,
} from './types';

type CurrentSessionOptions = Omit<ApiRequestOptions, 'body' | 'method'>;

export function getCurrentSession(options: CurrentSessionOptions = {}): Promise<ApiResult<UserSession>> {
  return apiRequest<UserSession>(endpoints.auth.currentSession, {
    ...options,
    method: 'GET',
  });
}

export function loginWithEmailPassword(input: LoginRequest): Promise<ApiResult<LoginResponse>> {
  return apiRequest<LoginResponse>(endpoints.auth.login, {
    body: input,
    method: 'POST',
  });
}

export function refreshMobileSession(refreshToken: string): Promise<ApiResult<RefreshResponse>> {
  const body: RefreshRequest = {
    refreshToken,
  };

  return apiRequest<RefreshResponse>(endpoints.auth.refreshSession, {
    body,
    method: 'POST',
  });
}

export function logoutMobileSession(refreshToken?: string): Promise<ApiResult<LogoutResponse>> {
  return apiRequest<LogoutResponse>(endpoints.auth.logout, {
    body: refreshToken ? { refreshToken } : undefined,
    method: 'POST',
  });
}
