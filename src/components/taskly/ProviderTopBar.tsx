import Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

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
          <View style={styles.brandWordmark}>
            <TasklyLogoText header style={styles.logo} wordmarkOnly />
          </View>
        </View>
        <View style={styles.topBarActions}>
          <NotificationBell compact route={'/provider/notifications' as Href} />
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
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  brandWordmark: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minWidth: 0,
  },
  logo: {
    alignSelf: 'flex-start',
  },
  menuButton: {
    ...designTokens.shadows.card,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  topBarActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
});
