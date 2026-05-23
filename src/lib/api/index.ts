export { getCurrentSession, loginWithEmailPassword, logoutMobileSession, refreshMobileSession } from './auth';
export { createApiClient, apiRequest } from './client';
export { assertApiBaseUrl, getApiBaseUrl } from './config';
export { getCustomerHomeSummary, getCustomerProRequests, getCustomerTasks } from './customer';
export { endpoints } from './endpoints';
export { getProviderCoreTasks, getProviderDashboard, getProviderProfile, getProviderProRequests } from './provider';
export {
  getMockCustomerHomeResponse,
  getMockCustomerHomeSummary,
  getMockCustomerProRequestsResponse,
  getMockCustomerTasksResponse,
  getMockProviderCoreTasksResponse,
  getMockProviderDashboardResponse,
  getMockProviderDashboardSummary,
  getMockProviderProfileResponse,
  getMockProviderProRequestsResponse,
  getMockUserSession,
} from './mockApi';
export type { ApiClientConfig, TasklyApiClient } from './client';
export type {
  CustomerHighlight,
  CustomerHomeSummary,
  CustomerHomeResponse,
  CustomerNextAction,
  CustomerProRequestSummary,
  CustomerProRequestsResponse,
  CustomerTaskSummary,
  CustomerTasksResponse,
  EmptyStateContent,
  MessageThreadSummary,
  NextAction,
  NotificationPreferenceSummary,
  PaymentActionState,
  ProRequestDetail,
  ProRequestSummary,
  ProResponsePreview,
  ProviderCoreTasksResponse,
  ProviderCoreTaskSummary,
  ProviderDashboardCard,
  ProviderDashboardResponse,
  ProviderDashboardSummary,
  ProviderNextAction,
  ProviderProfileResponse,
  ProviderProfileSummary,
  ProviderProCategoryStatus,
  ProviderProRequestsResponse,
  ProviderProRequestSummary,
  TaskDetail,
  TaskSummary,
} from './domain';
export type {
  ApiError,
  ApiRequestOptions,
  ApiResult,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  PermissionSummary,
  ProviderCapabilities,
  RefreshRequest,
  RefreshResponse,
  SessionNextAction,
  SessionNextActionType,
  UserSession,
  WorkspaceAccess,
} from './types';

export const apiFoundationStatus = 'not-connected';
