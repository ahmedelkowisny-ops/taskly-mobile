import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { LanguageToggle } from './LanguageToggle';
import { TasklyLogoText } from './TasklyLogoText';

export function PublicTopBar({ children }: PropsWithChildren) {
  return (
    <View style={styles.topRow}>
      <View style={styles.brandMark}>
        <TasklyLogoText compact iconOnly />
      </View>
      <View style={styles.topActions}>
        {children}
        <LanguageToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DCEBFA',
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 1,
    height: 46,
    justifyContent: 'center',
    shadowColor: colors.navy900,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    width: 46,
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
  },
});
