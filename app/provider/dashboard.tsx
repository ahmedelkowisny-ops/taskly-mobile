import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, ModeBadge, ProviderStatusCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import {
  getCoreTaskerStatusLabel,
  getProStatusLabel,
  getProviderModeSummary,
  getRecommendedProviderNextAction,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const displayName = authSession?.user.displayName ?? mockAuth.currentSession.displayName;
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const coreStatusLabel = getCoreTaskerStatusLabel(coreTaskerStatus);
  const proStatusLabel = getProStatusLabel(proStatus);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.badges}>
          <StatusBadge label="Provider" tone="neutral" />
          <StatusBadge label={status === 'authenticated' ? 'Backend session' : status === 'demo' ? 'Demo session' : 'Demo fallback'} tone="neutral" />
        </View>
        <AppText variant="screenTitle">{t('providerWorkspace')}</AppText>
        <AppText color={colors.slate700}>
          Welcome, {displayName}. Core and Pro are separate modes inside the Provider Workspace.
        </AppText>
      </View>

      <ProviderStatusCard
        accent="neutral"
        actionLabel="Review provider setup"
        description="Core tasks and Pro requests stay separate so payments, responses, and customer expectations remain clear."
        onPress={() => router.push('/provider/start')}
        statusLabel={getProviderModeSummary(session)}
        title="Provider status"
      />

      <AppCard>
        <StatusBadge label="Recommended next action" tone="neutral" />
        <AppText variant="sectionTitle">{getRecommendedProviderNextAction(session)}</AppText>
        <AppText color={colors.slate700}>
          {status === 'authenticated'
            ? 'This recommendation comes from the backend session.'
            : 'Demo mode keeps provider guidance available while real data is not connected.'}
        </AppText>
      </AppCard>

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600} style={styles.panel}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">{t('coreTasks')}</AppText>
          <AppText color={colors.slate700}>
            Core Tasker work can live inside the Provider Workspace alongside Pro work.
          </AppText>
          <StatusBadge label={coreStatusLabel} tone="core" />
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50} style={styles.panel}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('proRequests')}</AppText>
          <AppText color={colors.slate700}>
            Taskly Pro requests stay visually and functionally separate from Core Tasks.
          </AppText>
          <StatusBadge label={proStatusLabel} tone="pro" />
        </AppCard>
      </View>

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">Core payout status</AppText>
          <AppText color={colors.slate700}>{t('stripeVerificationCorePayouts')}.</AppText>
          <StatusBadge label={coreStatusLabel} tone={coreTaskerStatus === 'approved' ? 'success' : 'warning'} />
        </AppCard>

        <AppCard accentColor={colors.proAmber500} backgroundColor={colors.proOrange50}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">Profile strength</AppText>
          <AppText color={colors.slate700}>{t('proProfileReview')} and category approval are required for Pro work.</AppText>
          <StatusBadge label={proStatusLabel} tone={proStatus === 'approved' ? 'success' : 'pro'} />
        </AppCard>
      </View>

      <AssistantGuideCard
        body="Core Tasks and Pro Requests stay separate so each mode can follow backend-approved rules inside one Taskly app."
        title="Mode guidance"
        tone="pro"
      />

      <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
        {t('startProviderWorkspace')}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  panel: {
    minHeight: 142,
  },
});
