import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCustomerWorkspaceSummary } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? getMockUserSession();

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">Welcome to Taskly</AppText>
        <AppText color={colors.slate700}>
          Welcome, {session.user.displayName}. Choose the right service path inside your Customer Workspace.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label={status === 'authenticated' ? 'Backend session' : status === 'demo' ? 'Demo session' : 'Workspace guidance'} tone="core" />
        <AppText variant="sectionTitle">{getCustomerWorkspaceSummary(session)}</AppText>
        <AppText color={colors.slate700}>
          Post task and Pro request actions remain placeholders until posting flows are connected.
        </AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Customer Core" tone="core" />
          <AppText variant="sectionTitle">{t('postTask')}</AppText>
          <AppText color={colors.slate700}>
            For small, fixed-scope jobs where a Core Tasker can help nearby.
          </AppText>
          <AppButton onPress={() => router.push('/customer/onboarding')}>{t('postTask')}</AppButton>
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label="Customer Pro" tone="pro" />
          <AppText variant="sectionTitle">{t('postProRequest')}</AppText>
          <AppText color={colors.slate700}>
            For larger projects where comparing professional Pro responses matters.
          </AppText>
          <AppButton onPress={() => router.push('/customer/onboarding')} tone="pro">
            {t('postProRequest')}
          </AppButton>
        </AppCard>
      </View>

      <AssistantGuideCard
        body="Taskly helps you choose the right path: small fixed-scope tasks or larger Pro projects."
        title="Choose the right path"
        tone="pro"
      />

      <EmptyStateCard
        body="Upcoming tasks, Pro requests, and messages will appear here after real data is connected."
        title="No upcoming activity"
      />

      <AppButton onPress={() => router.push('/customer/onboarding')} variant="outline">
        {t('setupCustomerWorkspace')}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
});
