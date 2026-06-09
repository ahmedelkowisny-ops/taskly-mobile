import { apiRequest } from './client';
import { CustomerRewardsAction, CustomerRewardsActionResponse, CustomerRewardsResponse } from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';

export function getCustomerRewards(authToken: string): Promise<ApiResult<CustomerRewardsResponse>> {
  return apiRequest<CustomerRewardsResponse>(endpoints.customer.rewards, { authToken });
}

export function getProviderRewards(authToken: string): Promise<ApiResult<CustomerRewardsResponse>> {
  return apiRequest<CustomerRewardsResponse>(endpoints.provider.rewards, { authToken });
}

export function submitCustomerRewardsAction(
  action: CustomerRewardsAction,
  authToken: string,
): Promise<ApiResult<CustomerRewardsActionResponse>> {
  return apiRequest<CustomerRewardsActionResponse>(endpoints.customer.rewards, {
    authToken,
    body: { action },
    method: 'POST',
  });
}
