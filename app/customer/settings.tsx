import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, LanguageToggle, NotificationSettingsCard } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;

export default function CustomerSettingsScreen() {
  useI18n();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace(LOGIN_ROUTE);
  };

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <AppText style={styles.title} variant="screenTitle">
          {t('drawerSettings')}
        </AppText>
        <AppText color={colors.slate700}>{t('customerSettingsIntro')}</AppText>
      </View>

      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowIcon}>
            <Ionicons color={colors.slate700} name="language-outline" size={18} />
          </View>
          <View style={styles.settingsText}>
            <AppText style={styles.settingsLabel}>{t('drawerLanguage')}</AppText>
            <AppText color={colors.slate500} variant="caption">
              {t('languageSettingHelper')}
            </AppText>
          </View>
          <LanguageToggle />
        </View>
      </View>

      <NotificationSettingsCard workspace="customer" />

      <AppButton onPress={() => router.push('/customer/profile' as Href)} tone="neutral" variant="outline">
        {t('drawerProfile')}
      </AppButton>
      <AppButton onPress={handleLogout} tone="neutral" variant="outline">
        {t('drawerLogout')}
      </AppButton>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingsRowIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  settingsText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
});
