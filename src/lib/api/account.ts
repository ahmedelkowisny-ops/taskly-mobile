import { apiRequest } from './client';
import { endpoints } from './endpoints';
import { ChangeEmailRequest, ChangeEmailResponse, ChangePasswordRequest, ChangePasswordResponse } from './domain';
import { ApiResult } from './types';

export function changePassword(
  payload: ChangePasswordRequest,
  authToken: string,
): Promise<ApiResult<ChangePasswordResponse>> {
  return apiRequest<ChangePasswordResponse>(endpoints.account.changePassword, {
    authToken,
    body: payload,
    method: 'POST',
  });
}

export function changeEmail(
  payload: ChangeEmailRequest,
  authToken: string,
): Promise<ApiResult<ChangeEmailResponse>> {
  return apiRequest<ChangeEmailResponse>(endpoints.account.changeEmail, {
    authToken,
    body: payload,
    method: 'POST',
  });
}
