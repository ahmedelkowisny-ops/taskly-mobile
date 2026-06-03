import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, StatusBadge } from '@/src/components/ui';
import { LocalSelectedImage } from '@/src/lib/images/types';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type ImagePickerAccent = 'core' | 'neutral' | 'pro';

type ImagePickerPlaceholderProps = {
  acceptedImageTypes?: string[];
  accent?: ImagePickerAccent;
  disabled?: boolean;
  errorMessage?: string | null;
  helperBodyText?: string;
  helperText?: string;
  images?: LocalSelectedImage[];
  isProcessing?: boolean;
  maxImages?: number;
  onPickImages?: () => void;
  onRemoveImage?: (imageId: string) => void;
  tone?: 'core' | 'pro';
};

function getAccentColor(accent: ImagePickerAccent) {
  if (accent === 'pro') return colors.proOrange600;
  if (accent === 'neutral') return colors.slate500;
  return colors.tasklyBlue600;
}

function getAccentBackground(accent: ImagePickerAccent) {
  if (accent === 'pro') return colors.proOrange50;
  if (accent === 'neutral') return colors.slate50;
  return colors.tasklyBlue50;
}

export function ImagePickerPlaceholder({
  accent,
  disabled = false,
  errorMessage,
  helperBodyText,
  helperText,
  images = [],
  isProcessing = false,
  maxImages = 10,
  onPickImages,
  onRemoveImage,
  tone,
}: ImagePickerPlaceholderProps) {
  const resolvedAccent = accent ?? tone ?? 'core';
  const selectedCount = images.length;
  const maxReached = selectedCount >= maxImages;
  const buttonDisabled = disabled || isProcessing || maxReached;
  const statusTone = resolvedAccent === 'pro' ? 'pro' : resolvedAccent === 'neutral' ? 'neutral' : 'core';

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: getAccentBackground(resolvedAccent),
          borderColor: getAccentColor(resolvedAccent),
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <StatusBadge label={t('selectedPhotos')} tone={statusTone} />
          <AppText variant="bodyStrong">
            {selectedCount}/{maxImages}
          </AppText>
        </View>
        {maxReached ? <StatusBadge label={t('photoLimitReached')} tone="warning" /> : null}
      </View>

      <AppText color={colors.slate700}>
        {helperText || t('photosStayLocal')}
      </AppText>

      {images.length ? (
        <View style={styles.grid}>
          {images.map((image) => (
            <View key={image.id} style={styles.previewCard}>
              <Image source={{ uri: image.compressedUri || image.uri }} style={styles.preview} />
              <View style={styles.previewCopy}>
                <StatusBadge
                  label={image.status === 'error' ? t('couldNotProcessPhoto') : image.status}
                  tone={image.status === 'error' ? 'danger' : 'success'}
                />
                {image.errorMessage ? (
                  <AppText color={colors.danger600} variant="small">
                    {image.errorMessage}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel={t('removePhoto')}
                accessibilityRole="button"
                onPress={() => onRemoveImage?.(image.id)}
                style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.72 : 1 }]}>
                <AppText color={colors.danger600} variant="small">
                  {t('removePhoto')}
                </AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <AppText color={colors.slate700}>{helperBodyText || t('imageUploadLater')}</AppText>
          <AppText color={colors.slate500} variant="small">
            {t('photosStayLocal')}
          </AppText>
        </View>
      )}

      {errorMessage ? (
        <AppText color={colors.danger600} variant="small">
          {errorMessage}
        </AppText>
      ) : null}

      <AppButton disabled={buttonDisabled} loading={isProcessing} onPress={onPickImages} tone={statusTone}>
        {isProcessing ? t('compressingPhotos') : maxReached ? t('photoLimitReached') : t('addPhotos')}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyPreview: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preview: {
    aspectRatio: 1,
    backgroundColor: colors.slate100,
    borderRadius: radius.sm,
    width: '100%',
  },
  previewCard: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 132,
    padding: spacing.sm,
  },
  previewCopy: {
    gap: spacing.xs,
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
