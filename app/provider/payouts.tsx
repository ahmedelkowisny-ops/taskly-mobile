import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { EmptyStateCard, isHistoryProviderCoreTask, ProviderTopBar } from '@/src/components/taskly';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse, ProviderProfileSummary } from '@/src/lib/api/domain';
import { getProviderCoreTasks, getProviderProfile, refreshPayoutStatus, startPayoutSetup } from '@/src/lib/api/provider';
import type { ApiError } from '@/src/lib/api/types';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

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
    <AppCard accentColor={colors.success600} backgroundColor={colors.white} style={styles.payoutRow}>
      <View style={styles.rowHeader}>
        <StatusBadge label={task.statusLabel} tone={task.status.toUpperCase() === 'COMPLETED' ? 'core' : 'neutral'} />
        {payout ? <AppText color={colors.success600} variant="bodyStrong">{payout}</AppText> : null}
      </View>
      <AppText style={styles.taskTitle} variant="bodyStrong">{task.title}</AppText>
      <AppText color={colors.slate700} variant="small">
        {task.categoryLabel} - {task.cityLabel}
      </AppText>
      {dateLabel ? <AppText color={colors.slate500} variant="small">{dateLabel}</AppText> : null}
      {breakdown?.tasklyFeeLabel ? (
        <View style={styles.breakdownSurface}>
          <AppText color={colors.slate500} variant="small">
            {t('providerPaymentBreakdown')}: {breakdown.grossTaskPriceLabel} - {t('tasklyFee')}: {breakdown.tasklyFeeLabel} - {payout}
          </AppText>
        </View>
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
  const router = useRouter();
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

      <AppCard accentColor={colors.tasklyBlue600} style={styles.header}>
        <AppText variant="screenTitle">{t('payouts')}</AppText>
        <AppText color={colors.slate700}>{t('payoutsIntro')}</AppText>
      </AppCard>

      {needsStripe ? (
        <AppCard
          accentColor={payoutStatus?.isReady ? colors.success600 : colors.tasklyBlue600}
          backgroundColor={payoutStatus?.isReady ? colors.success50 : colors.white}
          style={styles.stripeCard}>
          <AppText variant="bodyStrong">{payoutStatus?.isReady ? t('yourPayoutsAreReady') : t('stripeVerificationNeeded')}</AppText>
          <AppText color={colors.slate700}>{t('stripeVerificationHelper')}</AppText>
          <AppText color={colors.slate500} variant="small">{t('stripePayoutsExplanation')}</AppText>
          {payoutStatus && payoutStatus.taskerStatus !== 'VERIFIED' ? (
            <View style={styles.warningSurface}>
              <AppText color={colors.warning600} variant="small">{t('completeTaskerProfileFirst')}</AppText>
            </View>
          ) : null}
          {payoutErrorMessage ? (
            <View style={styles.errorSurface}>
              <AppText color={colors.danger600} variant="small">{payoutErrorMessage}</AppText>
            </View>
          ) : null}
          {payoutNotice ? (
            <View style={styles.successSurface}>
              <AppText color={colors.success600} variant="small">{payoutNotice}</AppText>
            </View>
          ) : null}
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
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{t('payouts')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={load} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && completedTasks.length > 0 ? (
        <AppCard backgroundColor={colors.tasklyBlue50} style={styles.payoutBreakdownCard}>
          <View style={styles.payoutBreakdownRow}>
            <View style={styles.payoutIconBox}>
              <Ionicons color={colors.tasklyBlue600} name="wallet-outline" size={20} />
            </View>
            <View style={styles.payoutBreakdownText}>
              <AppText color={colors.slate500} variant="small">{t('estimatedPayoutLabel')}</AppText>
              {totalPayoutLabel ? (
                <AppText color={colors.navy900} variant="bodyStrong">{totalPayoutLabel}</AppText>
              ) : (
                <AppText color={colors.navy900} variant="bodyStrong">{completedTasks.length} {t('taskHistory').toLowerCase()}</AppText>
              )}
            </View>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && completedTasks.length === 0 ? (
        <EmptyStateCard
          actionLabel={t('browseAvailableTasks')}
          body={t('noPayoutsYetBody')}
          icon="wallet-outline"
          onActionPress={() => router.push('/provider/core-tasks' as Href)}
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
  breakdownSurface: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  errorSurface: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    borderColor: colors.border,
    gap: spacing.sm,
  },
  payoutBreakdownCard: {
    ...designTokens.shadows.card,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
  },
  payoutBreakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  payoutBreakdownText: {
    flex: 1,
    gap: 2,
  },
  payoutIconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  payoutRow: {
    borderColor: colors.border,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  stack: { gap: spacing.sm },
  stateCard: {
    borderColor: colors.border,
  },
  stripeCard: {
    borderColor: colors.tasklyBlueBorder,
  },
  successSurface: {
    backgroundColor: colors.success50,
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  taskTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  warningSurface: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
