import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  CreateCustomerProRequestPayload,
  CreateCustomerProRequestResponse,
  CreateCustomerTaskPayload,
  CreateCustomerTaskResponse,
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerProRequestsResponse,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
  RejectCustomerTaskCompletionPayload,
  RejectCustomerTaskCompletionResponse,
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

export function createCustomerTask(
  payload: CreateCustomerTaskPayload,
  authToken: string,
): Promise<ApiResult<CreateCustomerTaskResponse>> {
  return apiRequest<CreateCustomerTaskResponse>(endpoints.customer.tasks, {
    authToken,
    body: payload,
    method: 'POST',
  });
}

export function rejectCustomerTaskCompletion(
  taskId: string,
  payload: RejectCustomerTaskCompletionPayload,
  authToken: string,
): Promise<ApiResult<RejectCustomerTaskCompletionResponse>> {
  return apiRequest<RejectCustomerTaskCompletionResponse>(endpoints.customer.taskRejectCompletion(taskId), {
    authToken,
    body: { reason: payload.reason },
    method: 'POST',
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

export function createCustomerProRequest(
  payload: CreateCustomerProRequestPayload,
  authToken: string,
): Promise<ApiResult<CreateCustomerProRequestResponse>> {
  return apiRequest<CreateCustomerProRequestResponse>(endpoints.customer.proRequests, {
    authToken,
    body: payload,
    method: 'POST',
  });
}
