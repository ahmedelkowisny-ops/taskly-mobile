import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, EmptyStateCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerHomeSummary } from '@/src/lib/api/customer';
import { CustomerHomeResponse } from '@/src/lib/api/domain';
import { getMockCustomerHomeResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerDashboardScreen() {
  useI18n();
  const { getValidAccessToken, status } = useAuth();
  const [homeData, setHomeData] = useState<CustomerHomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
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
      void loadDashboard();
    }, [loadDashboard]),
  );

  const summary = homeData?.summary;

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <AppText style={styles.title} variant="screenTitle">
          {t('drawerMyDashboard')}
        </AppText>
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t('customerDashboardIntro')}
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText variant="cardTitle">{t('loadingCustomerArea')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="cardTitle">
            {isUnauthorized ? t('signInToViewCustomerActivity') : t('couldNotRefreshCustomerActivity')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.buttonRow}>
            <AppButton onPress={loadDashboard} variant="outline">
              {t('retry')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <View style={styles.summaryCard}>
          <AppText variant="cardTitle">{t('customerSummaryTitle')}</AppText>
          <View style={styles.metricsGrid}>
            <Metric label={t('openShort')} value={summary.openTasksCount} />
            <Metric label={t('activeShort')} value={summary.activeTasksCount} />
            <Metric label={t('waitingApproval')} value={summary.pendingCompletionCount} />
            <Metric label={t('proResponsesShort')} value={summary.proResponsesAvailableCount} accent="pro" />
          </View>
        </View>
      ) : null}

      {homeData?.highlights.length ? (
        <View style={styles.activitySection}>
          <AppText variant="sectionTitle">{t('upcomingActivity')}</AppText>
          {homeData.highlights.map((highlight) => (
            <View
              key={highlight.id}
              style={[
                styles.activityCard,
                highlight.accent === 'pro' ? styles.activityCardPro : null,
                highlight.accent === 'warning' ? styles.activityCardWarning : null,
              ]}>
              <StatusBadge
                label={highlight.statusLabel}
                tone={highlight.accent === 'pro' ? 'pro' : highlight.accent === 'warning' ? 'warning' : 'core'}
              />
              <AppText variant="cardTitle">{highlight.title}</AppText>
              <AppText color={colors.slate700}>{highlight.description}</AppText>
            </View>
          ))}
        </View>
      ) : !isLoading && !errorMessage && !isUnauthorized ? (
        <EmptyStateCard
          body={t('noUpcomingActivityBody')}
          title={t('noUpcomingActivity')}
        />
      ) : null}

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function Metric({ accent = 'core', label, value }: { accent?: 'core' | 'pro'; label: string; value: number }) {
  return (
    <View style={[styles.metric, accent === 'pro' ? styles.metricPro : null]}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText style={styles.metricNumber} variant="sectionTitle">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  activityCardPro: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F3D6AF',
  },
  activityCardWarning: {
    backgroundColor: '#FFFBF2',
    borderColor: '#F8D8A7',
  },
  activitySection: {
    gap: spacing.md,
  },
  buttonRow: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  metric: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  metricNumber: {
    fontSize: 24,
    lineHeight: 30,
  },
  metricPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  screen: {
    backgroundColor: '#F7F9FB',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
});
