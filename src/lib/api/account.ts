import { apiRequest } from './client';
import { endpoints } from './endpoints';
import { ChangePasswordRequest, ChangePasswordResponse } from './domain';
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
