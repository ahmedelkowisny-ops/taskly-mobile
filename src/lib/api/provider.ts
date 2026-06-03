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
  ProviderProPortfolioPhotoRemoveResponse,
  ProviderProPortfolioProjectResponse,
  ProviderProPortfolioResponse,
  ProviderProProfileResponse,
  ProviderProfileResponse,
  ProviderStripeOnboardingLinkResponse,
  ProviderStripeRefreshStatusResponse,
  ProviderTaskerProfileResponse,
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
  UpdateProviderProProfilePayload,
  UpdateProviderTaskerProfilePayload,
  UpsertProviderProPortfolioProjectPayload,
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

export function startPayoutSetup(authToken: string): Promise<ApiResult<ProviderStripeOnboardingLinkResponse>> {
  return apiRequest<ProviderStripeOnboardingLinkResponse>(endpoints.provider.stripeOnboardingLink, {
    authToken,
    body: {},
    method: 'POST',
  });
}

export const getStripeOnboardingLink = startPayoutSetup;

export function refreshPayoutStatus(authToken: string): Promise<ApiResult<ProviderStripeRefreshStatusResponse>> {
  return apiRequest<ProviderStripeRefreshStatusResponse>(endpoints.provider.stripeRefreshStatus, {
    authToken,
    body: {},
    method: 'POST',
  });
}

export const refreshStripeStatus = refreshPayoutStatus;

export function getProviderTaskerProfile(authToken: string): Promise<ApiResult<ProviderTaskerProfileResponse>> {
  return apiRequest<ProviderTaskerProfileResponse>(endpoints.provider.taskerProfile, {
    authToken,
    method: 'GET',
  });
}

export function updateProviderTaskerProfile(
  payload: UpdateProviderTaskerProfilePayload,
  authToken: string,
): Promise<ApiResult<ProviderTaskerProfileResponse>> {
  return apiRequest<ProviderTaskerProfileResponse>(endpoints.provider.taskerProfile, {
    authToken,
    body: {
      bio: payload.bio ?? '',
      firstName: payload.firstName,
      hasCar: payload.hasCar,
      hourlyRate: payload.hourlyRate ?? '',
      languagesSpoken: payload.languagesSpoken ?? [],
      lastName: payload.lastName,
      phone: payload.phone ?? '',
      serviceArea: payload.serviceArea ?? '',
      toolsEquipment: payload.toolsEquipment ?? [],
      ...(payload.availability ? { availability: payload.availability } : null),
      ...(payload.cityId ? { cityId: payload.cityId } : null),
      ...(payload.serviceCategorySlugs ? { serviceCategorySlugs: payload.serviceCategorySlugs } : null),
    },
    method: 'PATCH',
  });
}

export function getProviderProProfile(authToken: string): Promise<ApiResult<ProviderProProfileResponse>> {
  return apiRequest<ProviderProProfileResponse>(endpoints.provider.proProfile, {
    authToken,
    method: 'GET',
  });
}

export function updateProviderProProfile(
  payload: UpdateProviderProProfilePayload,
  authToken: string,
): Promise<ApiResult<ProviderProProfileResponse>> {
  return apiRequest<ProviderProProfileResponse>(endpoints.provider.proProfile, {
    authToken,
    body: {
      bio: payload.bio ?? '',
      businessType: payload.businessType ?? '',
      displayName: payload.displayName,
      internalEmail: payload.internalEmail ?? '',
      internalPhone: payload.internalPhone ?? '',
      invoiceAvailable: payload.invoiceAvailable,
      languages: payload.languages ?? [],
      profileImageUrl: payload.profileImageUrl ?? '',
      quotePreference: payload.quotePreference ?? '',
      siteVisitPreference: payload.siteVisitPreference ?? '',
      teamSize: payload.teamSize ?? '',
      tradeName: payload.tradeName ?? '',
      warrantyNote: payload.warrantyNote ?? '',
      yearsExperience: payload.yearsExperience ?? '',
    },
    method: 'PATCH',
  });
}

export function getProviderProPortfolio(authToken: string): Promise<ApiResult<ProviderProPortfolioResponse>> {
  return apiRequest<ProviderProPortfolioResponse>(endpoints.provider.proProfilePortfolio, {
    authToken,
    method: 'GET',
  });
}

function toPortfolioProjectBody(payload: UpsertProviderProPortfolioProjectPayload) {
  return {
    approximateDuration: payload.approximateDuration ?? '',
    categoryName: payload.categoryName ?? '',
    cityName: payload.cityName ?? '',
    customerPermissionConfirmed: payload.customerPermissionConfirmed,
    description: payload.description ?? '',
    optionalPriceRange: payload.optionalPriceRange ?? '',
    title: payload.title,
    ...(payload.imageType !== undefined ? { imageType: payload.imageType } : null),
    ...(payload.imageUrls !== undefined ? { imageUrls: payload.imageUrls } : null),
  };
}

export function createProviderProPortfolioProject(
  payload: UpsertProviderProPortfolioProjectPayload,
  authToken: string,
): Promise<ApiResult<ProviderProPortfolioProjectResponse>> {
  return apiRequest<ProviderProPortfolioProjectResponse>(endpoints.provider.proProfilePortfolio, {
    authToken,
    body: toPortfolioProjectBody(payload),
    method: 'POST',
  });
}

export function updateProviderProPortfolioProject(
  projectId: string,
  payload: UpsertProviderProPortfolioProjectPayload,
  authToken: string,
): Promise<ApiResult<ProviderProPortfolioProjectResponse>> {
  return apiRequest<ProviderProPortfolioProjectResponse>(endpoints.provider.proProfilePortfolioProject(projectId), {
    authToken,
    body: toPortfolioProjectBody(payload),
    method: 'PATCH',
  });
}

export function deleteProviderProPortfolioProject(
  projectId: string,
  authToken: string,
): Promise<ApiResult<{ ok: true }>> {
  return apiRequest<{ ok: true }>(endpoints.provider.proProfilePortfolioProject(projectId), {
    authToken,
    method: 'DELETE',
  });
}

export function removeProviderPortfolioProjectPhoto(
  projectId: string,
  imageId: string,
  authToken: string,
): Promise<ApiResult<ProviderProPortfolioPhotoRemoveResponse>> {
  return apiRequest<ProviderProPortfolioPhotoRemoveResponse>(
    endpoints.provider.proProfilePortfolioProjectPhotoRemove(projectId, imageId),
    {
      authToken,
      method: 'DELETE',
    },
  );
}

function toProviderProResponseBody(payload: ProviderProResponsePayload) {
  return {
    ...(payload.assumptions ? { assumptions: payload.assumptions } : null),
    ...(payload.availability ? { availability: payload.availability } : null),
    ...(payload.customerPreparationNotes ? { customerPreparationNotes: payload.customerPreparationNotes } : null),
    ...(payload.earliestStartDate ? { earliestStartDate: payload.earliestStartDate } : null),
    ...(payload.excludedItems ? { excludedItems: payload.excludedItems } : null),
    ...(payload.excludedNotes ? { excludedNotes: payload.excludedNotes } : null),
    ...(payload.estimateConfidence ? { estimateConfidence: payload.estimateConfidence } : null),
    ...(payload.estimatedDuration ? { estimatedDuration: payload.estimatedDuration } : null),
    ...(payload.includedItems ? { includedItems: payload.includedItems } : null),
    ...(payload.includedNotes ? { includedNotes: payload.includedNotes } : null),
    ...(payload.materialsIncluded !== undefined ? { materialsIncluded: payload.materialsIncluded } : null),
    ...(payload.responseType ? { responseType: payload.responseType } : null),
    ...(payload.roughQuoteMax !== undefined ? { roughQuoteMax: payload.roughQuoteMax } : null),
    ...(payload.roughQuoteMin !== undefined ? { roughQuoteMin: payload.roughQuoteMin } : null),
    ...(payload.siteVisitPolicy ? { siteVisitPolicy: payload.siteVisitPolicy } : null),
    shortMessage: payload.shortMessage,
  };
}
