import { apiRequest } from './client';
import { MessageThreadDetailResponse, MessageThreadsResponse } from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';

export function getMessageThreads(authToken: string): Promise<ApiResult<MessageThreadsResponse>> {
  return apiRequest<MessageThreadsResponse>(endpoints.messages.threads, {
    authToken,
    method: 'GET',
  });
}

export function getMessageThread(
  threadId: string,
  authToken: string,
): Promise<ApiResult<MessageThreadDetailResponse>> {
  return apiRequest<MessageThreadDetailResponse>(endpoints.messages.threadDetail(threadId), {
    authToken,
    method: 'GET',
  });
}
