import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  wordmarkOnly?: boolean;
};

export function TasklyLogoText({ compact = false, style, wordmarkOnly = false }: TasklyLogoTextProps) {
  return (
    <View style={[styles.row, style]}>
      {wordmarkOnly ? null : (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="Taskly"
          resizeMode="contain"
          source={require('@/assets/branding/taskly-logo-icon.png')}
          style={[styles.mark, compact ? styles.markCompact : null]}
        />
      )}
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={wordmarkOnly ? 'Taskly' : undefined}
        resizeMode="contain"
        source={require('@/assets/branding/taskly-logo.png')}
        style={[styles.logo, compact ? styles.logoCompact : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  logo: {
    height: 34,
    width: 132,
  },
  logoCompact: {
    height: 28,
    width: 108,
  },
  mark: {
    borderRadius: radius.sm,
    height: 44,
    width: 44,
  },
  markCompact: {
    height: 34,
    width: 34,
  },
});
