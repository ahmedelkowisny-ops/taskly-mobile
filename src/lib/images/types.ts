export type LocalSelectedImageStatus = 'compressed' | 'error' | 'selected';

export type LocalSelectedImage = {
  compressedFileSize?: number;
  compressedUri?: string;
  errorMessage?: string;
  fileName?: string | null;
  fileSize?: number;
  height?: number;
  id: string;
  mimeType?: string | null;
  status: LocalSelectedImageStatus;
  uri: string;
  width?: number;
};

export type ImagePostingRules = {
  acceptedImageTypes?: string[];
  maxImages?: number;
};

export type PickTasklyImagesOptions = {
  currentCount?: number;
  maxImages?: number;
};

export type ImageCompressionOptions = {
  compress?: number;
  maxFileSizeBeforeCompression?: number;
  maxWidth?: number;
};

export type ImageValidationResult = {
  accepted: LocalSelectedImage[];
  rejected: LocalSelectedImage[];
};
