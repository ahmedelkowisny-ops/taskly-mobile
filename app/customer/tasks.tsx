import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, EmptyStateCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerTasks } from '@/src/lib/api/customer';
import {
  CoreCancellationState,
  CoreSupportState,
  CustomerCorePaymentState,
  CustomerTaskSummary,
  CustomerTasksResponse,
} from '@/src/lib/api/domain';
import { getMockCustomerTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type StatusTone = 'core' | 'pro' | 'success' | 'warning' | 'danger' | 'neutral';

export default function CustomerTasksScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockCustomerTasksResponse());
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

    const result = await getCustomerTasks(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? t('signInToViewTasklyTasks')
        : t('couldNotRefreshTasklyTasks'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  return (
    <Screen contentStyle={styles.screenContent}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.pageHeader}>
        <View style={styles.headerCopy}>
          <AppText variant="screenTitle">{t('myTasks')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyTasksIntro')}</AppText>
        </View>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600} style={styles.stateCard}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText variant="cardTitle">{t('loadingTasklyTasks')}</AppText>
          <AppText color={colors.slate700}>{t('loadingTasklyTasksBody')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600} style={styles.stateCard}>
          <StatusBadge
            label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')}
            tone={isUnauthorized ? 'warning' : 'danger'}
          />
          <AppText variant="cardTitle">
            {isUnauthorized ? t('signInToViewTasklyTasks') : t('couldNotRefreshTasklyTasks')}
          </AppText>
          <AppText color={colors.slate700}>{errorMessage || t('retryOrContinueDemoBackendUnavailable')}</AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadTasks} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {data?.tasks.length ? (
        <View style={styles.taskList}>
          {data.tasks.map((task) => (
            <TaskCard
              key={task.id}
              onPress={() => router.push(`/customer/tasks/${task.id}` as Href)}
              task={task}
            />
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          actionLabel={t('postTask')}
          body={data.emptyState.description}
          onActionPress={() => router.push('/customer/post-task' as Href)}
          title={data.emptyState.title}
        />
      ) : null}

      <AppCard style={styles.trustCard}>
        <View style={styles.badgeRow}>
          <StatusBadge label={t('paymentProtected')} tone="success" />
          <StatusBadge label={t('supportWhenNeededChip')} tone="core" />
        </View>
        <AppText variant="cardTitle">{t('taskPaymentProtectedTitle')}</AppText>
        <AppText color={colors.slate700}>{t('paymentProtectedReleasedAfterApproval')}</AppText>
      </AppCard>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function TaskCard({ onPress, task }: { onPress: () => void; task: CustomerTaskSummary }) {
  const cancellationLabel = getCancellationBadgeLabel(task.cancellationState);
  const supportLabel = getSupportBadgeLabel(task.supportState);
  const policySummary = getCorePolicySummary(task);

  return (
    <AppCard style={styles.taskCard}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <StatusBadge label={getCustomerTaskPhaseLabel(task)} tone="core" />
          <StatusBadge label={getPaymentStateLabel(task.paymentState)} tone={getPaymentStateTone(task.paymentState)} />
          {cancellationLabel ? (
            <StatusBadge label={cancellationLabel} tone={getCancellationBadgeTone(task.cancellationState)} />
          ) : null}
          {supportLabel ? <StatusBadge label={supportLabel} tone="warning" /> : null}
        </View>
        {task.unreadMessagesCount > 0 ? (
          <StatusBadge label={`${task.unreadMessagesCount} ${t('unreadMessagesShort')}`} tone="warning" />
        ) : null}
      </View>

      <View style={styles.cardMain}>
        <AppText style={styles.cardTitle} variant="cardTitle">
          {task.title}
        </AppText>
        <AppText color={colors.slate700} style={styles.cardSubtitle}>
          {task.categoryLabel} · {task.cityLabel}
        </AppText>
      </View>

      <View style={styles.metaGrid}>
        <MetaItem label={t('taskCardBudget')} value={task.priceLabel} />
        <MetaItem label={t('taskCardSchedule')} value={formatScheduleSummary(task.scheduledStartAt, task.scheduledEndAt)} />
        <MetaItem label={t('taskCardLocation')} value={task.cityLabel} />
      </View>

      <View style={styles.nextActionCard}>
        <View style={styles.nextActionCopy}>
          <AppText color={colors.slate500} variant="small">
            {t('taskCardNextAction')}
          </AppText>
          <AppText color={colors.navy900} variant="bodyStrong">
            {getTaskNextActionLabel(task)}
          </AppText>
        </View>
        <AppButton onPress={onPress} style={styles.detailsButton} variant="outline">
          {t('viewDetails')}
        </AppButton>
      </View>

      <AppText color={colors.slate700} style={styles.helperText}>
        {getPaymentStateHelperText(task.paymentState)}
      </AppText>
      {policySummary ? (
        <AppText color={colors.slate700} style={styles.helperText}>
          {policySummary}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText color={colors.navy900} style={styles.metaValue} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

function formatScheduleSummary(start: string | null, end: string | null) {
  if (!start) return t('noScheduleSet');
  const startDate = new Date(start);
  const dateLabel = startDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return endTime ? `${dateLabel}, ${startTime}-${endTime}` : `${dateLabel}, ${startTime}`;
}

function getTaskNextActionLabel(task: CustomerTaskSummary) {
  if (hasFuturePaymentAction(task)) return getReadOnlyPaymentActionLabel(task);
  if (task.nextActions.canSelectTasker || task.nextActions.primaryAction === 'select_tasker') return t('customerSelectingTasker');
  if (task.nextActions.canApproveCompletion || task.nextActions.canRejectCompletion) return t('waitingForCustomerApproval');
  if (task.nextActions.canCancel || task.nextActions.primaryAction === 'cancel_task') return t('cancelTask');
  if (task.nextActions.canRequestHelp || task.nextActions.canOpenSupport) return t('requestSupportReview');
  if (task.nextActions.canReview || task.nextActions.primaryAction === 'review') return t('completed');
  return task.nextActions.blockedReason || task.statusLabel || t('notAvailable');
}

function getCustomerTaskPhaseLabel(task: CustomerTaskSummary) {
  const status = task.status.toUpperCase();

  if (status === 'OPEN') return t('customerSelectingTasker');
  if (status === 'RESERVED') return t('reservedUpcoming');
  if (status === 'PENDING_COMPLETION') return t('waitingForCustomerApproval');
  if (status === 'IN_PROGRESS' && task.nextActions.blockedReason === t('taskerCanRequestCompletionAgain')) {
    return t('changesRequestedShort');
  }
  if (status === 'IN_PROGRESS') return t('inProgress');
  if (status === 'COMPLETED') return t('completed');
  if (status.includes('CANCELLED')) return t('cancelled');
  if (status === 'DISPUTED') return t('disputed');

  return task.statusLabel || t('notAvailable');
}

function getCancellationBadgeLabel(state?: CoreCancellationState) {
  if (!state) return null;
  switch (state.status) {
    case 'free_cancellation_available':
      return t('freeCancellationAvailable');
    case 'late_cancellation_available':
      return t('lateCancellationMayApply');
    case 'blocked_after_start':
      return t('supportRequired');
    case 'cancelled_free':
    case 'cancelled_late':
    case 'cancelled':
      return t('cancelled');
    case 'support_review':
      return t('underSupportReview');
    default:
      return null;
  }
}

function getCancellationBadgeTone(state?: CoreCancellationState): StatusTone {
  if (!state) return 'neutral';
  if (state.status === 'free_cancellation_available') return 'success';
  if (state.status === 'late_cancellation_available' || state.status === 'blocked_after_start') return 'warning';
  if (state.status === 'support_review') return 'danger';
  return 'neutral';
}

function getSupportBadgeLabel(state?: CoreSupportState) {
  if (!state) return null;
  if (state.status === 'under_review') return t('underSupportReview');
  if (state.status === 'support_submitted') return t('supportRequestSent');
  if (state.status === 'help_available') return t('supportRequired');
  return null;
}

function getCorePolicySummary(task: CustomerTaskSummary) {
  const cancellation = task.cancellationState;
  if (!cancellation) return null;
  if (
    cancellation.status === 'free_cancellation_available' ||
    cancellation.status === 'late_cancellation_available' ||
    cancellation.status === 'blocked_after_start' ||
    cancellation.status === 'support_review'
  ) {
    return cancellation.estimatedPolicyOutcomeLabel || cancellation.helperText;
  }
  return task.supportReviewLabel || null;
}

function hasFuturePaymentAction(task: CustomerTaskSummary) {
  return task.nextActions.canPreparePayment || task.nextActions.canConfirmPayment || task.nextActions.canRetryPayment;
}

function getReadOnlyPaymentActionLabel(task: CustomerTaskSummary) {
  if (task.nextActions.canRetryPayment || task.nextActions.primaryAction === 'retry_payment') return t('paymentNeedsAttention');
  if (task.nextActions.canPreparePayment || task.nextActions.primaryAction === 'prepare_payment') return t('setUpProtectedPayment');
  if (task.nextActions.canConfirmPayment || task.nextActions.primaryAction === 'confirm_payment') return t('continuePaymentSetup');
  return t('paymentActionComingSoon');
}

function getPaymentStateLabel(paymentState: CustomerCorePaymentState) {
  if (paymentState.canShowPaymentProtectedBadge || paymentState.paymentProtected) return t('paymentProtected');

  switch (paymentState.status) {
    case 'not_required_yet':
      return t('paymentNotRequiredYet');
    case 'tasker_selection_needed':
      return t('taskerSelectionNeeded');
    case 'reservation_pending':
      return t('paymentReservationPending');
    case 'payment_method_required':
      return t('paymentMethodRequired');
    case 'payment_pending':
    case 'payment_initiated':
    case 'holding':
      return t('paymentBeingPrepared');
    case 'hold_scheduled':
      return t('paymentHoldScheduled');
    case 'held':
      return t('paymentHeld');
    case 'released':
      return t('paymentReleased');
    case 'failed':
      return t('paymentFailed');
    case 'refunded':
    case 'cancelled':
    case 'disputed':
      return paymentState.statusLabel || t('paymentNeedsAttention');
    default:
      return t('paymentStateUnavailable');
  }
}

function getPaymentStateHelperText(paymentState: CustomerCorePaymentState) {
  switch (paymentState.status) {
    case 'tasker_selection_needed':
      return t('paymentProtectedBeforeStart');
    case 'payment_method_required':
      return t('cardCollectionConnectedNext');
    case 'payment_pending':
    case 'payment_initiated':
    case 'hold_scheduled':
    case 'holding':
      return t('paymentProtectedBeforeStart');
    case 'held':
      return t('paymentProtectedUntilApprove');
    case 'released':
      return t('paymentReleasedProtectedFlow');
    case 'failed':
      return t('paymentNeedsAttention');
    case 'unknown':
      return t('paymentStateUnavailable');
    default:
      return paymentState.helperText || t('paymentProtectedBeforeStart');
  }
}

function getPaymentStateTone(paymentState: CustomerCorePaymentState): StatusTone {
  if (paymentState.canShowPaymentProtectedBadge || paymentState.paymentProtected) return 'success';
  if (paymentState.status === 'failed' || paymentState.status === 'disputed') return 'danger';
  if (paymentState.status === 'payment_method_required' || paymentState.status === 'unknown') return 'warning';
  return 'neutral';
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardMain: {
    gap: spacing.xs,
  },
  cardSubtitle: {
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  detailsButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaItem: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: 96,
    padding: spacing.sm,
  },
  metaValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  nextActionCard: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#D7E7FA',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  nextActionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  pageHeader: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  screenContent: {
    gap: spacing.lg,
  },
  stateCard: {
    borderRadius: radius.card,
  },
  taskCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  taskList: {
    gap: spacing.md,
  },
  trustCard: {
    borderRadius: radius.card,
  },
});
