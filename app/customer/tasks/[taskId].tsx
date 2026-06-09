import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { FormField } from '@/src/components/taskly/FormField';
import { KeyboardAwareFormScreen } from '@/src/components/taskly/KeyboardAwareFormScreen';
import { AppButton, AppCard, AppText, StatusBadge } from '@/src/components/ui';
import {
  approveCustomerTaskCompletion,
  bookAgainCustomerTask,
  cancelCustomerTask,
  finalizeCustomerTaskPayment,
  getCustomerTaskDetail,
  rejectCustomerTaskCompletion,
  requestCustomerTaskSupport,
  selectCustomerTasker,
  setupCustomerTaskPayment,
  updateCustomerTask,
} from '@/src/lib/api/customer';
import {
  CoreCancellationState,
  CoreDisputeState,
  CoreRefundState,
  CoreSupportState,
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
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

type PaymentSetupStage = 'setup' | 'confirm' | 'finalize';
type StatusTone = 'core' | 'pro' | 'success' | 'warning' | 'danger' | 'neutral';
type TaskEditPickerTarget = 'date' | 'start' | 'end' | null;

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
  const [isCancellingTask, setIsCancellingTask] = useState(false);
  const [isRejectingCompletion, setIsRejectingCompletion] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentSetupStage, setPaymentSetupStage] = useState<PaymentSetupStage | null>(null);
  const [selectingTaskerId, setSelectingTaskerId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationReasonError, setCancellationReasonError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState<string | null>(null);
  const [supportDetails, setSupportDetails] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportReasonError, setSupportReasonError] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldError, setEditFieldError] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [isSavingTaskEdit, setIsSavingTaskEdit] = useState(false);
  const [isBookingAgain, setIsBookingAgain] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<TaskEditPickerTarget>(null);

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
      setStateLabel(t('loginRequired'));
      setMessage(t('signInToViewTasklyTasks'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('signInToViewTasklyTasks'));
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
    setStateLabel(result.status === 404 ? t('notFound') : result.status === 401 || result.status === 403 ? t('loginRequired') : t('backendUnavailable'));
    setMessage(result.status === 404 ? t('taskDetailMissing') : t('couldNotLoadTaskDetail'));
  }, [getValidAccessToken, status, taskId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const task = data?.task;

  useEffect(() => {
    if (!task) return;
    const start = task.scheduledStartAt ? new Date(task.scheduledStartAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = task.scheduledEndAt ? new Date(task.scheduledEndAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    setEditBudget(parseMoneyFromLabel(task.priceLabel));
    setEditDate(toDateInputValue(start));
    setEditStartTime(toTimeInputValue(start));
    setEditEndTime(toTimeInputValue(end));
    setEditError(null);
    setEditFieldError(null);
    setEditMessage(null);
  }, [task?.id, task?.priceLabel, task?.scheduledEndAt, task?.scheduledStartAt]);

  const handleOpenChat = useCallback(() => {
    if (task?.messageThreadId) {
      router.push(`/customer/messages/${encodeURIComponent(task.messageThreadId)}` as Href);
      return;
    }

    router.push('/customer/messages' as Href);
  }, [router, task?.messageThreadId]);

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

  const markDemoTaskCancelled = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      const wasLate = current.task.cancellationState?.status === 'late_cancellation_available';
      const cancellationState: CoreCancellationState = {
        ...(current.task.cancellationState || {
          blockedReason: null,
          blockedReasonCode: null,
          estimatedPolicyOutcomeLabel: null,
          feeLabel: null,
          freeCancellationUntil: null,
          helperText: t('taskCancelled'),
          policySummary: t('cancellationPolicy'),
          refundLabel: null,
          requiresReason: false,
          status: 'cancelled',
          statusLabel: t('cancelled'),
          supportReviewLabel: null,
        }),
        blockedReason: t('taskCancelled'),
        blockedReasonCode: 'TASK_CANCELLED',
        helperText: wasLate ? t('lateCancellationSubmitted') : t('taskCancelled'),
        requiresReason: false,
        status: wasLate ? 'cancelled_late' : 'cancelled_free',
        statusLabel: t('cancelled'),
      };

      return {
        task: {
          ...current.task,
          cancellationBlockedReason: cancellationState.blockedReason,
          cancellationPolicySummary: cancellationState.policySummary,
          cancellationState,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskCancelled'),
            blockedReasonCode: 'TASK_CANCELLED',
            canApproveCompletion: false,
            canCancel: false,
            canCancelFree: false,
            canCancelLate: false,
            canOpenSupport: false,
            canPreparePayment: false,
            canRejectCompletion: false,
            canRequestHelp: false,
            canRequestRefund: false,
            primaryAction: 'none',
          },
          paymentState: {
            ...current.task.paymentState,
            helperText: t('cancelledByBackendPolicy'),
            paymentProtected: false,
            status: current.task.paymentState.status === 'held' ? 'refunded' : 'cancelled',
            statusLabel: current.task.paymentState.status === 'held' ? t('paymentRefunded') : t('cancelled'),
          },
          paymentStatusLabel: current.task.paymentState.status === 'held' ? t('paymentRefunded') : t('cancelled'),
          status: 'CANCELLED',
          statusLabel: t('cancelled'),
        },
      };
    });
  }, []);

  const markDemoSupportRequested = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      const supportState: CoreSupportState = {
        blockedReason: null,
        blockedReasonCode: null,
        helperText: t('supportReviewSubmitted'),
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-support-request',
        latestRequestType: 'IN_PROGRESS_CANCELLATION_REQUEST',
        status: 'under_review',
        statusLabel: t('underSupportReview'),
        supportReviewLabel: t('supportReviewSubmitted'),
      };
      const disputeState: CoreDisputeState = {
        helperText: t('supportReviewSubmitted'),
        resolutionLabel: null,
        status: 'under_review',
        statusLabel: t('underSupportReview'),
        supportReviewLabel: t('supportReviewSubmitted'),
      };
      const refundState: CoreRefundState = {
        helperText: t('refundReviewHandledBySupport'),
        outcomeLabel: null,
        status: 'under_review',
        statusLabel: t('refundReview'),
      };

      return {
        task: {
          ...current.task,
          disputeState,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('underSupportReview'),
            blockedReasonCode: 'TASK_DISPUTED',
            canApproveCompletion: false,
            canCancel: false,
            canCancelFree: false,
            canCancelLate: false,
            canOpenSupport: true,
            canRejectCompletion: false,
            canRequestHelp: false,
            canRequestRefund: false,
            primaryAction: 'open_support_status',
          },
          paymentState: {
            ...current.task.paymentState,
            helperText: t('supportReviewSubmitted'),
            paymentStatus: 'DISPUTED',
            status: 'disputed',
            statusLabel: t('underSupportReview'),
          },
          paymentStatusLabel: t('underSupportReview'),
          refundState,
          status: 'DISPUTED',
          statusLabel: t('underSupportReview'),
          supportReviewLabel: t('supportReviewSubmitted'),
          supportState,
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

  const handleTaskEditPickerChange = useCallback((event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === 'date') {
      setEditDate(toDateInputValue(selected));
    } else if (pickerTarget === 'start') {
      setEditStartTime(toTimeInputValue(selected));
    } else if (pickerTarget === 'end') {
      setEditEndTime(toTimeInputValue(selected));
    }
    setEditFieldError(null);
    setPickerTarget(null);
  }, [pickerTarget]);

  const submitTaskEdit = useCallback(async () => {
    setEditError(null);
    setEditFieldError(null);
    setEditMessage(null);

    if (!task?.nextActions.canEditBudget && !task?.nextActions.canEditSchedule) {
      setEditError(t('taskNoLongerEditable'));
      return;
    }

    const payload: { budgetEur?: number; scheduledEndAt?: string; scheduledStartAt?: string } = {};

    if (task.nextActions.canEditBudget) {
      const budgetValue = Number(editBudget.replace(',', '.'));
      if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
        setEditFieldError(t('invalidBudget'));
        return;
      }
      payload.budgetEur = budgetValue;
    }

    if (task.nextActions.canEditSchedule) {
      const startAt = buildLocalDateTime(editDate, editStartTime);
      const endAt = buildLocalDateTime(editDate, editEndTime);
      if (!startAt || !endAt) {
        setEditFieldError(t('scheduleInvalidMissing'));
        return;
      }
      if (startAt >= endAt) {
        setEditFieldError(t('scheduleEndAfterStart'));
        return;
      }
      payload.scheduledStartAt = startAt.toISOString();
      payload.scheduledEndAt = endAt.toISOString();
    }

    if (status === 'demo') {
      setData((current) => current ? {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            canEditBudget: current.task.nextActions.canEditBudget,
            canEditSchedule: current.task.nextActions.canEditSchedule,
          },
          priceLabel: payload.budgetEur ? `EUR ${payload.budgetEur}` : current.task.priceLabel,
          scheduledEndAt: payload.scheduledEndAt ?? current.task.scheduledEndAt,
          scheduledStartAt: payload.scheduledStartAt ?? current.task.scheduledStartAt,
        },
      } : current);
      setEditMessage(`${t('taskUpdatedSuccessfully')} ${t('demoModeNoRealPayments')}`);
      return;
    }

    if (status !== 'authenticated') {
      setEditError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setEditError(t('loginRequired'));
      return;
    }

    setIsSavingTaskEdit(true);
    const result = await updateCustomerTask(taskId, payload, authToken);
    setIsSavingTaskEdit(false);

    if (result.ok) {
      setData({ task: result.data.task });
      setEditMessage(result.data.message || t('taskUpdatedSuccessfully'));
      return;
    }

    const fieldErrors = result.error.details && typeof result.error.details === 'object' && 'fieldErrors' in result.error.details
      ? (result.error.details as { fieldErrors?: Record<string, string> }).fieldErrors
      : undefined;
    const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : null;

    if (result.error.code === 'NOT_OPEN' || result.error.code === 'HAS_INTEREST' || result.error.code === 'SCHEDULE_LOCKED') {
      setEditError(result.error.code === 'SCHEDULE_LOCKED' ? t('taskNoLongerEditable') : result.error.message);
      await loadDetail();
      return;
    }

    setEditError(firstFieldError || result.error.message || t('taskUpdateFailed'));
  }, [
    editBudget,
    editDate,
    editEndTime,
    editStartTime,
    getValidAccessToken,
    loadDetail,
    status,
    task,
    taskId,
  ]);

  const submitBookAgain = useCallback(async () => {
    setEditError(null);
    setEditMessage(null);

    if (!task?.nextActions.canBookAgain) {
      setEditError(t('bookAgainFailed'));
      return;
    }

    if (status === 'demo') {
      setEditMessage(t('similarTaskCreated'));
      router.push('/customer/post-task' as Href);
      return;
    }

    if (status !== 'authenticated') {
      setEditError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setEditError(t('loginRequired'));
      return;
    }

    setIsBookingAgain(true);
    const result = await bookAgainCustomerTask(taskId, authToken);
    setIsBookingAgain(false);

    if (result.ok) {
      setEditMessage(t('similarTaskCreated'));
      router.push(result.data.routeHint as Href);
      return;
    }

    setEditError(result.error.message || t('bookAgainFailed'));
  }, [getValidAccessToken, router, status, task?.nextActions.canBookAgain, taskId]);

  const submitCancelTask = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);
    setActionWarning(null);
    setCancellationReasonError(null);

    if (!task?.nextActions.canCancel) {
      setActionError(t('cancellationNotAvailable'));
      return;
    }

    const reason = cancellationReason.trim();
    if ((task.nextActions.canCancelLate || task.cancellationState?.requiresReason) && !reason) {
      setCancellationReasonError(t('reasonRequired'));
      return;
    }
    if (reason.length > 1000) {
      setCancellationReasonError(t('messageTooLong'));
      return;
    }

    if (status === 'demo') {
      markDemoTaskCancelled();
      setCancellationReason('');
      setActionMessage(t('taskCancelled'));
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

    setIsCancellingTask(true);
    const result = await cancelCustomerTask(taskId, { confirmationAccepted: true, ...(reason ? { reason } : null) }, authToken);
    setIsCancellingTask(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setCancellationReason('');
      setActionMessage(result.data.message || t('taskCancelled'));
      return;
    }

    if (result.error.code === 'MISSING_REASON') {
      setCancellationReasonError(t('reasonRequired'));
      return;
    }
    if (result.error.code === 'REASON_TOO_LONG') {
      setCancellationReasonError(t('messageTooLong'));
      return;
    }
    if (result.error.code === 'CANCELLATION_REQUIRES_SUPPORT') {
      setActionError(t('cancellationBlockedUseSupport'));
      return;
    }

    setActionError(result.error.message || t('couldNotCancelTask'));
  }, [
    cancellationReason,
    getValidAccessToken,
    loadDetail,
    markDemoTaskCancelled,
    status,
    task?.cancellationState?.requiresReason,
    task?.nextActions.canCancel,
    task?.nextActions.canCancelLate,
    taskId,
  ]);

  const handleCancelTask = useCallback(() => {
    if (!task) return;

    const summary = [
      task.cancellationState?.estimatedPolicyOutcomeLabel,
      task.cancellationState?.policySummary || task.cancellationPolicySummary,
      task.nextActions.canCancelLate ? t('lateCancellationConfirmBody') : t('freeCancellationConfirmBody'),
    ].filter(Boolean).join('\n');

    Alert.alert(
      task.nextActions.canCancelLate ? t('lateCancellationWarning') : t('confirmCancellation'),
      summary,
      [
        { style: 'cancel', text: t('keepTask') },
        { onPress: () => void submitCancelTask(), style: 'destructive', text: t('cancelTask') },
      ],
    );
  }, [submitCancelTask, task]);

  const submitSupportRequest = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);
    setActionWarning(null);
    setSupportReasonError(null);

    const reason = supportReason.trim();
    const details = supportDetails.trim();
    if (!reason) {
      setSupportReasonError(t('reasonRequired'));
      return;
    }
    if (reason.length > 2000 || details.length > 6000) {
      setSupportReasonError(t('messageTooLong'));
      return;
    }

    if (!task || !canRequestCustomerSupport(task.nextActions)) {
      setActionError(t('supportRequestNotAvailable'));
      return;
    }

    if (status === 'demo') {
      markDemoSupportRequested();
      setSupportDetails('');
      setSupportReason('');
      setActionMessage(t('supportRequestSubmitted'));
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

    setIsRequestingSupport(true);
    const result = await requestCustomerTaskSupport(taskId, { details, reason }, authToken);
    setIsRequestingSupport(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setSupportDetails('');
      setSupportReason('');
      setActionMessage(result.data.message || t('supportRequestSubmitted'));
      return;
    }

    if (result.error.code === 'MISSING_REASON') {
      setSupportReasonError(t('reasonRequired'));
      return;
    }
    if (result.error.code === 'REASON_TOO_LONG' || result.error.code === 'DETAILS_TOO_LONG') {
      setSupportReasonError(t('messageTooLong'));
      return;
    }

    setActionError(result.error.message || t('couldNotRequestSupport'));
  }, [
    getValidAccessToken,
    loadDetail,
    markDemoSupportRequested,
    status,
    supportDetails,
    supportReason,
    task,
    taskId,
  ]);

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
    <KeyboardAwareFormScreen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <AppButton onPress={() => router.back()} variant="ghost">
          {t('back')}
        </AppButton>
        <StatusBadge label="Taskly" tone="core" />
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('taskDetailLoading')} tone="core" /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || t('latestUpdate')} tone="warning" />
          <AppText variant="cardTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {task ? (
        <>
          <TaskDetailHero task={task} />
          <TaskSummarySection task={task} />
          <ScopeChecklistSection task={task} />
          <TaskScheduleSection task={task} />
          <TaskManagementCard
            budget={editBudget}
            date={editDate}
            endTime={editEndTime}
            error={editError}
            fieldError={editFieldError}
            isBookingAgain={isBookingAgain}
            isSaving={isSavingTaskEdit}
            message={editMessage}
            onBookAgain={submitBookAgain}
            onBudgetChange={setEditBudget}
            onOpenPicker={setPickerTarget}
            onSave={submitTaskEdit}
            startTime={editStartTime}
            task={task}
          />
          {pickerTarget ? (
            <DateTimePicker
              mode={pickerTarget === 'date' ? 'date' : 'time'}
              onChange={handleTaskEditPickerChange}
              value={getPickerValue(pickerTarget, editDate, pickerTarget === 'end' ? editEndTime : editStartTime)}
            />
          ) : null}
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
          <NextActions
            actions={task.nextActions}
            messageThreadId={task.messageThreadId}
            onOpenChat={handleOpenChat}
            tone="core"
          />
          <CoreCancellationSupportCard task={task} />
          <CustomerCancellationSupportActions
            actionError={actionError}
            actionMessage={actionMessage}
            cancellationReason={cancellationReason}
            cancellationReasonError={cancellationReasonError}
            isCancelling={isCancellingTask}
            isRequestingSupport={isRequestingSupport}
            onCancelTask={handleCancelTask}
            onCancellationReasonChange={setCancellationReason}
            onRequestSupport={submitSupportRequest}
            onSupportDetailsChange={setSupportDetails}
            onSupportReasonChange={setSupportReason}
            supportDetails={supportDetails}
            supportReason={supportReason}
            supportReasonError={supportReasonError}
            task={task}
          />
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
    </KeyboardAwareFormScreen>
  );
}

function StateCard({ label, message, tone }: { label: string; message: string; tone: 'core' | 'neutral' }) {
  return (
    <AppCard accentColor={tone === 'core' ? colors.tasklyBlue600 : colors.navy900} style={styles.sectionCard}>
      <StatusBadge label={label} tone={tone} />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function TaskDetailHero({ task }: { task: CustomerTaskDetail }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600} style={styles.heroCard}>
      <View style={styles.badgeRow}>
        <StatusBadge label={getCustomerTaskPhaseLabel(task)} tone="core" />
        <StatusBadge label={getPaymentStateLabel(task.paymentState)} tone={getPaymentStateTone(task.paymentState)} />
      </View>
      <View style={styles.heroCopy}>
        <AppText style={styles.heroTitle} variant="screenTitle">
          {task.title}
        </AppText>
        <AppText color={colors.slate700} style={styles.heroSubtitle}>
          {task.categoryLabel} · {task.cityLabel}
        </AppText>
      </View>
      <View style={styles.heroMetaRow}>
        <View style={styles.heroMetaItem}>
          <AppText color={colors.slate500} variant="small">
            {t('currentStatus')}
          </AppText>
          <AppText variant="bodyStrong">{task.statusLabel || getCustomerTaskPhaseLabel(task)}</AppText>
        </View>
        <View style={styles.heroMetaItem}>
          <AppText color={colors.slate500} variant="small">
            {t('taskCardNextAction')}
          </AppText>
          <AppText variant="bodyStrong">{getCustomerDetailNextActionLabel(task.nextActions, task.statusLabel)}</AppText>
        </View>
      </View>
    </AppCard>
  );
}

function TaskSummarySection({ task }: { task: CustomerTaskDetail }) {
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <AppText variant="cardTitle">{t('taskSummary')}</AppText>
        <StatusBadge label="Taskly" tone="core" />
      </View>
      <AppText color={colors.slate700} style={styles.descriptionText}>
        {task.description}
      </AppText>
      <View style={styles.infoGrid}>
        <Info label={t('taskCardBudget')} value={task.priceLabel} />
        <Info label={t('taskCardLocation')} value={task.cityLabel} />
        <Info label={t('taskCardSchedule')} value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
        <Info label={t('address')} value={task.addressPreviewLabel} />
      </View>
    </AppCard>
  );
}

function ScopeChecklistSection({ task }: { task: CustomerTaskDetail }) {
  const checklist = task.scopeChecklist ?? [];
  if (!checklist.length) return null;

  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <AppText variant="cardTitle">{t('scopeChecklist')}</AppText>
        <StatusBadge label={`${checklist.filter((item) => item.checked).length}/${checklist.length}`} tone="core" />
      </View>
      <View style={styles.scopeChecklistList}>
        {checklist.map((item, index) => (
          <View key={`${item.code || 'scope'}-${index}`} style={styles.scopeChecklistRow}>
            <View style={[styles.scopeChecklistIcon, item.checked ? styles.scopeChecklistIconChecked : null]}>
              <AppText color={item.checked ? colors.white : colors.slate500} style={styles.scopeChecklistIconText}>
                {item.checked ? 'OK' : '-'}
              </AppText>
            </View>
            <AppText color={colors.slate700} style={styles.scopeChecklistLabel}>
              {item.label || item.code || 'Scope item'}
            </AppText>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

function TaskScheduleSection({ task }: { task: CustomerTaskDetail }) {
  const taskerLabel = task.taskerPreview
    ? `${task.taskerPreview.displayName} · ${task.taskerPreview.ratingLabel}`
    : t('noTaskerSelected');

  return (
    <AppCard accentColor={colors.tasklyBlue600} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <AppText variant="cardTitle">{t('taskSchedule')}</AppText>
        <StatusBadge label={t('paymentProtected')} tone="success" />
      </View>
      <View style={styles.infoGrid}>
        <Info label={t('taskSchedule')} value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
        <Info label={t('taskCardBudget')} value={task.priceLabel} />
        <Info label={t('selectedTasker')} value={taskerLabel} />
      </View>
    </AppCard>
  );
}

function TaskManagementCard({
  budget,
  date,
  endTime,
  error,
  fieldError,
  isBookingAgain,
  isSaving,
  message,
  onBookAgain,
  onBudgetChange,
  onOpenPicker,
  onSave,
  startTime,
  task,
}: {
  budget: string;
  date: string;
  endTime: string;
  error: string | null;
  fieldError: string | null;
  isBookingAgain: boolean;
  isSaving: boolean;
  message: string | null;
  onBookAgain: () => void;
  onBudgetChange: (value: string) => void;
  onOpenPicker: (target: TaskEditPickerTarget) => void;
  onSave: () => void;
  startTime: string;
  task: CustomerTaskDetail;
}) {
  const canEdit = task.nextActions.canEditBudget || task.nextActions.canEditSchedule;
  const canBookAgain = task.nextActions.canBookAgain;

  if (!canEdit && !canBookAgain) return null;

  return (
    <AppCard accentColor={colors.tasklyBlue600} style={[styles.sectionCard, styles.managementCard]}>
      <View style={styles.sectionHeader}>
        <AppText variant="cardTitle">{t('editBudgetAndSchedule')}</AppText>
        <StatusBadge label={canEdit ? t('updateTaskDetails') : t('readOnly')} tone={canEdit ? 'core' : 'neutral'} />
      </View>

      {canEdit ? (
        <>
          <AppText color={colors.slate700}>{t('taskEditAvailabilityWarning')}</AppText>
          {task.nextActions.canEditBudget ? (
            <FormField
              errorText={fieldError && fieldError === t('invalidBudget') ? fieldError : undefined}
              helperText={t('newBudgetHelper')}
              keyboardType="numeric"
              label={t('newBudget')}
              onChangeText={onBudgetChange}
              placeholder="40"
              value={budget}
            />
          ) : (
            <AppText color={colors.slate500}>{t('budgetNoLongerEditable')}</AppText>
          )}
          {task.nextActions.canEditSchedule ? (
            <View style={styles.pickerStack}>
              <AppText color={colors.slate500} variant="small">{t('newDate')}</AppText>
              <AppButton onPress={() => onOpenPicker('date')} tone="neutral" variant="outline">
                {date || t('newDate')}
              </AppButton>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerItem}>
                  <AppText color={colors.slate500} variant="small">{t('newStartTime')}</AppText>
                  <AppButton onPress={() => onOpenPicker('start')} tone="neutral" variant="outline">
                    {startTime || t('newTime')}
                  </AppButton>
                </View>
                <View style={styles.timePickerItem}>
                  <AppText color={colors.slate500} variant="small">{t('newEndTime')}</AppText>
                  <AppButton onPress={() => onOpenPicker('end')} tone="neutral" variant="outline">
                    {endTime || t('newTime')}
                  </AppButton>
                </View>
              </View>
              {fieldError && fieldError !== t('invalidBudget') ? <AppText color={colors.danger600}>{fieldError}</AppText> : null}
            </View>
          ) : (
            <AppText color={colors.slate500}>{t('scheduleNoLongerEditable')}</AppText>
          )}
          <AppButton loading={isSaving} onPress={onSave}>
            {isSaving ? t('savingChanges') : t('saveChanges')}
          </AppButton>
        </>
      ) : null}

      {canBookAgain ? (
        <View style={styles.bookAgainBlock}>
          <StatusBadge label={t('bookAgain')} tone="core" />
          <AppText variant="bodyStrong">{t('createSimilarTask')}</AppText>
          <AppText color={colors.slate700}>{t('bookAgainHelper')}</AppText>
          <AppButton loading={isBookingAgain} onPress={onBookAgain} variant={canEdit ? 'outline' : 'filled'}>
            {isBookingAgain ? t('loading') : t('reviewAndPost')}
          </AppButton>
        </View>
      ) : null}

      {message ? <AppText color={colors.success600}>{message}</AppText> : null}
      {error ? <AppText color={colors.danger600}>{error}</AppText> : null}
    </AppCard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.navy900} style={styles.infoValue} variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard style={styles.sectionCard}>
      <AppText variant="cardTitle">{t('taskPhotos')}</AppText>
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
    <AppCard accentColor={colors.tasklyBlue600} style={styles.sectionCard}>
      <AppText variant="cardTitle">{t('taskTimeline')}</AppText>
      {items.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <StatusBadge label={getTimelineStatusLabel(item.status)} tone={accent} />
          <AppText variant="bodyStrong">{item.label}</AppText>
          <AppText color={colors.slate700}>{item.description}</AppText>
        </View>
      ))}
    </AppCard>
  );
}

function NextActions({
  actions,
  messageThreadId,
  onOpenChat,
  tone,
}: {
  actions: CustomerCoreTaskNextActions;
  messageThreadId?: string | null;
  onOpenChat: () => void;
  tone: 'core';
}) {
  if (isPaymentReadOnlyAction(actions)) return null;

  const isCompletionReview = actions.canApproveCompletion || actions.canRejectCompletion;
  const canOpenChat = actions.canChat && Boolean(messageThreadId);
  const label = isCompletionReview
    ? t('waitingForCustomerApproval')
    : actions.primaryAction === 'select_tasker'
        ? t('customerSelectingTasker')
        : canOpenChat
          ? t('openConversation')
        : actions.primaryAction === 'review'
          ? t('completed')
          : t('notAvailable');

  return (
    <AppCard style={styles.sectionCard}>
      <AppText variant="cardTitle">{t('nextSteps')}</AppText>
      {isCompletionReview ? (
        <AppText color={colors.slate700}>{t('completionRequested')}</AppText>
      ) : actions.blockedReason || actions.blockedReasonCode ? (
        <AppText color={colors.slate700}>{getCustomerBlockedReasonText(actions)}</AppText>
      ) : null}
      {canOpenChat ? (
        <AppButton onPress={onOpenChat} tone={tone} variant="outline">{t('openConversation')}</AppButton>
      ) : (
        <AppButton disabled tone={tone} variant="outline">{label}</AppButton>
      )}
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
    <AppCard accentColor={colors.tasklyBlue600} style={[styles.sectionCard, styles.taskerSectionCard]}>
      <StatusBadge label={t('chooseTasker')} tone="core" />
      <AppText variant="cardTitle">{t('taskerResponses')}</AppText>
      <AppText color={colors.slate700}>{t('nextStepPaymentSetup')}</AppText>
      {taskers.length === 0 ? (
        <AppText color={colors.slate700}>{t('noInterestedTaskersYet')}</AppText>
      ) : (
        <View style={styles.stack}>
          {taskers.map((tasker) => (
            <View key={tasker.id} style={styles.taskerOptionCard}>
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
            </View>
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
    <AppCard accentColor={getPaymentAccentColor(paymentState)} style={[styles.sectionCard, styles.paymentSectionCard]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatusBadge label={getPaymentStateLabel(paymentState)} tone={getPaymentStateTone(paymentState)} />
        {paymentState.paymentRequired ? <StatusBadge label={t('protectedPaymentFlow')} tone="neutral" /> : null}
      </View>
      <AppText variant="cardTitle">{t('taskPaymentProtectedTitle')}</AppText>
      <AppText color={colors.slate700}>{getPaymentStateHelperText(paymentState)}</AppText>
      {hasPaymentSetupAction(nextActions) ? <AppText color={colors.slate700}>{t('cardHandledSecurelyByStripe')}</AppText> : null}
    </AppCard>
  );
}

function CoreCancellationSupportCard({ task }: { task: CustomerTaskDetail }) {
  const cancellation = task.cancellationState;
  const support = task.supportState;
  const dispute = task.disputeState;
  const refund = task.refundState;
  return (
    <AppCard accentColor={getCancellationSupportAccent(cancellation, support, dispute)} style={[styles.sectionCard, styles.supportSectionCard]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {cancellation ? (
          <StatusBadge label={getCancellationStateLabel(cancellation)} tone={getCancellationSupportTone(cancellation, support, dispute)} />
        ) : null}
        {support && isRelevantSupportState(support) ? (
          <StatusBadge label={getSupportStateLabel(support)} tone="warning" />
        ) : null}
        {refund && isRelevantRefundState(refund) ? (
          <StatusBadge label={getRefundStateLabel(refund)} tone="neutral" />
        ) : null}
      </View>
      <AppText variant="cardTitle">{t('cancellationAndSupport')}</AppText>
      <AppText color={colors.slate700}>{t('paymentCancellationHelpBody')}</AppText>
      <AppText color={colors.slate700}>{t('cancellationPolicyHelpBody')}</AppText>
      <AppText color={colors.slate700}>{t('refundHelpBody')}</AppText>
      <AppText color={colors.slate700}>{t('supportEscalationHelpBody')}</AppText>
      {cancellation ? <AppText color={colors.slate700}>{cancellation.helperText}</AppText> : null}
      {cancellation?.estimatedPolicyOutcomeLabel ? (
        <AppText color={colors.slate700}>{cancellation.estimatedPolicyOutcomeLabel}</AppText>
      ) : null}
      {cancellation?.feeLabel ? (
        <AppText color={colors.slate700}>{`${t('lateCancellationMayApply')}: ${cancellation.feeLabel}`}</AppText>
      ) : null}
      {cancellation?.refundLabel ? (
        <AppText color={colors.slate700}>{`${t('refundReview')}: ${cancellation.refundLabel}`}</AppText>
      ) : null}
      {support && isRelevantSupportState(support) ? <AppText color={colors.slate700}>{support.helperText}</AppText> : null}
      {dispute && isRelevantDisputeState(dispute) ? <AppText color={colors.slate700}>{dispute.helperText}</AppText> : null}
      {refund && isRelevantRefundState(refund) ? <AppText color={colors.slate700}>{refund.helperText}</AppText> : null}
      {!task.nextActions.canCancel && !canRequestCustomerSupport(task.nextActions) ? (
        <AppText color={colors.slate500}>{t('readOnlyNoAction')}</AppText>
      ) : null}
    </AppCard>
  );
}

function CustomerCancellationSupportActions({
  actionError,
  actionMessage,
  cancellationReason,
  cancellationReasonError,
  isCancelling,
  isRequestingSupport,
  onCancelTask,
  onCancellationReasonChange,
  onRequestSupport,
  onSupportDetailsChange,
  onSupportReasonChange,
  supportDetails,
  supportReason,
  supportReasonError,
  task,
}: {
  actionError: string | null;
  actionMessage: string | null;
  cancellationReason: string;
  cancellationReasonError: string | null;
  isCancelling: boolean;
  isRequestingSupport: boolean;
  onCancelTask: () => void;
  onCancellationReasonChange: (value: string) => void;
  onRequestSupport: () => void;
  onSupportDetailsChange: (value: string) => void;
  onSupportReasonChange: (value: string) => void;
  supportDetails: string;
  supportReason: string;
  supportReasonError: string | null;
  task: CustomerTaskDetail;
}) {
  const canCancel = task.nextActions.canCancel;
  const canRequestSupport = canRequestCustomerSupport(task.nextActions);
  if (!canCancel && !canRequestSupport) return null;

  const cancellation = task.cancellationState;
  const isLateCancellation = task.nextActions.canCancelLate || cancellation?.status === 'late_cancellation_available';

  return (
    <AppCard accentColor={isLateCancellation || canRequestSupport ? colors.warning600 : colors.slate500} style={[styles.sectionCard, styles.supportSectionCard]}>
      <StatusBadge
        label={canRequestSupport ? t('requestSupportReview') : isLateCancellation ? t('lateCancellationWarning') : t('freeCancellationAvailable')}
        tone={isLateCancellation || canRequestSupport ? 'warning' : 'neutral'}
      />
      <AppText variant="cardTitle">{canRequestSupport ? t('contactSupport') : t('cancelTask')}</AppText>
      {canCancel ? (
        <>
          <AppText color={colors.slate700}>
            {cancellation?.estimatedPolicyOutcomeLabel || cancellation?.policySummary || task.cancellationPolicySummary || t('cancellationPolicy')}
          </AppText>
          {isLateCancellation ? (
            <>
              <AppText color={colors.warning600}>{t('protectedPaymentCancellationNote')}</AppText>
              <FormField
                errorText={cancellationReasonError || undefined}
                helperText={t('lateCancellationReasonHelper')}
                label={t('cancellationReason')}
                multiline
                onChangeText={onCancellationReasonChange}
                placeholder={t('cancellationReason')}
                value={cancellationReason}
              />
            </>
          ) : null}
          <AppButton loading={isCancelling} onPress={onCancelTask} tone="neutral" variant="outline">
            {isCancelling ? t('cancellingTask') : t('cancelTask')}
          </AppButton>
        </>
      ) : null}
      {canRequestSupport ? (
        <>
          <AppText color={colors.slate700}>{task.cancellationBlockedReason || task.supportState?.helperText || t('supportRequestHelper')}</AppText>
          <FormField
            errorText={supportReasonError || undefined}
            helperText={t('supportReasonHelper')}
            label={t('supportReason')}
            multiline
            onChangeText={onSupportReasonChange}
            placeholder={t('supportReasonPlaceholder')}
            value={supportReason}
          />
          <FormField
            helperText={t('supportDetailsHelper')}
            label={t('supportDetails')}
            multiline
            onChangeText={onSupportDetailsChange}
            placeholder={t('supportDetailsPlaceholder')}
            value={supportDetails}
          />
          <AppButton loading={isRequestingSupport} onPress={onRequestSupport} tone="neutral" variant="outline">
            {isRequestingSupport ? t('submittingSupportRequest') : t('requestSupportReview')}
          </AppButton>
        </>
      ) : null}
      {actionMessage ? <AppText color={colors.success600}>{actionMessage}</AppText> : null}
      {actionError ? <AppText color={colors.danger600}>{actionError}</AppText> : null}
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
    <AppCard accentColor={colors.tasklyBlue600} style={[styles.sectionCard, styles.paymentSectionCard]}>
      <StatusBadge label={t('paymentProtected')} tone="core" />
      <AppText variant="cardTitle">{getPaymentSetupButtonLabel(task.nextActions)}</AppText>
      <AppText color={colors.slate700}>{t('cardHandledSecurelyByStripe')}</AppText>
      <AppText color={colors.slate700}>{t('paymentProtectedReleasedAfterApproval')}</AppText>
      <AppText color={colors.slate700}>{t('paymentHoldScheduledFlow')}</AppText>
      {isDemoMode ? <AppText color={colors.slate700}>{t('demoModeNoRealPayments')}</AppText> : null}
      {!paymentsConfigured && !isDemoMode ? <AppText color={colors.warning600}>{t('paymentsNotConfiguredYet')}</AppText> : null}
      {canCollectCard ? (
        <CardField
          cardStyle={{
            backgroundColor: colors.white,
            borderColor: colors.border,
            borderRadius: 14,
            borderWidth: 1,
            fontSize: 15,
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
    <AppCard accentColor={colors.warning600} style={[styles.sectionCard, styles.completionSectionCard]}>
      <StatusBadge label={t('waitingForCustomerApproval')} tone="warning" />
      <AppText variant="cardTitle">{t('approveCompletionPrompt')}</AppText>
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
  if (!start) return t('noScheduleSet');
  const startLabel = new Date(start).toLocaleString();
  const endLabel = end ? new Date(end).toLocaleTimeString() : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function parseMoneyFromLabel(label: string) {
  const match = label.match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(',', '.') : '';
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildLocalDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPickerValue(target: Exclude<TaskEditPickerTarget, null>, dateValue: string, timeValue: string) {
  if (target === 'date') {
    return buildLocalDateTime(dateValue, timeValue || '12:00') || new Date();
  }
  return buildLocalDateTime(dateValue || toDateInputValue(new Date()), timeValue || '12:00') || new Date();
}

function getTimelineStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'done' || normalized === 'completed') return t('completed');
  if (normalized === 'current' || normalized === 'active') return t('activeShort');
  if (normalized === 'upcoming') return t('upcomingActivity');
  return status;
}

function getCustomerDetailNextActionLabel(actions: CustomerCoreTaskNextActions, fallback: string) {
  if (actions.canPreparePayment || actions.primaryAction === 'prepare_payment') return t('setUpProtectedPayment');
  if (actions.canConfirmPayment || actions.primaryAction === 'confirm_payment') return t('continuePaymentSetup');
  if (actions.canRetryPayment || actions.primaryAction === 'retry_payment') return t('retryPayment');
  if (actions.canSelectTasker || actions.primaryAction === 'select_tasker') return t('customerSelectingTasker');
  if (actions.canApproveCompletion || actions.canRejectCompletion) return t('waitingForCustomerApproval');
  if (actions.canCancel || actions.primaryAction === 'cancel_task') return t('cancelTask');
  if (actions.canRequestHelp || actions.canOpenSupport) return t('requestSupportReview');
  if (actions.canReview || actions.primaryAction === 'review') return t('completed');
  return actions.blockedReason || fallback || t('notAvailable');
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

function canRequestCustomerSupport(actions: CustomerCoreTaskNextActions) {
  if (actions.canRequestHelp || actions.canRequestRefund) return true;
  return actions.canOpenSupport === true && actions.primaryAction === 'request_help';
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

function getPaymentStateTone(paymentState: CustomerCorePaymentState): StatusTone {
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

function isRelevantSupportState(state?: CoreSupportState) {
  return Boolean(state && state.status !== 'none' && state.status !== 'unknown');
}

function isRelevantDisputeState(state?: CoreDisputeState) {
  return Boolean(state && state.status !== 'none' && state.status !== 'unknown');
}

function isRelevantRefundState(state?: CoreRefundState) {
  return Boolean(state && state.status !== 'not_requested' && state.status !== 'not_available' && state.status !== 'unknown');
}

function getCancellationStateLabel(state: CoreCancellationState) {
  switch (state.status) {
    case 'free_cancellation_available':
      return t('freeCancellationAvailable');
    case 'late_cancellation_available':
      return t('lateCancellationMayApply');
    case 'blocked_after_start':
    case 'support_required':
      return t('supportRequired');
    case 'support_review':
      return t('underSupportReview');
    case 'cancelled':
    case 'cancelled_free':
    case 'cancelled_late':
      return t('cancelled');
    default:
      return state.statusLabel || t('cancellationNotAvailable');
  }
}

function getSupportStateLabel(state: CoreSupportState) {
  if (state.status === 'under_review') return t('underSupportReview');
  if (state.status === 'support_submitted') return t('supportRequestSent');
  if (state.status === 'help_available') return t('supportRequired');
  return state.statusLabel || t('support');
}

function getRefundStateLabel(state: CoreRefundState) {
  if (state.status === 'under_review') return t('refundReview');
  if (state.status === 'refunded') return state.statusLabel;
  return state.statusLabel || t('refundReview');
}

function getCancellationSupportTone(
  cancellation?: CoreCancellationState,
  support?: CoreSupportState,
  dispute?: CoreDisputeState,
): 'core' | 'danger' | 'neutral' | 'success' | 'warning' {
  if (dispute?.status === 'under_review' || support?.status === 'under_review' || cancellation?.status === 'support_review') return 'danger';
  if (cancellation?.status === 'free_cancellation_available') return 'success';
  if (cancellation?.status === 'late_cancellation_available' || cancellation?.status === 'blocked_after_start') return 'warning';
  return 'neutral';
}

function getCancellationSupportAccent(
  cancellation?: CoreCancellationState,
  support?: CoreSupportState,
  dispute?: CoreDisputeState,
) {
  const tone = getCancellationSupportTone(cancellation, support, dispute);
  if (tone === 'danger') return colors.danger600;
  if (tone === 'warning') return colors.warning600;
  if (tone === 'success') return colors.success600;
  return colors.tasklyBlue600;
}

const styles = StyleSheet.create({
  cardField: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 54,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    ...designTokens.shadows.card,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  heroCopy: { gap: spacing.sm },
  heroMetaItem: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minWidth: 132,
    padding: spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  heroTitle: { color: colors.navy900, fontSize: 26, lineHeight: 32 },
  image: {
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    width: '31%',
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: 132,
    padding: spacing.md,
  },
  infoValue: { fontSize: 13, lineHeight: 18 },
  completionSectionCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.12,
  },
  bookAgainBlock: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  managementCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    shadowColor: '#1877F2',
    shadowOpacity: 0.08,
  },
  paymentSectionCard: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    shadowColor: '#1877F2',
    shadowOpacity: 0.12,
  },
  screenContent: {
    backgroundColor: colors.slate50,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  scopeChecklistIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  scopeChecklistIconChecked: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
  },
  scopeChecklistIconText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  scopeChecklistLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scopeChecklistList: {
    gap: spacing.sm,
  },
  scopeChecklistRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  stack: { gap: spacing.md },
  pickerStack: { gap: spacing.sm },
  supportSectionCard: {
    backgroundColor: colors.white,
    borderColor: '#FECACA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
  },
  taskerSectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    shadowColor: '#1877F2',
    shadowOpacity: 0.09,
  },
  taskerBody: { flex: 1, gap: spacing.xs },
  taskerImage: {
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    width: 48,
  },
  taskerInitials: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  taskerOptionCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  taskerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  timePickerItem: { flex: 1, gap: spacing.xs, minWidth: 120 },
  timePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timelineItem: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
