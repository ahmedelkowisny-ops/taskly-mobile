import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  compact?: boolean;
  iconOnly?: boolean;
  showMark?: boolean;
  style?: StyleProp<ViewStyle>;
  wordmarkOnly?: boolean;
};

export function TasklyLogoText({
  compact = false,
  iconOnly = false,
  showMark = false,
  style,
  wordmarkOnly = false,
}: TasklyLogoTextProps) {
  if (iconOnly) {
    return (
      <View style={[styles.row, style]}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="Taskly"
          resizeMode="contain"
          source={require('@/assets/branding/taskly-logo-icon.png')}
          style={[styles.mark, compact ? styles.markCompact : null]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      {showMark && !wordmarkOnly ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="Taskly"
          resizeMode="contain"
          source={require('@/assets/branding/taskly-logo-icon.png')}
          style={[styles.mark, compact ? styles.markCompact : null]}
        />
      ) : null}
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
    height: 46,
    width: 178,
  },
  logoCompact: {
    height: 38,
    width: 148,
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
