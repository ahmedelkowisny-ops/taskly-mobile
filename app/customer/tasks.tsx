import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerTasks } from '@/src/lib/api/customer';
import { CustomerCorePaymentState, CustomerTaskSummary, CustomerTasksResponse } from '@/src/lib/api/domain';
import { getMockCustomerTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerTasksScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

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
        ? 'Login is required to load your Core tasks.'
        : 'Could not load your Core tasks.',
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('myTasks')}</AppText>
        <AppText color={colors.slate700}>
          Track small fixed-scope tasks from the Customer Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading Core tasks</AppText>
          <AppText color={colors.slate700}>Fetching your read-only task list from Taskly.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Core tasks need a real session' : 'Could not refresh Core tasks'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry the request or continue in demo mode while the backend is unavailable.'}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadTasks} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              Continue in demo mode
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {data?.tasks.length ? (
        <View style={{ gap: spacing.md }}>
          {data.tasks.map((task) => (
            <AppCard key={task.id} accentColor={colors.tasklyBlue600}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <StatusBadge label={getCustomerTaskPhaseLabel(task)} tone="core" />
                <StatusBadge label={getPaymentStateLabel(task.paymentState)} tone={getPaymentStateTone(task.paymentState)} />
              </View>
              <AppText variant="sectionTitle">{task.title}</AppText>
              <AppText color={colors.slate700}>
                {task.categoryLabel} - {task.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>{getPaymentStateHelperText(task.paymentState)}</AppText>
              <AppText color={colors.slate700}>
                {task.priceLabel}
                {task.scheduledStartAt ? ` - ${new Date(task.scheduledStartAt).toLocaleDateString()}` : ''}
              </AppText>
              {hasFuturePaymentAction(task) ? (
                <AppButton disabled tone="neutral" variant="outline">
                  {getReadOnlyPaymentActionLabel(task)}
                </AppButton>
              ) : null}
              <AppButton
                onPress={() => router.push(`/customer/tasks/${task.id}` as Href)}
                variant="outline">
                View details
              </AppButton>
            </AppCard>
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

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label={t('customerSelectingTasker')} tone="core" />
          <StatusBadge label={t('paymentProtected')} tone="success" />
        </View>
        <AppText variant="sectionTitle">{t('paymentProtected')}</AppText>
        <AppText color={colors.slate700}>
          Taskly shows payment protection status from the backend. The app does not calculate payment readiness or release rules.
        </AppText>
      </AppCard>
    </Screen>
  );
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

function hasFuturePaymentAction(task: CustomerTaskSummary) {
  return task.nextActions.canPreparePayment || task.nextActions.canConfirmPayment || task.nextActions.canRetryPayment;
}

function getReadOnlyPaymentActionLabel(task: CustomerTaskSummary) {
  if (task.nextActions.canRetryPayment || task.nextActions.primaryAction === 'retry_payment') return t('paymentNeedsAttention');
  if (task.nextActions.canPreparePayment || task.nextActions.primaryAction === 'prepare_payment') return t('cardCollectionConnectedNext');
  if (task.nextActions.canConfirmPayment || task.nextActions.primaryAction === 'confirm_payment') return t('paymentActionComingSoon');
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

function getPaymentStateTone(paymentState: CustomerCorePaymentState) {
  if (paymentState.canShowPaymentProtectedBadge || paymentState.paymentProtected) return 'success';
  if (paymentState.status === 'failed' || paymentState.status === 'disputed') return 'danger';
  if (paymentState.status === 'payment_method_required' || paymentState.status === 'unknown') return 'warning';
  return 'neutral';
}
