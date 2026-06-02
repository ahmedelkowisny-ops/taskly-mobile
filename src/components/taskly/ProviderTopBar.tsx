import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { LanguageToggle } from './LanguageToggle';
import { NotificationBell } from './NotificationBell';
import { ProviderDrawer } from './ProviderDrawer';
import { TasklyLogoText } from './TasklyLogoText';

export function ProviderTopBar() {
  useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.brandCluster}>
          <Pressable
            accessibilityLabel={t('menu')}
            accessibilityRole="button"
            onPress={() => setDrawerOpen(true)}
            style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}>
            <Ionicons color={colors.navy900} name="menu" size={21} />
          </Pressable>
          <TasklyLogoText navIcon />
        </View>
        <View style={styles.topBarActions}>
          <NotificationBell compact />
          <LanguageToggle />
        </View>
      </View>
      <ProviderDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </>
  );
}

const styles = StyleSheet.create({
  brandCluster: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    height: 40,
    justifyContent: 'center',
    shadowColor: colors.navy900,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    width: 40,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  topBarActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
