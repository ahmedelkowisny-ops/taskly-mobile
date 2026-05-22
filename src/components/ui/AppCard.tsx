import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type AppCardProps = PropsWithChildren<{
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ accentColor, children, style }: AppCardProps) {
  return (
    <View style={[styles.card, accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
