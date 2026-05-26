import { apiRequest } from './client';
import { endpoints } from './endpoints';
import {
  ExpressInterestInCoreTaskPayload,
  ExpressInterestInCoreTaskResponse,
  MarkProviderCoreTaskOnTheWayResponse,
  ProviderCoreIssueActionPayload,
  ProviderCoreIssueActionResponse,
  ProviderCoreTasksResponse,
  ProviderCoreTaskDetailResponse,
  ProviderDashboardResponse,
  ProviderProfileResponse,
  ProviderProResponseMutationResponse,
  ProviderProResponsePayload,
  ProviderProRequestDetailResponse,
  ProviderProRequestsResponse,
  ProviderProSiteVisitAcceptPayload,
  ProviderProSiteVisitActionResponse,
  ProviderProSiteVisitDeclinePayload,
  ProviderProSiteVisitProposeTimePayload,
  RequestProviderCoreTaskCompletionPayload,
  RequestProviderCoreTaskCompletionResponse,
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

export function requestProviderCoreTaskCompletion(
  taskId: string,
  authToken: string,
  payload: RequestProviderCoreTaskCompletionPayload = {},
): Promise<ApiResult<RequestProviderCoreTaskCompletionResponse>> {
  const body = payload.note ? { note: payload.note } : {};
  return apiRequest<RequestProviderCoreTaskCompletionResponse>(endpoints.provider.coreTaskRequestCompletion(taskId), {
    authToken,
    body,
    method: 'POST',
  });
}

export function reportProviderCoreTaskIssue(
  taskId: string,
  payload: ProviderCoreIssueActionPayload,
  authToken: string,
): Promise<ApiResult<ProviderCoreIssueActionResponse>> {
  return apiRequest<ProviderCoreIssueActionResponse>(endpoints.provider.coreTaskReportIssue(taskId), {
    authToken,
    body: toProviderIssueActionBody(payload),
    method: 'POST',
  });
}

export function reportProviderCannotAttend(
  taskId: string,
  payload: ProviderCoreIssueActionPayload,
  authToken: string,
): Promise<ApiResult<ProviderCoreIssueActionResponse>> {
  return apiRequest<ProviderCoreIssueActionResponse>(endpoints.provider.coreTaskCannotAttend(taskId), {
    authToken,
    body: toProviderIssueActionBody(payload),
    method: 'POST',
  });
}

export function requestProviderCoreTaskSupport(
  taskId: string,
  payload: ProviderCoreIssueActionPayload,
  authToken: string,
): Promise<ApiResult<ProviderCoreIssueActionResponse>> {
  return apiRequest<ProviderCoreIssueActionResponse>(endpoints.provider.coreTaskSupportRequest(taskId), {
    authToken,
    body: toProviderIssueActionBody(payload),
    method: 'POST',
  });
}

function toProviderIssueActionBody(payload: ProviderCoreIssueActionPayload) {
  return {
    ...(payload.details ? { details: payload.details } : null),
    reason: payload.reason,
  };
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

export function submitOrUpdateProviderProResponse(
  proRequestId: string,
  payload: ProviderProResponsePayload,
  authToken: string,
): Promise<ApiResult<ProviderProResponseMutationResponse>> {
  return apiRequest<ProviderProResponseMutationResponse>(endpoints.provider.proRequestResponse(proRequestId), {
    authToken,
    body: toProviderProResponseBody(payload),
    method: 'POST',
  });
}

export function acceptProviderProSiteVisit(
  proRequestId: string,
  siteVisitId: string,
  payload: ProviderProSiteVisitAcceptPayload,
  authToken: string,
): Promise<ApiResult<ProviderProSiteVisitActionResponse>> {
  return apiRequest<ProviderProSiteVisitActionResponse>(endpoints.provider.proRequestSiteVisitAccept(proRequestId, siteVisitId), {
    authToken,
    body: payload.message ? { message: payload.message } : {},
    method: 'POST',
  });
}

export function declineProviderProSiteVisit(
  proRequestId: string,
  siteVisitId: string,
  payload: ProviderProSiteVisitDeclinePayload,
  authToken: string,
): Promise<ApiResult<ProviderProSiteVisitActionResponse>> {
  return apiRequest<ProviderProSiteVisitActionResponse>(endpoints.provider.proRequestSiteVisitDecline(proRequestId, siteVisitId), {
    authToken,
    body: {
      ...(payload.message ? { message: payload.message } : null),
      ...(payload.reason ? { reason: payload.reason } : null),
    },
    method: 'POST',
  });
}

export function proposeProviderProSiteVisitTime(
  proRequestId: string,
  siteVisitId: string,
  payload: ProviderProSiteVisitProposeTimePayload,
  authToken: string,
): Promise<ApiResult<ProviderProSiteVisitActionResponse>> {
  return apiRequest<ProviderProSiteVisitActionResponse>(endpoints.provider.proRequestSiteVisitProposeTime(proRequestId, siteVisitId), {
    authToken,
    body: {
      ...(payload.message ? { message: payload.message } : null),
      ...(payload.proposedDate ? { proposedDate: payload.proposedDate } : null),
      proposedTimeWindow: payload.proposedTimeWindow,
    },
    method: 'POST',
  });
}

export function getProviderProfile(authToken: string): Promise<ApiResult<ProviderProfileResponse>> {
  return apiRequest<ProviderProfileResponse>(endpoints.provider.profile, {
    authToken,
    method: 'GET',
  });
}

function toProviderProResponseBody(payload: ProviderProResponsePayload) {
  return {
    ...(payload.assumptions ? { assumptions: payload.assumptions } : null),
    ...(payload.availability ? { availability: payload.availability } : null),
    ...(payload.currency ? { currency: payload.currency } : null),
    ...(payload.customerPreparationNotes ? { customerPreparationNotes: payload.customerPreparationNotes } : null),
    ...(payload.earliestStartDate ? { earliestStartDate: payload.earliestStartDate } : null),
    ...(payload.excludedNotes ? { excludedNotes: payload.excludedNotes } : null),
    ...(payload.includedNotes ? { includedNotes: payload.includedNotes } : null),
    ...(payload.materialsIncluded !== undefined ? { materialsIncluded: payload.materialsIncluded } : null),
    ...(payload.roughQuoteMax !== undefined ? { roughQuoteMax: payload.roughQuoteMax } : null),
    ...(payload.roughQuoteMin !== undefined ? { roughQuoteMin: payload.roughQuoteMin } : null),
    ...(payload.siteVisitPolicy ? { siteVisitPolicy: payload.siteVisitPolicy } : null),
    shortMessage: payload.shortMessage,
  };
}
