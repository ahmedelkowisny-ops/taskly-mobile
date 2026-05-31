import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, LanguageToggle, NotificationSettingsCard } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;

export default function CustomerAccountScreen() {
  useI18n();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { session: authSession, logout } = useAuth();
  const session = authSession ?? getMockUserSession();
  const displayName = session.user.displayName;
  const email = session.user.email ?? '';

  const handleLogout = async () => {
    await logout();
    router.replace(LOGIN_ROUTE);
  };

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <AppText style={styles.title} variant="screenTitle">
        {t('account')}
      </AppText>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <AppText color={colors.white} style={styles.avatarInitial}>
            {displayName.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.profileMeta}>
          <AppText variant="bodyStrong">{displayName}</AppText>
          <AppText color={colors.slate500} variant="caption">{email}</AppText>
        </View>
      </View>

      <NotificationSettingsCard workspace="customer" />

      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowIcon}>
            <Ionicons color={colors.slate700} name="language-outline" size={18} />
          </View>
          <AppText style={styles.settingsLabel}>{t('drawerLanguage')}</AppText>
          <LanguageToggle />
        </View>
      </View>

      <AppButton onPress={handleLogout} tone="neutral" variant="outline">
        {t('drawerLogout')}
      </AppButton>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  settingsRowIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
});
