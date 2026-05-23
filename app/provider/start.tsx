import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ModeBadge, ProviderStatusCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import {
  getProviderModeSummary,
  getRecommendedProviderNextAction,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function getCoreActionLabel() {
  const status = mockAuth.currentSession.providerCapabilities.coreTaskerStatus;

  if (status === 'applicant') {
    return t('continueCoreTaskerOnboarding');
  }

  if (status === 'approved' || status === 'needsStripe') {
    return 'Check Core status';
  }

  return 'Start Core Tasker onboarding';
}

function getProActionLabel() {
  const status = mockAuth.currentSession.providerCapabilities.proStatus;

  if (status === 'pending') {
    return 'View Pro review status';
  }

  if (status === 'approved') {
    return 'View matching Pro requests';
  }

  return 'Start or continue Pro application';
}

export default function ProviderStartScreen() {
  const router = useRouter();
  const session = mockAuth.currentSession;
  const summary = getProviderModeSummary(session);
  const nextAction = getRecommendedProviderNextAction(session);

  return (
    <Screen>
      <View style={styles.header}>
        <StatusBadge label={t('providerWorkspace')} tone="neutral" />
        <AppText variant="screenTitle">{t('startProviderWorkspace')}</AppText>
        <AppText color={colors.slate700}>
          You can work with small Core tasks, larger Pro requests, or both if your account is approved.
        </AppText>
      </View>

      <AppCard>
        <StatusBadge label="Demo role status" tone="neutral" />
        <AppText variant="sectionTitle">{summary}</AppText>
        <AppText color={colors.slate700}>{nextAction}</AppText>
      </AppCard>

      <ProviderStatusCard
        accent="core"
        actionLabel={getCoreActionLabel()}
        description="For small fixed-scope tasks. Requires approval and Stripe verification for Core payouts."
        statusLabel={t('stripeVerificationCorePayouts')}
        title={t('coreTasker')}
      />

      <ProviderStatusCard
        accent="pro"
        actionLabel={getProActionLabel()}
        description="For larger quote-based professional projects. Requires Pro profile review and category approval, without Stripe verification for Pro-only access."
        statusLabel={t('proProfileReview')}
        title={t('tasklyPro')}
      />

      <AppCard>
        <View style={styles.modeRow}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText color={colors.slate700}>
          Core Tasker and Taskly Pro modes can both live inside the Provider Workspace, but their statuses and customer expectations stay separate.
        </AppText>
      </AppCard>

      <AppButton onPress={() => router.push('/provider/dashboard')} tone="pro">
        {t('goToProviderDashboard')}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
