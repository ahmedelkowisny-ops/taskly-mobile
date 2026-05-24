import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerProRequestsResponse,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
} from './domain';
import { ApiResult } from './types';

export function getCustomerHomeSummary(authToken: string): Promise<ApiResult<CustomerHomeResponse>> {
  return apiRequest<CustomerHomeResponse>(endpoints.customer.home, {
    authToken,
    method: 'GET',
  });
}

export function getCustomerTasks(authToken: string): Promise<ApiResult<CustomerTasksResponse>> {
  return apiRequest<CustomerTasksResponse>(endpoints.customer.tasks, {
    authToken,
    method: 'GET',
  });
}

export function getCustomerTaskDetail(taskId: string, authToken: string): Promise<ApiResult<CustomerTaskDetailResponse>> {
  return apiRequest<CustomerTaskDetailResponse>(endpoints.customer.taskDetail(taskId), {
    authToken,
    method: 'GET',
  });
}

export function getCustomerProRequests(authToken: string): Promise<ApiResult<CustomerProRequestsResponse>> {
  return apiRequest<CustomerProRequestsResponse>(endpoints.customer.proRequests, {
    authToken,
    method: 'GET',
  });
}

export function getCustomerProRequestDetail(
  proRequestId: string,
  authToken: string,
): Promise<ApiResult<CustomerProRequestDetailResponse>> {
  return apiRequest<CustomerProRequestDetailResponse>(endpoints.customer.proRequestDetail(proRequestId), {
    authToken,
    method: 'GET',
  });
}
