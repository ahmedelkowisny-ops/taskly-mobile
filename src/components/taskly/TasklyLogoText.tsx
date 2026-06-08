import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  compact?: boolean;
  header?: boolean;
  iconOnly?: boolean;
  navIcon?: boolean;
  showMark?: boolean;
  style?: StyleProp<ViewStyle>;
  wordmarkOnly?: boolean;
};

export function TasklyLogoText({
  compact = false,
  header = false,
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
          source={require('../../../assets/branding/taskly-header-logo-transparent-720x180.png')}
          style={[styles.mark, compact ? styles.markCompact : null, navIcon ? styles.markNav : null]}
        />
      </View>
    );
  }

  if (header && wordmarkOnly) {
    return (
      <View accessibilityLabel="Taskly" style={[styles.headerLogo, style]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require('../../../assets/branding/taskly-header-logo-transparent-720x180.png')}
          style={styles.headerLogoImage}
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
          source={require('../../../assets/branding/taskly-header-logo-transparent-720x180.png')}
          style={[styles.mark, compact ? styles.markCompact : null, header ? styles.markHeader : null]}
        />
      ) : null}
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={wordmarkOnly ? 'Taskly' : undefined}
        resizeMode="contain"
        source={require('../../../assets/branding/taskly-header-logo-transparent-720x180.png')}
        style={[styles.logo, compact ? styles.logoCompact : null, header ? styles.logoHeader : null]}
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
  headerLogo: {
    height: 40,
    width: 160,
  },
  headerLogoImage: {
    height: 40,
    width: 160,
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
  logoHeader: {
    height: 40,
    width: 160,
  },
  markHeader: {
    height: 36,
    width: 36,
  },
  markNav: {
    borderRadius: 14,
    height: 42,
    width: 42,
  },
});
