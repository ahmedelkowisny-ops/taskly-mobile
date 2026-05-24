import { StyleSheet, View } from 'react-native';

import { AppText, StatusBadge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type ImagePickerPlaceholderProps = {
  maxImages?: number;
  tone?: 'core' | 'pro';
};

export function ImagePickerPlaceholder({ maxImages = 10, tone = 'core' }: ImagePickerPlaceholderProps) {
  return (
    <View style={[styles.box, { backgroundColor: tone === 'pro' ? colors.proOrange50 : colors.tasklyBlue50 }]}>
      <StatusBadge label="Photos" tone={tone} />
      <AppText variant="bodyStrong">Image upload will be connected later</AppText>
      <AppText color={colors.slate700} variant="small">
        You will be able to add up to {maxImages} photos when the upload phase is connected.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
