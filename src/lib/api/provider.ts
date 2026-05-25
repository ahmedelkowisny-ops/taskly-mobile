import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  ExpressInterestInCoreTaskPayload,
  ExpressInterestInCoreTaskResponse,
  MarkProviderCoreTaskOnTheWayResponse,
  ProviderCoreTasksResponse,
  ProviderCoreTaskDetailResponse,
  ProviderDashboardResponse,
  ProviderProfileResponse,
  ProviderProRequestDetailResponse,
  ProviderProRequestsResponse,
  StartProviderCoreTaskResponse,
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

export function getProviderCoreTaskDetail(
  taskId: string,
  authToken: string,
): Promise<ApiResult<ProviderCoreTaskDetailResponse>> {
  return apiRequest<ProviderCoreTaskDetailResponse>(endpoints.provider.coreTaskDetail(taskId), {
    authToken,
    method: 'GET',
  });
}

export function expressInterestInCoreTask(
  taskId: string,
  authToken: string,
  payload: ExpressInterestInCoreTaskPayload = {},
): Promise<ApiResult<ExpressInterestInCoreTaskResponse>> {
  return apiRequest<ExpressInterestInCoreTaskResponse>(endpoints.provider.coreTaskInterest(taskId), {
    authToken,
    body: payload,
    method: 'POST',
  });
}

export function markProviderCoreTaskOnTheWay(
  taskId: string,
  authToken: string,
): Promise<ApiResult<MarkProviderCoreTaskOnTheWayResponse>> {
  return apiRequest<MarkProviderCoreTaskOnTheWayResponse>(endpoints.provider.coreTaskOnTheWay(taskId), {
    authToken,
    body: {},
    method: 'POST',
  });
}

export function startProviderCoreTask(
  taskId: string,
  authToken: string,
): Promise<ApiResult<StartProviderCoreTaskResponse>> {
  return apiRequest<StartProviderCoreTaskResponse>(endpoints.provider.coreTaskStart(taskId), {
    authToken,
    body: {},
    method: 'POST',
  });
}

export function getProviderProRequests(authToken: string): Promise<ApiResult<ProviderProRequestsResponse>> {
  return apiRequest<ProviderProRequestsResponse>(endpoints.provider.proRequests, {
    authToken,
    method: 'GET',
  });
}

export function getProviderProRequestDetail(
  proRequestId: string,
  authToken: string,
): Promise<ApiResult<ProviderProRequestDetailResponse>> {
  return apiRequest<ProviderProRequestDetailResponse>(endpoints.provider.proRequestDetail(proRequestId), {
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
