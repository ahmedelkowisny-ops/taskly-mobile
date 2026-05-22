import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type EmptyStateCardProps = {
  actionLabel?: string;
  accent?: 'core' | 'pro';
  body: string;
  onActionPress?: () => void;
  title: string;
};

export function EmptyStateCard({
  actionLabel,
  accent = 'core',
  body,
  onActionPress,
  title,
}: EmptyStateCardProps) {
  const accentColor = accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;

  return (
    <AppCard accentColor={accentColor}>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">{title}</AppText>
        <AppText color={colors.slate700}>{body}</AppText>
      </View>
      {actionLabel ? (
        <AppButton onPress={onActionPress} tone={accent === 'pro' ? 'pro' : 'core'} variant="outline">
          {actionLabel}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: spacing.sm,
  },
});
