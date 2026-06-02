import { apiRequest } from './client';
import { MessageThreadDetailResponse, MessageThreadsResponse, SendMessageResponse } from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';
import { LocalSelectedImage } from '@/src/lib/images/types';

export function respondToSupportResolution(
  supportRequestId: string,
  payload: { decision: 'accepted' | 'refused'; reason?: string },
  authToken: string,
): Promise<ApiResult<MessageThreadDetailResponse>> {
  return apiRequest<MessageThreadDetailResponse>(endpoints.customer.supportResolution(supportRequestId), {
    authToken,
    body: payload,
    method: 'PATCH',
  });
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getExtension(value: string | undefined) {
  const match = String(value || '').toLowerCase().match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  return match?.[1] || null;
}

function getUploadUri(image: LocalSelectedImage) {
  if (image.status === 'compressed' && image.compressedUri) {
    return image.compressedUri;
  }

  return image.uri;
}

function getUploadFileName(image: LocalSelectedImage) {
  if (image.fileName?.trim()) {
    return image.fileName.trim();
  }

  const extension = getExtension(image.compressedUri) ?? getExtension(image.uri) ?? 'jpg';
  return `taskly-chat-photo.${extension}`;
}

function getUploadMimeType(image: LocalSelectedImage, fileName: string, uri: string) {
  if (image.mimeType?.trim()) {
    return image.mimeType.trim();
  }

  const extension = getExtension(fileName) ?? getExtension(uri);
  return extension ? MIME_BY_EXTENSION[extension] ?? 'image/jpeg' : 'image/jpeg';
}

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

export function sendMessage(
  threadId: string,
  body: string,
  authToken: string,
): Promise<ApiResult<SendMessageResponse>> {
  return apiRequest<SendMessageResponse>(endpoints.messages.sendMessage(threadId), {
    authToken,
    body: { body },
    method: 'POST',
  });
}

export function sendMessageImage(
  threadId: string,
  image: LocalSelectedImage,
  authToken: string,
): Promise<ApiResult<SendMessageResponse>> {
  const uri = getUploadUri(image);

  if (image.status === 'error' || !uri || uri.startsWith('data:')) {
    return Promise.resolve({
      error: {
        code: 'INVALID_IMAGE',
        message: 'Could not send photo.',
      },
      ok: false,
    });
  }

  const name = getUploadFileName(image);
  const type = getUploadMimeType(image, name, uri);
  const formData = new FormData();
  formData.append('image', { name, type, uri } as unknown as Blob);

  return apiRequest<SendMessageResponse>(endpoints.messages.sendMessage(threadId), {
    authToken,
    body: formData,
    method: 'POST',
    timeoutMs: 30000,
  });
}
