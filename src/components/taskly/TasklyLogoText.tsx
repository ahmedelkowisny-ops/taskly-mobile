import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  style?: StyleProp<ViewStyle>;
};

export function TasklyLogoText({ style }: TasklyLogoTextProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Taskly"
        resizeMode="contain"
        source={require('@/assets/branding/taskly-logo-icon.png')}
        style={styles.mark}
      />
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require('@/assets/branding/taskly-logo.png')}
        style={styles.logo}
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
  mark: {
    borderRadius: radius.sm,
    height: 44,
    width: 44,
  },
});
