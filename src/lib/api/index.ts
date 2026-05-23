export { createApiClient, getApiBaseUrl } from './client';
export type { ApiClientConfig, TasklyApiClient } from './client';
export type {
  ApiError,
  ApiResult,
  ProviderCapabilities,
  UserSession,
  WorkspaceAccess,
} from './types';

export const apiFoundationStatus = 'not-connected';
