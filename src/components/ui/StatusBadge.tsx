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

const toneStyles: Record<StatusTone, { backgroundColor: string; borderColor: string; color: string }> = {
  core: { backgroundColor: colors.tasklyBlue50, borderColor: '#CFE1F4', color: colors.tasklyBlue700 },
  pro: { backgroundColor: colors.proOrange50, borderColor: colors.proOrangeBorder, color: colors.proOrangeText },
  success: { backgroundColor: colors.success50, borderColor: '#BBF7D0', color: colors.success600 },
  warning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: colors.warning600 },
  danger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: colors.danger600 },
  neutral: { backgroundColor: colors.slate50, borderColor: colors.border, color: colors.navy900 },
};

export function StatusBadge({ label, style, tone = 'neutral' }: StatusBadgeProps) {
  const badgeTone = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeTone.backgroundColor, borderColor: badgeTone.borderColor },
        style,
      ]}>
      <AppText color={badgeTone.color} variant="small">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
