import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  ApproveCustomerTaskCompletionResponse,
  CancelCustomerTaskPayload,
  CancelCustomerTaskResponse,
  CustomerProAccessCheckoutResponse,
  CustomerProSiteVisitActionResponse,
  CustomerProSiteVisitCancelPayload,
  CustomerProSiteVisitInvitePayload,
  CreateCustomerProRequestPayload,
  CreateCustomerProRequestResponse,
  CreateCustomerTaskPayload,
  CreateCustomerTaskResponse,
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerProRequestsResponse,
  CustomerTaskPaymentFinalizeResponse,
  CustomerTaskPaymentSetupResponse,
  FinalizeCustomerTaskPaymentPayload,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
  RequestCustomerTaskSupportPayload,
  RequestCustomerTaskSupportResponse,
  RejectCustomerTaskCompletionPayload,
  RejectCustomerTaskCompletionResponse,
  SelectCustomerTaskerPayload,
  SelectCustomerTaskerResponse,
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

export function cancelCustomerTask(
  taskId: string,
  payload: CancelCustomerTaskPayload,
  authToken: string,
): Promise<ApiResult<CancelCustomerTaskResponse>> {
  return apiRequest<CancelCustomerTaskResponse>(endpoints.customer.taskCancel(taskId), {
    authToken,
    body: {
      confirmationAccepted: payload.confirmationAccepted === true,
      ...(payload.reason ? { reason: payload.reason } : null),
    },
    method: 'POST',
  });
}

export function requestCustomerTaskSupport(
  taskId: string,
  payload: RequestCustomerTaskSupportPayload,
  authToken: string,
): Promise<ApiResult<RequestCustomerTaskSupportResponse>> {
  return apiRequest<RequestCustomerTaskSupportResponse>(endpoints.customer.taskSupportRequest(taskId), {
    authToken,
    body: {
      ...(payload.details ? { details: payload.details } : null),
      reason: payload.reason,
    },
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

export function approveCustomerTaskCompletion(
  taskId: string,
  authToken: string,
): Promise<ApiResult<ApproveCustomerTaskCompletionResponse>> {
  return apiRequest<ApproveCustomerTaskCompletionResponse>(endpoints.customer.taskApproveCompletion(taskId), {
    authToken,
    body: {},
    method: 'POST',
  });
}

export function selectCustomerTasker(
  taskId: string,
  payload: SelectCustomerTaskerPayload,
  authToken: string,
): Promise<ApiResult<SelectCustomerTaskerResponse>> {
  return apiRequest<SelectCustomerTaskerResponse>(endpoints.customer.taskSelectTasker(taskId), {
    authToken,
    body: { taskerId: payload.taskerId },
    method: 'POST',
  });
}

export function setupCustomerTaskPayment(
  taskId: string,
  authToken: string,
): Promise<ApiResult<CustomerTaskPaymentSetupResponse>> {
  return apiRequest<CustomerTaskPaymentSetupResponse>(endpoints.customer.taskPaymentSetup(taskId), {
    authToken,
    body: {},
    method: 'POST',
  });
}

export function finalizeCustomerTaskPayment(
  taskId: string,
  payload: FinalizeCustomerTaskPaymentPayload = {},
  authToken: string,
): Promise<ApiResult<CustomerTaskPaymentFinalizeResponse>> {
  return apiRequest<CustomerTaskPaymentFinalizeResponse>(endpoints.customer.taskPaymentFinalize(taskId), {
    authToken,
    body: {
      ...(payload.paymentMethodId ? { paymentMethodId: payload.paymentMethodId } : null),
      ...(payload.setupIntentId ? { setupIntentId: payload.setupIntentId } : null),
    },
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

export function createCustomerProAccessCheckout(
  proRequestId: string,
  authToken: string,
): Promise<ApiResult<CustomerProAccessCheckoutResponse>> {
  return apiRequest<CustomerProAccessCheckoutResponse>(endpoints.customer.proRequestAccessCheckout(proRequestId), {
    authToken,
    body: {},
    method: 'POST',
  });
}

export function createCustomerProSiteVisitInvite(
  proRequestId: string,
  payload: CustomerProSiteVisitInvitePayload,
  authToken: string,
): Promise<ApiResult<CustomerProSiteVisitActionResponse>> {
  return apiRequest<CustomerProSiteVisitActionResponse>(endpoints.customer.proRequestSiteVisits(proRequestId), {
    authToken,
    body: toCustomerProSiteVisitInviteBody(payload),
    method: 'POST',
  });
}

export function cancelCustomerProSiteVisitInvite(
  proRequestId: string,
  siteVisitId: string,
  payload: CustomerProSiteVisitCancelPayload,
  authToken: string,
): Promise<ApiResult<CustomerProSiteVisitActionResponse>> {
  return apiRequest<CustomerProSiteVisitActionResponse>(endpoints.customer.proRequestSiteVisitCancel(proRequestId, siteVisitId), {
    authToken,
    body: payload.reason ? { reason: payload.reason } : {},
    method: 'POST',
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

function toCustomerProSiteVisitInviteBody(payload: CustomerProSiteVisitInvitePayload) {
  return {
    ...(payload.accessNotes ? { accessNotes: payload.accessNotes } : null),
    ...(payload.addressConfirmation !== undefined ? { addressConfirmation: payload.addressConfirmation } : null),
    ...(payload.message ? { message: payload.message } : null),
    ...(payload.preferredDate ? { preferredDate: payload.preferredDate } : null),
    ...(payload.preferredTimeWindow ? { preferredTimeWindow: payload.preferredTimeWindow } : null),
    proResponseId: payload.proResponseId,
  };
}
