import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type AppCardProps = PropsWithChildren<{
  accentColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ accentColor, backgroundColor = colors.white, children, style }: AppCardProps) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});
