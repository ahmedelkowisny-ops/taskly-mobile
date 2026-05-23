import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, ModeBadge, ProviderStatusCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getProviderDashboard } from '@/src/lib/api/provider';
import { ProviderDashboardResponse } from '@/src/lib/api/domain';
import { getMockProviderDashboardResponse } from '@/src/lib/api/mockApi';
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
  const { getValidAccessToken, session: authSession, status, useDemoSession } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const [data, setData] = useState<ProviderDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const summary = data?.summary;
  const displayName = summary?.displayName ?? authSession?.user.displayName ?? mockAuth.currentSession.displayName;
  const coreStatusLabel = getCoreTaskerStatusLabel(summary?.coreTaskerStatus ?? coreTaskerStatus);
  const proStatusLabel = getProStatusLabel(summary?.proStatus ?? proStatus);

  const loadDashboard = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderDashboardResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const result = await getProviderDashboard(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? 'Login or Provider Workspace access is required.'
        : 'Could not load Provider Workspace data.',
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

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

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label="Loading" tone="neutral" />
          <AppText variant="sectionTitle">Loading Provider Workspace</AppText>
          <AppText color={colors.slate700}>Fetching read-only provider status from Taskly.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Provider data needs access' : 'Could not refresh provider data'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry or continue in demo mode while the backend is unavailable.'}
          </AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDashboard} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              Continue in demo mode
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label={status === 'demo' ? 'Demo data' : 'Live read-only data'} tone={status === 'demo' ? 'neutral' : 'success'} />
          <AppText variant="sectionTitle">Provider summary</AppText>
          <View style={styles.metricsGrid}>
            <Metric label="Available Core" value={summary.availableCoreTasksCount} />
            <Metric label="Active Core" value={summary.activeCoreTasksCount + summary.reservedCoreTasksCount} />
            <Metric label="Pro matches" value={summary.matchingProRequestsCount} />
            <Metric label="Responses" value={summary.submittedProResponsesCount} />
          </View>
        </AppCard>
      ) : null}

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
        <AppText variant="sectionTitle">{data?.nextActions[0]?.label ?? getRecommendedProviderNextAction(session)}</AppText>
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

      {data?.cards.length ? (
        <View style={styles.grid}>
          {data.cards.map((card) => (
            <AppCard
              key={card.id}
              accentColor={card.accent === 'pro' ? colors.proOrange600 : card.accent === 'warning' ? colors.warning600 : colors.tasklyBlue600}
              backgroundColor={card.accent === 'pro' ? colors.proOrange50 : colors.white}>
              <StatusBadge label={card.statusLabel} tone={card.accent === 'pro' ? 'pro' : card.accent === 'warning' ? 'warning' : 'core'} />
              <AppText variant="sectionTitle">{card.title}</AppText>
              <AppText color={colors.slate700}>{card.description}</AppText>
            </AppCard>
          ))}
        </View>
      ) : null}

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
  stack: {
    gap: spacing.sm,
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
  metric: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText variant="sectionTitle">{value}</AppText>
    </View>
  );
}
