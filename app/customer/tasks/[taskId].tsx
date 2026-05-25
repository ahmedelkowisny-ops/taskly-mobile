import { useFocusEffect } from '@react-navigation/native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { FormField } from '@/src/components/taskly/FormField';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  approveCustomerTaskCompletion,
  finalizeCustomerTaskPayment,
  getCustomerTaskDetail,
  rejectCustomerTaskCompletion,
  selectCustomerTasker,
  setupCustomerTaskPayment,
} from '@/src/lib/api/customer';
import {
  CustomerCorePaymentState,
  CustomerCoreTaskNextActions,
  CustomerInterestedTaskerPreview,
  CustomerTaskDetail,
  CustomerTaskDetailResponse,
} from '@/src/lib/api/domain';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockCustomerTaskDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type PaymentSetupStage = 'setup' | 'confirm' | 'finalize';

export default function CustomerTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskId = String(params.taskId || 'demo-task');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const [data, setData] = useState<CustomerTaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [isApprovingCompletion, setIsApprovingCompletion] = useState(false);
  const [isRejectingCompletion, setIsRejectingCompletion] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentSetupStage, setPaymentSetupStage] = useState<PaymentSetupStage | null>(null);
  const [selectingTaskerId, setSelectingTaskerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);
    setActionError(null);
    setActionWarning(null);

    if (status === 'demo') {
      setData(getMockCustomerTaskDetailResponse(taskId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Core task detail.');
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Core task detail.');
      setIsLoading(false);
      return;
    }

    const result = await getCustomerTaskDetail(taskId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? 'Not found' : result.status === 401 || result.status === 403 ? 'Login required' : 'Backend unavailable');
    setMessage(result.status === 404 ? 'This task was not found or is not available to this account.' : 'Could not load this task detail.');
  }, [getValidAccessToken, status, taskId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const task = data?.task;

  const markDemoCompletionRejected = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskerCanRequestCompletionAgain'),
            blockedReasonCode: 'WAITING_FOR_PROVIDER',
            canApproveCompletion: false,
            canRejectCompletion: false,
            primaryAction: 'chat',
          },
          status: 'IN_PROGRESS',
          statusLabel: t('inProgress'),
          timeline: current.task.timeline.map((item) =>
            item.id === 'completion'
              ? { ...item, description: t('taskerCanRequestCompletionAgain'), status: 'upcoming' as const }
              : item,
          ),
        },
      };
    });
  }, []);

  const markDemoCompletionApproved = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskAlreadyCompleted'),
            blockedReasonCode: 'ALREADY_COMPLETED',
            canApproveCompletion: false,
            canRejectCompletion: false,
            canReview: true,
            canViewInvoice: true,
            primaryAction: 'review',
          },
          paymentState: {
            ...current.task.paymentState,
            canShowPaymentProtectedBadge: false,
            helperText: t('paymentReleasedProtectedFlow'),
            paymentProtected: false,
            paymentStatus: 'RELEASED',
            status: 'released',
            statusLabel: 'Payment released',
            warningCode: null,
          },
          paymentStatusLabel: 'Payment released',
          status: 'COMPLETED',
          statusLabel: t('completed'),
          timeline: current.task.timeline.map((item) =>
            item.id === 'completion'
              ? { ...item, description: t('completionApproved'), status: 'done' as const }
              : item,
          ),
        },
      };
    });
  }, []);

  const markDemoTaskerSelected = useCallback((tasker: CustomerInterestedTaskerPreview) => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          interestedTaskers: [],
          nextActions: {
            ...current.task.nextActions,
            blockedReason: undefined,
            blockedReasonCode: undefined,
            canChat: true,
            canPreparePayment: true,
            canSelectTasker: false,
            paymentRequired: true,
            primaryAction: 'prepare_payment',
          },
          paymentState: {
            ...current.task.paymentState,
            bookingStatus: 'RESERVED',
            canShowPaymentProtectedBadge: false,
            helperText: t('cardCollectionConnectedNext'),
            paymentProtected: false,
            paymentRequired: true,
            paymentStatus: null,
            reservationState: 'RESERVED',
            status: 'payment_method_required',
            statusLabel: 'Payment method required',
            warningCode: null,
          },
          paymentStatusLabel: 'Payment method required',
          status: 'RESERVED',
          statusLabel: t('reservedUpcoming'),
          taskerPreview: {
            displayName: tasker.displayName,
            ratingLabel: tasker.ratingLabel,
            statusLabel: tasker.statusLabel,
          },
          timeline: current.task.timeline.map((item) =>
            item.id === 'payment'
              ? { ...item, description: t('cardCollectionConnectedNext'), status: 'current' as const }
              : item,
          ),
        },
      };
    });
  }, []);

  const markDemoPaymentSetupComplete = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: undefined,
            blockedReasonCode: undefined,
            canChat: true,
            canConfirmPayment: false,
            canPreparePayment: false,
            canRetryPayment: false,
            paymentRequired: true,
            paymentProtected: false,
            primaryAction: 'chat',
          },
          paymentState: {
            ...current.task.paymentState,
            bookingStatus: 'ACTIVE',
            canShowPaymentProtectedBadge: false,
            helperText: t('paymentProtectedBeforeStart'),
            paymentProtected: false,
            paymentRequired: true,
            paymentStatus: 'INITIATED',
            reservationState: 'NONE',
            status: 'hold_scheduled',
            statusLabel: t('paymentHoldScheduled'),
            warningCode: null,
          },
          paymentStatusLabel: t('paymentHoldScheduled'),
          status: 'IN_PROGRESS',
          statusLabel: t('inProgress'),
          timeline: current.task.timeline.map((item) =>
            item.id === 'payment'
              ? { ...item, description: t('paymentHoldScheduledFlow'), status: 'done' as const }
              : item,
          ),
        },
      };
    });
  }, []);

  const finalizePaymentSetup = useCallback(async (authToken: string, payload: { paymentMethodId?: string; setupIntentId?: string }) => {
    setPaymentSetupStage('finalize');
    const finalizeResult = await finalizeCustomerTaskPayment(taskId, payload, authToken);

    if (finalizeResult.ok) {
      if (finalizeResult.data.task) {
        setData({ task: finalizeResult.data.task });
      } else {
        await loadDetail();
      }
      setPaymentMessage(t('paymentSetupComplete'));
      return true;
    }

    setPaymentError(getPaymentSetupErrorText(finalizeResult.error.code, finalizeResult.error.message));
    return false;
  }, [loadDetail, taskId]);

  const submitPaymentSetup = useCallback(async () => {
    setPaymentError(null);
    setPaymentMessage(null);

    if (!task || !hasPaymentSetupAction(task.nextActions)) {
      setPaymentError(t('paymentSetupUnavailable'));
      return;
    }

    if (status === 'demo') {
      markDemoPaymentSetupComplete();
      setPaymentMessage(`${t('paymentSetupComplete')} ${t('demoModeNoRealPayments')}`);
      return;
    }

    if (status !== 'authenticated') {
      setPaymentError(t('loginRequired'));
      return;
    }

    const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
    if (!stripePublishableKey) {
      setPaymentError(t('paymentsNotConfiguredYet'));
      return;
    }

    if (!isCardComplete && !task.nextActions.canConfirmPayment) {
      setPaymentError(t('paymentMethodRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setPaymentError(t('loginRequired'));
      return;
    }

    setPaymentSetupStage('setup');
    const setupResult = await setupCustomerTaskPayment(taskId, authToken);

    if (!setupResult.ok) {
      setPaymentSetupStage(null);
      setPaymentError(getPaymentSetupErrorText(setupResult.error.code, setupResult.error.message));
      return;
    }

    const fallbackCode = setupResult.data.fallback?.code;
    if (setupResult.data.task) {
      setData({ task: setupResult.data.task });
    }

    if (fallbackCode === 'STRIPE_NOT_CONFIGURED') {
      setPaymentSetupStage(null);
      setPaymentError(t('paymentsNotConfiguredYet'));
      return;
    }

    if (fallbackCode === 'SETUP_NOT_AVAILABLE') {
      setPaymentSetupStage(null);
      setPaymentError(t('paymentSetupUnavailable'));
      return;
    }

    if (fallbackCode === 'MOCK_PAYMENTS' || fallbackCode === 'PAYMENT_NOT_REQUIRED') {
      await finalizePaymentSetup(authToken, {});
      setPaymentSetupStage(null);
      return;
    }

    const clientSecret = setupResult.data.setupIntentClientSecret;
    if (!clientSecret) {
      setPaymentSetupStage(null);
      setPaymentError(t('paymentSetupUnavailable'));
      return;
    }

    setPaymentSetupStage('confirm');
    const confirmation = await confirmSetupIntent(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (confirmation.error) {
      setPaymentSetupStage(null);
      setPaymentError(getStripeSetupErrorText(confirmation.error.code));
      return;
    }

    const paymentMethodId = confirmation.setupIntent.paymentMethod?.id || confirmation.setupIntent.paymentMethodId || undefined;
    const setupIntentId = confirmation.setupIntent.id;
    await finalizePaymentSetup(authToken, {
      ...(paymentMethodId ? { paymentMethodId } : null),
      ...(setupIntentId ? { setupIntentId } : null),
    });
    setPaymentSetupStage(null);
  }, [
    confirmSetupIntent,
    finalizePaymentSetup,
    getValidAccessToken,
    isCardComplete,
    markDemoPaymentSetupComplete,
    status,
    task,
    taskId,
  ]);

  const submitSelectTasker = useCallback(async (tasker: CustomerInterestedTaskerPreview) => {
    setActionError(null);
    setActionMessage(null);
    setActionWarning(null);

    if (!task?.nextActions.canSelectTasker) {
      setActionError(t('taskNoLongerAvailable'));
      return;
    }

    if (status === 'demo') {
      markDemoTaskerSelected(tasker);
      setActionMessage(t('taskerSelected'));
      return;
    }

    if (status !== 'authenticated') {
      setActionError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setActionError(t('loginRequired'));
      return;
    }

    setSelectingTaskerId(tasker.taskerId);
    const result = await selectCustomerTasker(taskId, { taskerId: tasker.taskerId }, authToken);
    setSelectingTaskerId(null);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setActionMessage(t('taskerSelected'));
      return;
    }

    switch (result.error.code) {
      case 'TASK_NOT_OPEN':
      case 'TASK_ALREADY_RESERVED':
        setActionError(t('taskNoLongerAvailable'));
        return;
      case 'TASKER_NOT_FOUND':
      case 'TASKER_INTEREST_REQUIRED':
      case 'TASKER_NOT_ELIGIBLE':
      case 'TASK_CITY_MISMATCH':
      case 'TASKER_TIME_CONFLICT':
        setActionError(t('taskerNotAvailableAnymore'));
        return;
      default:
        setActionError(result.error.message || t('couldNotSelectTasker'));
    }
  }, [getValidAccessToken, loadDetail, markDemoTaskerSelected, status, task?.nextActions.canSelectTasker, taskId]);

  const handleSelectTasker = useCallback((tasker: CustomerInterestedTaskerPreview) => {
    Alert.alert(t('chooseThisTasker'), `${t('nextStepPaymentSetup')}\n${t('paymentProtectedBeforeStart')}`, [
      { style: 'cancel', text: t('cancel') },
      { onPress: () => void submitSelectTasker(tasker), text: t('chooseTasker') },
    ]);
  }, [submitSelectTasker]);

  const handlePaymentSetup = useCallback(() => {
    Alert.alert(t('protectedPaymentFlow'), `${t('cardHandledSecurelyByStripe')}\n${t('paymentProtectedReleasedAfterApproval')}`, [
      { style: 'cancel', text: t('cancel') },
      { onPress: () => void submitPaymentSetup(), text: getPaymentSetupButtonLabel(task?.nextActions) },
    ]);
  }, [submitPaymentSetup, task?.nextActions]);

  const submitApproveCompletion = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);
    setActionWarning(null);

    if (!task?.nextActions.canApproveCompletion) {
      setActionError(t('couldNotApproveCompletion'));
      return;
    }

    if (status === 'demo') {
      markDemoCompletionApproved();
      setActionMessage(t('completionApproved'));
      return;
    }

    if (status !== 'authenticated') {
      setActionError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setActionError(t('loginRequired'));
      return;
    }

    setIsApprovingCompletion(true);
    const result = await approveCustomerTaskCompletion(taskId, authToken);
    setIsApprovingCompletion(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setActionMessage(t('completionApproved'));
      const warning = result.data.payment?.warning;
      if (warning) {
        setActionWarning(t('approvedPayoutMayNeedReview'));
      }
      return;
    }

    if (result.error.code === 'PAYMENT_NOT_READY') {
      setActionError(t('paymentNotReadyYet'));
      return;
    }
    if (result.error.code === 'NOT_PENDING_COMPLETION') {
      setActionError(t('taskNotWaitingApproval'));
      return;
    }
    if (result.error.code === 'TASK_ALREADY_COMPLETED') {
      setActionError(t('taskAlreadyCompleted'));
      return;
    }

    setActionError(result.error.message || t('couldNotApproveCompletion'));
  }, [getValidAccessToken, loadDetail, markDemoCompletionApproved, status, task?.nextActions.canApproveCompletion, taskId]);

  const handleApproveCompletion = useCallback(() => {
    Alert.alert(t('approveCompletionPrompt'), t('paymentReleasedProtectedFlow'), [
      { style: 'cancel', text: t('cancel') },
      { onPress: () => void submitApproveCompletion(), text: t('approveCompletion') },
    ]);
  }, [submitApproveCompletion]);

  const handleRejectCompletion = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);
    setActionWarning(null);
    setRejectionReasonError(null);

    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionReasonError(t('reasonRequired'));
      return;
    }
    if (reason.length > 1000) {
      setRejectionReasonError(t('messageTooLong'));
      return;
    }

    if (!task?.nextActions.canRejectCompletion) {
      setActionError(t('couldNotRequestChanges'));
      return;
    }

    if (status === 'demo') {
      markDemoCompletionRejected();
      setRejectionReason('');
      setActionMessage(t('changesRequested'));
      return;
    }

    if (status !== 'authenticated') {
      setActionError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setActionError(t('loginRequired'));
      return;
    }

    setIsRejectingCompletion(true);
    const result = await rejectCustomerTaskCompletion(taskId, { reason }, authToken);
    setIsRejectingCompletion(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setRejectionReason('');
      setActionMessage(t('changesRequested'));
      return;
    }

    if (result.error.code === 'MISSING_REASON') {
      setRejectionReasonError(t('reasonRequired'));
      return;
    }
    if (result.error.code === 'REASON_TOO_LONG') {
      setRejectionReasonError(t('messageTooLong'));
      return;
    }

    setActionError(result.error.message || t('couldNotRequestChanges'));
  }, [getValidAccessToken, loadDetail, markDemoCompletionRejected, rejectionReason, status, task?.nextActions.canRejectCompletion, taskId]);

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppButton onPress={() => router.back()} variant="ghost">
          Back
        </AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message="Loading Core task detail." tone="core" /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} variant="outline">Retry</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">Continue in demo mode</AppButton>
          </View>
        </AppCard>
      ) : null}

      {task ? (
        <>
          <AppCard accentColor={colors.tasklyBlue600}>
            <StatusBadge label={getCustomerTaskPhaseLabel(task)} tone="core" />
            <AppText variant="screenTitle">{task.title}</AppText>
            <AppText color={colors.slate700}>{task.description}</AppText>
            <AppText color={colors.slate700}>{task.categoryLabel} - {task.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <Info label="Price" value={task.priceLabel} />
            <Info label="Schedule" value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            <Info label="Address" value={task.addressPreviewLabel} />
            {task.taskerPreview ? <Info label="Tasker" value={`${task.taskerPreview.displayName} - ${task.taskerPreview.ratingLabel}`} /> : null}
          </AppCard>

          <PaymentStateCard nextActions={task.nextActions} paymentState={task.paymentState} />
          <PaymentSetupCard
            isCardComplete={isCardComplete}
            isDemoMode={status === 'demo'}
            onCardCompleteChange={setIsCardComplete}
            onSetupPayment={handlePaymentSetup}
            paymentError={paymentError}
            paymentMessage={paymentMessage}
            paymentsConfigured={Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY)}
            setupStage={paymentSetupStage}
            task={task}
          />
          <InterestedTaskers
            canSelectTasker={task.nextActions.canSelectTasker}
            onSelectTasker={handleSelectTasker}
            selectingTaskerId={selectingTaskerId}
            taskers={task.interestedTaskers}
          />
          <Images images={task.images} />
          <Timeline items={task.timeline} accent="core" />
          <NextActions actions={task.nextActions} tone="core" />
          <CompletionDecision
            actionError={actionError}
            actionMessage={actionMessage}
            actionWarning={actionWarning}
            isApproving={isApprovingCompletion}
            isRejecting={isRejectingCompletion}
            onApprove={handleApproveCompletion}
            onReasonChange={setRejectionReason}
            onReject={handleRejectCompletion}
            reason={rejectionReason}
            reasonError={rejectionReasonError}
            task={task}
          />
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message, tone }: { label: string; message: string; tone: 'core' | 'neutral' }) {
  return (
    <AppCard accentColor={tone === 'core' ? colors.tasklyBlue600 : colors.navy900}>
      <StatusBadge label={label} tone={tone} />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{value}</AppText>
    </View>
  );
}

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <AppText variant="sectionTitle">Images</AppText>
      <View style={styles.imageGrid}>
        {images.map((image) => (
          <Image
            key={image.id}
            accessibilityLabel={image.alt}
            source={{ uri: resolveApiMediaUrl(image.url) }}
            style={styles.image}
          />
        ))}
      </View>
    </AppCard>
  );
}

function Timeline({ items, accent }: { accent: 'core'; items: { description: string; id: string; label: string; status: string }[] }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <AppText variant="sectionTitle">Timeline</AppText>
      {items.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <StatusBadge label={item.status} tone={accent} />
          <AppText variant="bodyStrong">{item.label}</AppText>
          <AppText color={colors.slate700}>{item.description}</AppText>
        </View>
      ))}
    </AppCard>
  );
}

function NextActions({ actions, tone }: { actions: CustomerCoreTaskNextActions; tone: 'core' }) {
  if (isPaymentReadOnlyAction(actions)) return null;

  const isCompletionReview = actions.canApproveCompletion || actions.canRejectCompletion;
  const label = isCompletionReview
    ? t('waitingForCustomerApproval')
    : actions.primaryAction === 'select_tasker'
        ? t('customerSelectingTasker')
        : actions.primaryAction === 'review'
          ? t('completed')
          : t('notAvailable');

  return (
    <AppCard>
      <AppText variant="sectionTitle">Next steps</AppText>
      {isCompletionReview ? (
        <AppText color={colors.slate700}>{t('completionRequested')}</AppText>
      ) : actions.blockedReason || actions.blockedReasonCode ? (
        <AppText color={colors.slate700}>{getCustomerBlockedReasonText(actions)}</AppText>
      ) : null}
      <AppButton disabled tone={tone} variant="outline">{label}</AppButton>
    </AppCard>
  );
}

function InterestedTaskers({
  canSelectTasker,
  onSelectTasker,
  selectingTaskerId,
  taskers,
}: {
  canSelectTasker: boolean;
  onSelectTasker: (tasker: CustomerInterestedTaskerPreview) => void;
  selectingTaskerId: string | null;
  taskers: CustomerInterestedTaskerPreview[];
}) {
  if (!canSelectTasker) return null;

  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <StatusBadge label={t('chooseTasker')} tone="core" />
      <AppText variant="sectionTitle">{t('chooseTasker')}</AppText>
      <AppText color={colors.slate700}>{t('nextStepPaymentSetup')}</AppText>
      {taskers.length === 0 ? (
        <AppText color={colors.slate700}>{t('noInterestedTaskersYet')}</AppText>
      ) : (
        <View style={styles.stack}>
          {taskers.map((tasker) => (
            <AppCard key={tasker.id}>
              <View style={styles.taskerRow}>
                {tasker.profileImageUrl ? (
                  <Image
                    accessibilityLabel={tasker.displayName}
                    source={{ uri: resolveApiMediaUrl(tasker.profileImageUrl) }}
                    style={styles.taskerImage}
                  />
                ) : (
                  <View style={styles.taskerInitials}>
                    <AppText color={colors.tasklyBlue700} variant="bodyStrong">
                      {getTaskerInitials(tasker.displayName)}
                    </AppText>
                  </View>
                )}
                <View style={styles.taskerBody}>
                  <AppText variant="bodyStrong">{tasker.displayName}</AppText>
                  <AppText color={colors.slate700}>{`${tasker.ratingLabel} - ${tasker.completedTasksLabel}`}</AppText>
                  {tasker.bioPreview ? <AppText color={colors.slate700}>{tasker.bioPreview}</AppText> : null}
                  {tasker.toolsConfirmed ? <StatusBadge label={t('taskerToolsConfirmed')} tone="success" /> : null}
                </View>
              </View>
              <AppButton
                loading={selectingTaskerId === tasker.taskerId}
                onPress={() => onSelectTasker(tasker)}
                variant="outline">
                {selectingTaskerId === tasker.taskerId ? t('choosingTasker') : t('selectTasker')}
              </AppButton>
            </AppCard>
          ))}
        </View>
      )}
    </AppCard>
  );
}

function PaymentStateCard({
  nextActions,
  paymentState,
}: {
  nextActions: CustomerCoreTaskNextActions;
  paymentState: CustomerCorePaymentState;
}) {
  return (
    <AppCard accentColor={getPaymentAccentColor(paymentState)}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatusBadge label={getPaymentStateLabel(paymentState)} tone={getPaymentStateTone(paymentState)} />
        {paymentState.paymentRequired ? <StatusBadge label={t('protectedPaymentFlow')} tone="neutral" /> : null}
      </View>
      <AppText variant="sectionTitle">{t('protectedPaymentFlow')}</AppText>
      <AppText color={colors.slate700}>{getPaymentStateHelperText(paymentState)}</AppText>
      {hasPaymentSetupAction(nextActions) ? <AppText color={colors.slate700}>{t('cardHandledSecurelyByStripe')}</AppText> : null}
    </AppCard>
  );
}

function PaymentSetupCard({
  isCardComplete,
  isDemoMode,
  onCardCompleteChange,
  onSetupPayment,
  paymentError,
  paymentMessage,
  paymentsConfigured,
  setupStage,
  task,
}: {
  isCardComplete: boolean;
  isDemoMode: boolean;
  onCardCompleteChange: (complete: boolean) => void;
  onSetupPayment: () => void;
  paymentError: string | null;
  paymentMessage: string | null;
  paymentsConfigured: boolean;
  setupStage: PaymentSetupStage | null;
  task: CustomerTaskDetail;
}) {
  if (!hasPaymentSetupAction(task.nextActions)) return null;

  const isBusy = setupStage !== null;
  const canCollectCard = paymentsConfigured && !isDemoMode;

  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <StatusBadge label={t('paymentProtected')} tone="core" />
      <AppText variant="sectionTitle">{getPaymentSetupButtonLabel(task.nextActions)}</AppText>
      <AppText color={colors.slate700}>{t('cardHandledSecurelyByStripe')}</AppText>
      <AppText color={colors.slate700}>{t('paymentProtectedReleasedAfterApproval')}</AppText>
      <AppText color={colors.slate700}>{t('paymentHoldScheduledFlow')}</AppText>
      {isDemoMode ? <AppText color={colors.slate700}>{t('demoModeNoRealPayments')}</AppText> : null}
      {!paymentsConfigured && !isDemoMode ? <AppText color={colors.warning600}>{t('paymentsNotConfiguredYet')}</AppText> : null}
      {canCollectCard ? (
        <CardField
          cardStyle={{
            backgroundColor: colors.white,
            borderColor: colors.slate100,
            borderRadius: 8,
            borderWidth: 1,
            fontSize: 16,
            placeholderColor: colors.slate500,
            textColor: colors.navy900,
          }}
          disabled={isBusy}
          onCardChange={(card) => onCardCompleteChange(Boolean(card.complete))}
          placeholders={{ number: '4242 4242 4242 4242' }}
          postalCodeEnabled={false}
          style={styles.cardField}
        />
      ) : null}
      {paymentMessage ? <AppText color={colors.success600}>{paymentMessage}</AppText> : null}
      {paymentError ? <AppText color={colors.danger600}>{paymentError}</AppText> : null}
      <AppButton
        disabled={(!isDemoMode && ((!isCardComplete && !task.nextActions.canConfirmPayment) || !paymentsConfigured)) || isBusy}
        loading={isBusy}
        onPress={onSetupPayment}>
        {setupStage ? getPaymentSetupStageLabel(setupStage) : getPaymentSetupButtonLabel(task.nextActions)}
      </AppButton>
    </AppCard>
  );
}

function CompletionDecision({
  actionError,
  actionMessage,
  actionWarning,
  isApproving,
  isRejecting,
  onApprove,
  onReasonChange,
  onReject,
  reason,
  reasonError,
  task,
}: {
  actionError: string | null;
  actionMessage: string | null;
  actionWarning: string | null;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: () => void;
  onReasonChange: (value: string) => void;
  onReject: () => void;
  reason: string;
  reasonError: string | null;
  task: CustomerTaskDetail;
}) {
  const canApprove = task.nextActions.canApproveCompletion;
  const canReject = task.nextActions.canRejectCompletion;
  const approvalBlockedByPayment = task.nextActions.blockedReasonCode === 'PAYMENT_NOT_READY';
  if (!canApprove && !canReject && !approvalBlockedByPayment) return null;

  return (
    <AppCard accentColor={colors.warning600}>
      <StatusBadge label={t('waitingForCustomerApproval')} tone="warning" />
      <AppText variant="sectionTitle">{t('approveCompletionPrompt')}</AppText>
      <AppText color={colors.slate700}>
        {canApprove ? t('approveCompletionPaymentReady') : t('approvalWaitingPaymentReady')}
      </AppText>
      {canReject ? (
        <>
          <AppText color={colors.slate700}>{t('tellTaskerWhatNeedsFixing')}</AppText>
          <AppText color={colors.slate700}>{t('askForChangesNotDispute')}</AppText>
          <FormField
            errorText={reasonError || undefined}
            helperText={t('taskerCanRequestCompletionAgain')}
            label={t('reasonForChanges')}
            multiline
            onChangeText={onReasonChange}
            placeholder={t('reasonForChanges')}
            value={reason}
          />
        </>
      ) : null}
      {actionMessage ? <AppText color={colors.success600}>{actionMessage}</AppText> : null}
      {actionWarning ? <AppText color={colors.warning600}>{actionWarning}</AppText> : null}
      {actionError ? <AppText color={colors.danger600}>{actionError}</AppText> : null}
      {canApprove ? (
        <AppButton loading={isApproving} onPress={onApprove}>
          {isApproving ? t('approvingCompletion') : t('approveAndReleasePayment')}
        </AppButton>
      ) : null}
      {canReject ? (
        <AppButton loading={isRejecting} onPress={onReject} tone="neutral" variant="outline">
          {isRejecting ? t('sendingFeedback') : t('askForChanges')}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start) return 'Schedule not set';
  const startLabel = new Date(start).toLocaleString();
  const endLabel = end ? new Date(end).toLocaleTimeString() : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function getCustomerTaskPhaseLabel(task: CustomerTaskDetail) {
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

function getTaskerInitials(displayName: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'T';
}

function getCustomerBlockedReasonText(actions: CustomerCoreTaskNextActions) {
  switch (actions.blockedReasonCode) {
    case 'PAYMENT_NOT_READY':
      return t('approvalWaitingPaymentReady');
    case 'WAITING_FOR_PROVIDER':
      return actions.blockedReason || t('waitingForCustomer');
    case 'ALREADY_COMPLETED':
      return t('taskAlreadyCompleted');
    case 'TASK_DISPUTED':
      return t('disputed');
    case 'TASK_CANCELLED':
      return t('cancelled');
    case 'TASK_NOT_STARTED':
      return t('taskNotStartedYet');
    default:
      return actions.blockedReason || t('notAvailable');
  }
}

function isPaymentReadOnlyAction(actions: CustomerCoreTaskNextActions) {
  return actions.primaryAction === 'prepare_payment' || actions.primaryAction === 'confirm_payment' || actions.primaryAction === 'retry_payment';
}

function hasPaymentSetupAction(actions: CustomerCoreTaskNextActions) {
  return actions.canPreparePayment || actions.canConfirmPayment || actions.canRetryPayment;
}

function getPaymentSetupButtonLabel(actions?: CustomerCoreTaskNextActions) {
  if (actions?.canRetryPayment || actions?.primaryAction === 'retry_payment') return t('retryPayment');
  if (actions?.canConfirmPayment || actions?.primaryAction === 'confirm_payment') return t('continuePaymentSetup');
  return t('setUpProtectedPayment');
}

function getPaymentSetupStageLabel(stage: PaymentSetupStage) {
  if (stage === 'setup') return t('settingUpPayment');
  if (stage === 'confirm') return t('confirmingCard');
  return t('finalizingPaymentSetup');
}

function getPaymentSetupErrorText(code?: string, fallback?: string) {
  switch (code) {
    case 'STRIPE_NOT_CONFIGURED':
    case 'PAYMENT_NOT_CONFIGURED':
      return t('paymentsNotConfiguredYet');
    case 'PAYMENT_METHOD_REQUIRED':
      return t('paymentMethodRequired');
    case 'PAYMENT_SETUP_NOT_AVAILABLE':
    case 'PAYMENT_SETUP_REQUIRED':
    case 'PAYMENT_SETUP_INVALID':
    case 'SETUP_NOT_AVAILABLE':
      return t('paymentSetupUnavailable');
    case 'TASK_NOT_RESERVED':
    case 'NO_RESERVED_TASKER':
    case 'RESERVATION_EXPIRED':
    case 'BOOKING_NOT_FOUND':
    case 'INVALID_PAYMENT_STATE':
      return t('taskNoLongerAvailable');
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return t('loginRequired');
    default:
      return fallback || t('couldNotSetUpPayment');
  }
}

function getStripeSetupErrorText(code?: string) {
  const normalizedCode = code?.toLowerCase() ?? '';
  if (normalizedCode.includes('cancel')) return t('cardConfirmationCancelled');
  return t('couldNotSetUpPayment');
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

function getPaymentAccentColor(paymentState: CustomerCorePaymentState) {
  if (paymentState.status === 'failed' || paymentState.status === 'disputed') return colors.danger600;
  if (paymentState.status === 'payment_method_required' || paymentState.status === 'unknown') return colors.warning600;
  if (paymentState.canShowPaymentProtectedBadge || paymentState.paymentProtected) return colors.success600;
  return colors.tasklyBlue600;
}

const styles = StyleSheet.create({
  cardField: { height: 52, width: '100%' },
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  stack: { gap: spacing.sm },
  taskerBody: { flex: 1, gap: spacing.xs },
  taskerImage: { borderRadius: 24, height: 48, width: 48 },
  taskerInitials: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  taskerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  timelineItem: { gap: spacing.xs },
});
