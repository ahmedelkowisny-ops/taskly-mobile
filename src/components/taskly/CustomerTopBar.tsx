import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { LanguageToggle } from './LanguageToggle';
import { NotificationBell } from './NotificationBell';
import { TasklyLogoText } from './TasklyLogoText';

type CustomerTopBarProps = {
  onMenuPress?: () => void;
};

export function CustomerTopBar(_props: CustomerTopBarProps = {}) {
  useI18n();
  const router = useRouter();
  const { logout } = useAuth();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  function navigate(route: Href) {
    setAccountMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    setAccountMenuVisible(false);
    await logout();
    router.replace('/login' as Href);
  }

  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.brandWordmark}>
          <TasklyLogoText header style={styles.logo} wordmarkOnly />
        </View>
        <View style={styles.topBarActions}>
          <NotificationBell compact />
          <LanguageToggle />
          <Pressable
            accessibilityLabel={t('accountMenu')}
            accessibilityRole="button"
            onPress={() => setAccountMenuVisible(true)}
            style={({ pressed }) => [styles.accountButton, pressed ? styles.pressed : null]}>
            <Ionicons color={colors.navy900} name="person-circle-outline" size={24} />
          </Pressable>
        </View>
      </View>

      <Modal animationType="slide" onRequestClose={() => setAccountMenuVisible(false)} transparent visible={accountMenuVisible}>
        <View style={styles.sheetOverlay}>
          <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={() => setAccountMenuVisible(false)} style={styles.scrim} />
          <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <AppText variant="sectionTitle">{t('accountMenu')}</AppText>
              <AccountMenuRow icon="person-outline" label={t('viewProfile')} onPress={() => navigate('/customer/profile' as Href)} />
              <AccountMenuRow icon="settings-outline" label={t('settings')} onPress={() => navigate('/customer/settings' as Href)} />
              <AccountMenuRow icon="help-circle-outline" label={t('helpAndSupport')} onPress={() => navigate('/customer/support' as Href)} />
              <View style={styles.menuDivider} />
              <AccountMenuRow danger icon="log-out-outline" label={t('drawerLogout')} onPress={handleLogout} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function AccountMenuRow({ danger = false, icon, label, onPress }: { danger?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void | Promise<void> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed ? styles.pressed : null]}>
      <View style={[styles.menuIconBox, danger ? styles.menuIconBoxDanger : null]}>
        <Ionicons color={danger ? colors.danger600 : colors.tasklyBlue600} name={icon} size={20} />
      </View>
      <AppText color={danger ? colors.danger600 : colors.navy900} style={styles.menuRowLabel}>
        {label}
      </AppText>
      <Ionicons color={colors.slate500} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountButton: {
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
  menuDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs,
  },
  menuIconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderRadius: radius.lg,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  menuIconBoxDanger: {
    backgroundColor: colors.proOrange50,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.xs,
    width: 44,
  },
  sheetOverlay: {
    backgroundColor: 'rgba(8, 12, 20, 0.24)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetSafeArea: {
    justifyContent: 'flex-end',
  },
});
