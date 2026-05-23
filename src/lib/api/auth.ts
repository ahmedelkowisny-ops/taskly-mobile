import { apiRequest } from './client';
import { endpoints } from './endpoints';
import { ApiRequestOptions, ApiResult, UserSession } from './types';

type CurrentSessionOptions = Omit<ApiRequestOptions, 'body' | 'method'>;

export function getCurrentSession(options: CurrentSessionOptions = {}): Promise<ApiResult<UserSession>> {
  return apiRequest<UserSession>(endpoints.auth.currentSession, {
    ...options,
    method: 'GET',
  });
}
