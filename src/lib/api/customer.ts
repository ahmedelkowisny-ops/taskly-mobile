import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  CustomerHomeResponse,
  CustomerProRequestsResponse,
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

export function getCustomerProRequests(authToken: string): Promise<ApiResult<CustomerProRequestsResponse>> {
  return apiRequest<CustomerProRequestsResponse>(endpoints.customer.proRequests, {
    authToken,
    method: 'GET',
  });
}
