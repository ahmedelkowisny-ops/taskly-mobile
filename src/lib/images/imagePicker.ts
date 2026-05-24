import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  ImageCompressionOptions,
  ImagePostingRules,
  ImageValidationResult,
  LocalSelectedImage,
  PickTasklyImagesOptions,
} from './types';

const DEFAULT_ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const DEFAULT_MAX_IMAGES = 10;
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_COMPRESSION = 0.75;
const DEFAULT_MAX_FILE_SIZE_BEFORE_COMPRESSION = 900_000;

function createLocalImageId(index: number) {
  return `local-image-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMimeType(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function shouldCompress(image: LocalSelectedImage, options: Required<ImageCompressionOptions>) {
  const longestSide = Math.max(image.width ?? 0, image.height ?? 0);
  const fileSize = image.fileSize ?? 0;

  return longestSide > options.maxWidth || fileSize > options.maxFileSizeBeforeCompression;
}

export async function requestImageLibraryPermission() {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (current.granted || current.accessPrivileges === 'limited') {
    return { granted: true };
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();

  return {
    granted: Boolean(requested.granted || requested.accessPrivileges === 'limited'),
  };
}

export async function pickTasklyImages(options: PickTasklyImagesOptions = {}) {
  const maxImages = options.maxImages ?? DEFAULT_MAX_IMAGES;
  const remainingSlots = Math.max(0, maxImages - (options.currentCount ?? 0));

  if (remainingSlots <= 0) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    allowsMultipleSelection: remainingSlots > 1,
    mediaTypes: ['images'],
    orderedSelection: true,
    quality: 1,
    selectionLimit: remainingSlots,
  });

  if (result.canceled) {
    return [];
  }

  return normalizePickedAssets(result.assets).slice(0, remainingSlots);
}

export function normalizePickedAssets(assets: ImagePicker.ImagePickerAsset[]) {
  return assets
    .filter((asset) => asset.type !== 'video' && asset.type !== 'pairedVideo')
    .map<LocalSelectedImage>((asset, index) => ({
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      height: asset.height || undefined,
      id: asset.assetId || createLocalImageId(index),
      mimeType: asset.mimeType,
      status: 'selected',
      uri: asset.uri,
      width: asset.width || undefined,
    }));
}

export function validateSelectedImages(
  images: LocalSelectedImage[],
  rules: ImagePostingRules = {},
): ImageValidationResult {
  const maxImages = rules.maxImages ?? DEFAULT_MAX_IMAGES;
  const acceptedTypes = (rules.acceptedImageTypes?.length ? rules.acceptedImageTypes : DEFAULT_ACCEPTED_IMAGE_TYPES).map(
    normalizeMimeType,
  );
  const accepted: LocalSelectedImage[] = [];
  const rejected: LocalSelectedImage[] = [];

  images.forEach((image) => {
    const mimeType = normalizeMimeType(image.mimeType);

    if (accepted.length >= maxImages) {
      rejected.push({ ...image, errorMessage: 'Photo limit reached', status: 'error' });
      return;
    }

    if (mimeType && !acceptedTypes.includes(mimeType)) {
      rejected.push({ ...image, errorMessage: 'This image type is not supported.', status: 'error' });
      return;
    }

    accepted.push(image);
  });

  return { accepted, rejected };
}

export async function compressSelectedImage(
  image: LocalSelectedImage,
  options: ImageCompressionOptions = {},
): Promise<LocalSelectedImage> {
  const normalizedOptions: Required<ImageCompressionOptions> = {
    compress: options.compress ?? DEFAULT_COMPRESSION,
    maxFileSizeBeforeCompression:
      options.maxFileSizeBeforeCompression ?? DEFAULT_MAX_FILE_SIZE_BEFORE_COMPRESSION,
    maxWidth: options.maxWidth ?? DEFAULT_MAX_WIDTH,
  };

  if (!shouldCompress(image, normalizedOptions)) {
    return { ...image, compressedUri: image.uri, status: 'compressed' };
  }

  try {
    const resizeAction =
      image.width && image.width > normalizedOptions.maxWidth
        ? [{ resize: { width: normalizedOptions.maxWidth } }]
        : [];
    const result = await ImageManipulator.manipulateAsync(image.uri, resizeAction, {
      compress: normalizedOptions.compress,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      ...image,
      compressedUri: result.uri,
      height: result.height || image.height,
      status: 'compressed',
      width: result.width || image.width,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'We could not process this photo.';

    return {
      ...image,
      errorMessage: message,
      status: 'error',
    };
  }
}

export async function compressSelectedImages(
  images: LocalSelectedImage[],
  options: ImageCompressionOptions = {},
) {
  return Promise.all(images.map((image) => compressSelectedImage(image, options)));
}

export const defaultAcceptedImageTypes = DEFAULT_ACCEPTED_IMAGE_TYPES;
