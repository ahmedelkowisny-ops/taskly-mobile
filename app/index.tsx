import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TasklyLogoText, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700} style={styles.subtitle}>
          One app for posting jobs, managing provider work, and staying connected.
        </AppText>
      </View>

      <View style={styles.cards}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('customerWorkspace')} tone="core" />
          <AppText variant="sectionTitle">{t('customerWorkspace')}</AppText>
          <AppText color={colors.slate700}>
            For posting tasks, Pro requests, payments, messages, approvals, and support.
          </AppText>
          <AppButton onPress={() => router.push('/customer/home')}>{t('enterCustomerWorkspace')}</AppButton>
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <View style={styles.badges}>
            <StatusBadge label={t('providerWorkspace')} tone="pro" />
            <StatusBadge label={t('coreTasks')} tone="core" />
          </View>
          <AppText variant="sectionTitle">{t('providerWorkspace')}</AppText>
          <AppText color={colors.slate700}>
            For managing Core tasks, Pro requests, profile status, responses, and messages.
          </AppText>
          <AppButton onPress={() => router.push('/provider/dashboard')} tone="pro">
            {t('enterProviderWorkspace')}
          </AppButton>
        </AppCard>
      </View>

      <AppText color={colors.slate500} style={styles.note} variant="caption">
        You can switch workspaces when your account has the right permissions.
      </AppText>

      <WorkspaceSwitchHint compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  note: {
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 360,
  },
});
