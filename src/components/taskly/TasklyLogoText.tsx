import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  compact?: boolean;
  iconOnly?: boolean;
  navIcon?: boolean;
  showMark?: boolean;
  style?: StyleProp<ViewStyle>;
  wordmarkOnly?: boolean;
};

export function TasklyLogoText({
  compact = false,
  iconOnly = false,
  navIcon = false,
  showMark = false,
  style,
  wordmarkOnly = false,
}: TasklyLogoTextProps) {
  if (iconOnly || navIcon) {
    return (
      <View style={[styles.row, style]}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="Taskly"
          resizeMode="contain"
          source={require('@/assets/branding/taskly-logo-icon.png')}
          style={[styles.mark, compact ? styles.markCompact : null, navIcon ? styles.markNav : null]}
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
  markNav: {
    borderRadius: 14,
    height: 42,
    width: 42,
  },
});
