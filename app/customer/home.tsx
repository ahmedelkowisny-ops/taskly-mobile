import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyStateCard, LanguageToggle, TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerHomeSummary } from '@/src/lib/api/customer';
import { CustomerHomeResponse } from '@/src/lib/api/domain';
import { getMockCustomerHomeResponse, getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  useI18n();
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
        ? t('signInToLoadCustomerArea')
        : t('couldNotLoadCustomerArea'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const summary = homeData?.summary;
  const displayName = session.user.displayName;

  return (
    <Screen>
      <View style={styles.topBar}>
        <TasklyLogoText />
        <LanguageToggle />
      </View>

      <View style={styles.header}>
        <AppText style={styles.screenTitle} variant="screenTitle">
          {t('welcomeName').replace('{name}', displayName)}
        </AppText>
        <AppText color={colors.slate700}>{t('customerHomePromise')}</AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText variant="sectionTitle">{t('loadingCustomerArea')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('signInToViewCustomerActivity') : t('couldNotRefreshCustomerActivity')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.buttonRow}>
            <AppButton onPress={loadHome} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <AppText variant="sectionTitle">{t('customerSummaryTitle')}</AppText>
          <View style={styles.metricsGrid}>
            <Metric label={t('openShort')} value={summary.openTasksCount} />
            <Metric label={t('activeShort')} value={summary.activeTasksCount} />
            <Metric label={t('waitingApproval')} value={summary.pendingCompletionCount} />
            <Metric label={t('proResponsesShort')} value={summary.proResponsesAvailableCount} />
          </View>
        </AppCard>
      ) : null}

      <View style={styles.actions}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Taskly" tone="core" />
          <AppText variant="sectionTitle">{t('tasklyTaskActionTitle')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyTaskActionBody')}</AppText>
          <AppButton onPress={() => router.push('/customer/post-task' as Href)}>{t('postTaskShort')}</AppButton>
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label="Taskly Pro" tone="pro" />
          <AppText variant="sectionTitle">{t('tasklyProActionTitle')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyProActionBody')}</AppText>
          <AppButton onPress={() => router.push('/customer/post-pro-request' as Href)} tone="pro">
            {t('startProRequestShort')}
          </AppButton>
        </AppCard>
      </View>

      {homeData?.highlights.length ? (
        <View style={styles.actions}>
          <AppText variant="sectionTitle">{t('upcomingActivity')}</AppText>
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
          body={t('noUpcomingActivityBody')}
          title={t('noUpcomingActivity')}
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
    padding: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  screenTitle: {
    fontSize: 26,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
