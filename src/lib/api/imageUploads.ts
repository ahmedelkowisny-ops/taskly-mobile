import { apiRequest } from './client';
import { CustomerImageUploadResponse, ProviderTaskerProfilePhotoUploadResponse } from './domain';
import { endpoints } from './endpoints';
import { ApiResult } from './types';
import { LocalSelectedImage } from '@/src/lib/images/types';

const MIME_BY_EXTENSION: Record<string, string> = {
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
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

function getUploadFileName(image: LocalSelectedImage, index: number) {
  if (image.fileName?.trim()) {
    return image.fileName.trim();
  }

  const extension = getExtension(image.compressedUri) ?? getExtension(image.uri) ?? 'jpg';
  return `taskly-photo-${index + 1}.${extension}`;
}

function getUploadMimeType(image: LocalSelectedImage, fileName: string, uri: string) {
  if (image.mimeType?.trim()) {
    return image.mimeType.trim();
  }

  const extension = getExtension(fileName) ?? getExtension(uri);
  return extension ? MIME_BY_EXTENSION[extension] ?? 'image/jpeg' : 'image/jpeg';
}

function buildImageFormData(image: LocalSelectedImage, index: number) {
  const uri = getUploadUri(image);
  const name = getUploadFileName(image, index);
  const type = getUploadMimeType(image, name, uri);
  const formData = new FormData();

  formData.append('image', { name, type, uri } as unknown as Blob);

  return formData;
}

export function canUploadSelectedImage(image: LocalSelectedImage) {
  const uri = getUploadUri(image);

  return image.status !== 'error' && Boolean(uri) && !uri.startsWith('data:');
}

export function uploadCustomerTaskImage(
  taskId: string,
  image: LocalSelectedImage,
  authToken: string,
  index = 0,
): Promise<ApiResult<CustomerImageUploadResponse>> {
  return apiRequest<CustomerImageUploadResponse>(endpoints.customer.taskImageUpload(taskId), {
    authToken,
    body: buildImageFormData(image, index),
    method: 'POST',
    timeoutMs: 30000,
  });
}

export function uploadCustomerProRequestImage(
  proRequestId: string,
  image: LocalSelectedImage,
  authToken: string,
  index = 0,
): Promise<ApiResult<CustomerImageUploadResponse>> {
  return apiRequest<CustomerImageUploadResponse>(endpoints.customer.proRequestImageUpload(proRequestId), {
    authToken,
    body: buildImageFormData(image, index),
    method: 'POST',
    timeoutMs: 30000,
  });
}

export function uploadProviderTaskerProfilePhoto(
  image: LocalSelectedImage,
  authToken: string,
): Promise<ApiResult<ProviderTaskerProfilePhotoUploadResponse>> {
  return apiRequest<ProviderTaskerProfilePhotoUploadResponse>(endpoints.provider.taskerProfilePhoto, {
    authToken,
    body: buildImageFormData(image, 0),
    method: 'POST',
    timeoutMs: 30000,
  });
}
