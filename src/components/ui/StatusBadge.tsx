import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from './AppText';

type StatusTone = 'core' | 'pro' | 'success' | 'warning' | 'danger' | 'neutral';

type StatusBadgeProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, { backgroundColor: string; color: string }> = {
  core: { backgroundColor: colors.tasklyBlue50, color: colors.tasklyBlue700 },
  pro: { backgroundColor: colors.proOrange50, color: colors.proOrange600 },
  success: { backgroundColor: colors.success50, color: colors.success600 },
  warning: { backgroundColor: '#FFFBEB', color: colors.warning600 },
  danger: { backgroundColor: '#FEF2F2', color: colors.danger600 },
  neutral: { backgroundColor: colors.slate100, color: colors.slate700 },
};

export function StatusBadge({ label, style, tone = 'neutral' }: StatusBadgeProps) {
  const badgeTone = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: badgeTone.backgroundColor }, style]}>
      <AppText color={badgeTone.color} variant="small">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
