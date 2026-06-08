import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { LanguageToggle } from './LanguageToggle';
import { TasklyLogoText } from './TasklyLogoText';

type PublicTopBarProps = PropsWithChildren;

export function PublicTopBar({ children }: PublicTopBarProps) {
  return (
    <View style={styles.topRow}>
      <View style={styles.brandWordmark}>
        <TasklyLogoText header wordmarkOnly />
      </View>
      <View style={styles.topActions}>
        {children}
        <LanguageToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandWordmark: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topRow: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.lg,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
});
