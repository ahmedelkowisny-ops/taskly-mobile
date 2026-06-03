import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { EmptyStateCard, isHistoryProviderCoreTask, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse, ProviderProfileSummary } from '@/src/lib/api/domain';
import { getProviderCoreTasks, getProviderProfile, refreshPayoutStatus, startPayoutSetup } from '@/src/lib/api/provider';
import type { ApiError } from '@/src/lib/api/types';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function PayoutRow({ task }: { task: ProviderCoreTaskSummary }) {
  const breakdown = task.providerPaymentBreakdown;
  const payout = breakdown?.providerPayoutLabel ?? null;
  const dateLabel = formatDate(task.scheduledStartAt ?? task.scheduledEndAt);

  return (
    <AppCard backgroundColor={colors.white}>
      <View style={styles.rowHeader}>
        <StatusBadge label={task.statusLabel} tone={task.status.toUpperCase() === 'COMPLETED' ? 'core' : 'neutral'} />
        {payout ? <AppText color={colors.success600} variant="bodyStrong">{payout}</AppText> : null}
      </View>
      <AppText variant="bodyStrong">{task.title}</AppText>
      <AppText color={colors.slate700} variant="small">
        {task.categoryLabel} - {task.cityLabel}
      </AppText>
      {dateLabel ? <AppText color={colors.slate500} variant="small">{dateLabel}</AppText> : null}
      {breakdown?.tasklyFeeLabel ? (
        <AppText color={colors.slate500} variant="small">
          {t('providerPaymentBreakdown')}: {breakdown.grossTaskPriceLabel} - {t('tasklyFee')}: {breakdown.tasklyFeeLabel} - {payout}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function getPayoutActionErrorMessage(error: ApiError, fallback = t('couldNotOpenStripeSetup')) {
  if (error.code === 'TASKER_REVIEW_PENDING' || error.message === 'TASKER_REVIEW_PENDING') {
    return t('completeTaskerProfileFirst');
  }
  if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
    return t('loginRequired');
  }
  return fallback;
}

export default function ProviderPayoutsScreen() {
  useI18n();
  const { getValidAccessToken, refreshSession, session, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [profile, setProfile] = useState<ProviderProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingPayoutSetup, setIsStartingPayoutSetup] = useState(false);
  const [isRefreshingPayoutStatus, setIsRefreshingPayoutStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [payoutErrorMessage, setPayoutErrorMessage] = useState<string | null>(null);

  const payoutStatus = profile?.payoutStatus ?? null;
  const needsStripe = payoutStatus ? !payoutStatus.isReady : session?.providerCapabilities?.coreTaskerStatus === 'needsStripe';

  const load = useCallback(async () => {
    setErrorMessage(null);
    setPayoutErrorMessage(null);

    if (status === 'demo') {
      setData(getMockProviderCoreTasksResponse());
      setProfile(null);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setProfile(null);
      setErrorMessage(t('loginRequired'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setData(null);
      setProfile(null);
      setErrorMessage(t('loginRequired'));
      setIsLoading(false);
      return;
    }

    const [result, profileResult] = await Promise.all([
      getProviderCoreTasks(authToken),
      getProviderProfile(authToken),
    ]);
    setIsLoading(false);
    if (result.ok) {
      setData(result.data);
    } else {
      setData(null);
        setErrorMessage(t('couldNotRefreshProviderDashboard'));
    }
    setProfile(profileResult.ok ? profileResult.data.profile : null);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const completedTasks = (data?.tasks ?? []).filter(
    (task) => isHistoryProviderCoreTask(task) && task.status.toUpperCase() === 'COMPLETED',
  );

  const totalPayoutLabel = completedTasks.reduce<string | null>((_, task) => {
    return task.providerPaymentBreakdown?.providerPayoutLabel ?? null;
  }, null);

  async function handleStartPayoutSetup() {
    setPayoutNotice(null);
    setPayoutErrorMessage(null);

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setPayoutErrorMessage(t('loginRequired'));
      return;
    }

    setIsStartingPayoutSetup(true);
    const result = await startPayoutSetup(authToken);
    setIsStartingPayoutSetup(false);

    if (!result.ok) {
      setPayoutErrorMessage(getPayoutActionErrorMessage(result.error));
      return;
    }

    setProfile(result.data.profile);

    if (!result.data.onboardingUrl) {
      setPayoutErrorMessage(t('couldNotOpenStripeSetup'));
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(result.data.onboardingUrl);
      if (!canOpen) {
        setPayoutErrorMessage(t('couldNotOpenStripeSetup'));
        return;
      }
      await Linking.openURL(result.data.onboardingUrl);
      setPayoutNotice(t('stripeSetupOpened'));
    } catch {
      setPayoutErrorMessage(t('couldNotOpenStripeSetup'));
    }
  }

  async function handleRefreshPayoutStatus() {
    setPayoutNotice(null);
    setPayoutErrorMessage(null);

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setPayoutErrorMessage(t('loginRequired'));
      return;
    }

    setIsRefreshingPayoutStatus(true);
    const result = await refreshPayoutStatus(authToken);
    setIsRefreshingPayoutStatus(false);

    if (!result.ok) {
      setPayoutErrorMessage(getPayoutActionErrorMessage(result.error, t('couldNotRefreshPayoutStatus')));
      return;
    }

    setProfile(result.data.profile);
    await refreshSession();
    setPayoutNotice(t('payoutStatusRefreshed'));
  }

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('payouts')}</AppText>
        <AppText color={colors.slate700}>{t('payoutsIntro')}</AppText>
      </View>

      {needsStripe ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={payoutStatus?.isReady ? t('payoutsReady') : t('payoutSetupNeedsAttention')} tone={payoutStatus?.isReady ? 'success' : 'warning'} />
          <AppText variant="bodyStrong">{payoutStatus?.isReady ? t('yourPayoutsAreReady') : t('stripeVerificationNeeded')}</AppText>
          <AppText color={colors.slate700}>{t('stripeVerificationHelper')}</AppText>
          <AppText color={colors.slate500} variant="small">{t('stripePayoutsExplanation')}</AppText>
          {payoutStatus && payoutStatus.taskerStatus !== 'VERIFIED' ? (
            <AppText color={colors.warning600} variant="small">{t('completeTaskerProfileFirst')}</AppText>
          ) : null}
          {payoutErrorMessage ? <AppText color={colors.warning600} variant="small">{payoutErrorMessage}</AppText> : null}
          {payoutNotice ? <AppText color={colors.success600} variant="small">{payoutNotice}</AppText> : null}
          <View style={styles.stack}>
            {payoutStatus?.canOpenOnboarding ? (
              <AppButton loading={isStartingPayoutSetup} onPress={handleStartPayoutSetup}>
                {payoutStatus.hasStripeAccount ? t('continueStripeSetup') : t('setUpPayouts')}
              </AppButton>
            ) : null}
            <AppButton
              disabled={payoutStatus?.canRefresh === false || isStartingPayoutSetup}
              loading={isRefreshingPayoutStatus}
              onPress={handleRefreshPayoutStatus}
              variant="outline">
              {t('refreshPayoutStatus')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label={t('loading')} tone="neutral" />
          <AppText color={colors.slate700}>{t('payouts')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('couldNotRefreshProviderDashboard')} tone="warning" />
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={load} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && completedTasks.length > 0 ? (
        <AppCard backgroundColor={colors.tasklyBlue50}>
          <AppText color={colors.slate500} variant="small">{t('totalEarnings')}</AppText>
          <AppText variant="sectionTitle">{completedTasks.length} {t('taskHistory').toLowerCase()}</AppText>
          {totalPayoutLabel ? <AppText color={colors.success600} variant="bodyStrong">{totalPayoutLabel}</AppText> : null}
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && completedTasks.length === 0 ? (
        <EmptyStateCard
          body={t('noPayoutsYetBody')}
          icon="wallet-outline"
          title={t('noPayoutsYet')}
        />
      ) : null}

      {completedTasks.map((task) => (
        <PayoutRow key={task.id} task={task} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingTop: spacing.lg },
  header: { gap: spacing.sm },
  rowHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  screen: { backgroundColor: '#F7F9FB' },
  stack: { gap: spacing.sm },
});
