import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TasklyLogoText, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
  getProviderModeSummary,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();
  const session = mockAuth.currentSession;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700} style={styles.subtitle}>
          One app for posting jobs, managing provider work, and staying connected.
        </AppText>
      </View>

      <AppCard>
        <View style={styles.badges}>
          <StatusBadge label={`Demo user: ${session.displayName}`} tone="neutral" />
          <StatusBadge
            label={canAccessCustomerWorkspace(session) ? t('customerWorkspace') : 'Customer pending'}
            tone={canAccessCustomerWorkspace(session) ? 'core' : 'neutral'}
          />
          <StatusBadge
            label={canAccessProviderWorkspace(session) ? getProviderModeSummary(session) : 'Provider pending'}
            tone={canAccessProviderWorkspace(session) ? 'pro' : 'neutral'}
          />
        </View>
        <AppText color={colors.slate700}>
          Static demo state only. Real sign-in and role permissions will come from the Taskly backend later.
        </AppText>
      </AppCard>

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

      <AppCard>
        <StatusBadge label="How Taskly works" tone="neutral" />
        <View style={styles.howItWorks}>
          <View style={styles.howItem}>
            <StatusBadge label={t('customerWorkspace')} tone="core" />
            <AppText color={colors.slate700}>Post tasks or Pro requests.</AppText>
          </View>
          <View style={styles.howItem}>
            <StatusBadge label={t('providerWorkspace')} tone="pro" />
            <AppText color={colors.slate700}>Manage Core tasks and Pro requests.</AppText>
          </View>
          <View style={styles.howItem}>
            <StatusBadge label="Admin" tone="neutral" />
            <AppText color={colors.slate700}>{t('adminWebOnly')}.</AppText>
          </View>
        </View>
      </AppCard>

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
  howItWorks: {
    gap: spacing.md,
  },
  howItem: {
    gap: spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 360,
  },
});
