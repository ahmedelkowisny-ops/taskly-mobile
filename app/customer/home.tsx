import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerHomeSummary } from '@/src/lib/api/customer';
import { CustomerHomeResponse } from '@/src/lib/api/domain';
import { getMockCustomerHomeResponse, getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCustomerWorkspaceSummary } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { getValidAccessToken, session: authSession, status, useDemoSession } = useAuth();
  const session = authSession ?? getMockUserSession();
  const [homeData, setHomeData] = useState<CustomerHomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadHome = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setHomeData(getMockCustomerHomeResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setHomeData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setHomeData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const result = await getCustomerHomeSummary(authToken);

    if (result.ok) {
      setHomeData(result.data);
      setIsLoading(false);
      return;
    }

    setHomeData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? 'Login is required to load your Customer Workspace.'
        : 'Could not load Customer Workspace data.',
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const summary = homeData?.summary;

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">Welcome to Taskly</AppText>
        <AppText color={colors.slate700}>
          Welcome, {session.user.displayName}. Choose the right service path inside your Customer Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading Customer Workspace</AppText>
          <AppText color={colors.slate700}>Fetching your read-only Taskly summary from the backend.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Customer data needs a real session' : 'Could not refresh customer data'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Login again, retry, or continue with demo data while the backend is unavailable.'}
          </AppText>
          <View style={styles.buttonRow}>
            <AppButton onPress={loadHome} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              Continue in demo mode
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={status === 'demo' ? 'Demo data' : 'Live read-only data'} tone={status === 'demo' ? 'neutral' : 'success'} />
          <AppText variant="sectionTitle">Customer summary</AppText>
          <View style={styles.metricsGrid}>
            <Metric label="Open" value={summary.openTasksCount} />
            <Metric label="Active" value={summary.activeTasksCount} />
            <Metric label="Completion" value={summary.pendingCompletionCount} />
            <Metric label="Pro" value={summary.proRequestsCount} />
          </View>
          <AppText color={colors.slate700}>
            {summary.proResponsesAvailableCount} Pro responses available and {summary.unreadMessagesCount} unread updates.
          </AppText>
        </AppCard>
      ) : null}

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

      {homeData?.highlights.length ? (
        <View style={styles.actions}>
          <AppText variant="sectionTitle">Upcoming activity</AppText>
          {homeData.highlights.map((highlight) => (
            <AppCard
              key={highlight.id}
              accentColor={highlight.accent === 'pro' ? colors.proOrange600 : highlight.accent === 'warning' ? colors.warning600 : colors.tasklyBlue600}
              backgroundColor={highlight.accent === 'pro' ? colors.proOrange50 : colors.white}>
              <StatusBadge
                label={highlight.statusLabel}
                tone={highlight.accent === 'pro' ? 'pro' : highlight.accent === 'warning' ? 'warning' : 'core'}
              />
              <AppText variant="sectionTitle">{highlight.title}</AppText>
              <AppText color={colors.slate700}>{highlight.description}</AppText>
            </AppCard>
          ))}
        </View>
      ) : (
        <EmptyStateCard
          body="Upcoming tasks, Pro requests, and messages will appear here after your first customer activity."
          title="No upcoming activity"
        />
      )}

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
  buttonRow: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
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
