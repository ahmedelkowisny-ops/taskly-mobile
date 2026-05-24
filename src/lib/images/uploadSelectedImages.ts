import {
  canUploadSelectedImage,
  uploadCustomerProRequestImage,
  uploadCustomerTaskImage,
} from '@/src/lib/api/imageUploads';
import { LocalSelectedImage } from './types';

export type UploadSelectedImagesSummary = {
  errors: string[];
  failed: number;
  skipped: number;
  total: number;
  uploaded: number;
};

type UploadSelectedImagesOptions = {
  authToken: string;
  entityId: string;
  entityType: 'proRequest' | 'task';
  images: LocalSelectedImage[];
  onProgress?: (progress: { current: number; total: number }) => void;
};

export async function uploadSelectedImagesSequentially({
  authToken,
  entityId,
  entityType,
  images,
  onProgress,
}: UploadSelectedImagesOptions): Promise<UploadSelectedImagesSummary> {
  const summary: UploadSelectedImagesSummary = {
    errors: [],
    failed: 0,
    skipped: 0,
    total: images.length,
    uploaded: 0,
  };

  const uploadableImages = images.filter((image) => {
    const canUpload = canUploadSelectedImage(image);
    if (!canUpload) {
      summary.skipped += 1;
    }

    return canUpload;
  });

  for (let index = 0; index < uploadableImages.length; index += 1) {
    onProgress?.({ current: index + 1, total: uploadableImages.length });

    const image = uploadableImages[index];
    const result =
      entityType === 'task'
        ? await uploadCustomerTaskImage(entityId, image, authToken, index)
        : await uploadCustomerProRequestImage(entityId, image, authToken, index);

    if (result.ok) {
      summary.uploaded += 1;
    } else {
      summary.failed += 1;
      summary.errors.push(result.error.message);
    }
  }

  return summary;
}
