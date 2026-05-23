import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  ProviderCoreTasksResponse,
  ProviderDashboardResponse,
  ProviderProfileResponse,
  ProviderProRequestsResponse,
} from './domain';
import { ApiResult } from './types';

export function getProviderDashboard(authToken: string): Promise<ApiResult<ProviderDashboardResponse>> {
  return apiRequest<ProviderDashboardResponse>(endpoints.provider.dashboard, {
    authToken,
    method: 'GET',
  });
}

export function getProviderCoreTasks(authToken: string): Promise<ApiResult<ProviderCoreTasksResponse>> {
  return apiRequest<ProviderCoreTasksResponse>(endpoints.provider.coreTasks, {
    authToken,
    method: 'GET',
  });
}

export function getProviderProRequests(authToken: string): Promise<ApiResult<ProviderProRequestsResponse>> {
  return apiRequest<ProviderProRequestsResponse>(endpoints.provider.proRequests, {
    authToken,
    method: 'GET',
  });
}

export function getProviderProfile(authToken: string): Promise<ApiResult<ProviderProfileResponse>> {
  return apiRequest<ProviderProfileResponse>(endpoints.provider.profile, {
    authToken,
    method: 'GET',
  });
}
