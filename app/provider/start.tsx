import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ModeBadge, ProviderStatusCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth, type CoreTaskerStatus, type ProStatus } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import {
  getProviderModeSummary,
  getRecommendedProviderNextAction,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function getCoreActionLabel(coreTaskerStatus: CoreTaskerStatus) {
  if (coreTaskerStatus === 'applicant') {
    return t('continueCoreTaskerOnboarding');
  }

  if (coreTaskerStatus === 'approved' || coreTaskerStatus === 'needsStripe') {
    return 'Check Core status';
  }

  return 'Start Core Tasker onboarding';
}

function getProActionLabel(proStatus: ProStatus) {
  if (proStatus === 'pending') {
    return 'View Pro review status';
  }

  if (proStatus === 'approved') {
    return 'View matching Pro requests';
  }

  return 'Start or continue Pro application';
}

export default function ProviderStartScreen() {
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const summary = getProviderModeSummary(session);
  const nextAction = getRecommendedProviderNextAction(session);
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;

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
        <StatusBadge label={status === 'authenticated' ? 'Backend role status' : status === 'demo' ? 'Demo role status' : 'Demo fallback'} tone="neutral" />
        <AppText variant="sectionTitle">{summary}</AppText>
        <AppText color={colors.slate700}>{nextAction}</AppText>
      </AppCard>

      <ProviderStatusCard
        accent="core"
        actionLabel={getCoreActionLabel(coreTaskerStatus)}
        description="For small fixed-scope tasks. Requires approval and Stripe verification for Core payouts."
        statusLabel={t('stripeVerificationCorePayouts')}
        title={t('coreTasker')}
      />

      <ProviderStatusCard
        accent="pro"
        actionLabel={getProActionLabel(proStatus)}
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
