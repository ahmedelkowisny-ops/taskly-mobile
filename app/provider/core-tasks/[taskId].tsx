import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';

import { FormField, formatCustomerPreviewLabel, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  CoreCancellationState,
  CoreDisputeState,
  CoreRefundState,
  CoreSupportState,
  ProviderCoreIssueState,
  ProviderCoreTaskDetail,
  ProviderCoreTaskDetailResponse,
} from '@/src/lib/api/domain';
import { getMockProviderCoreTaskDetailResponse } from '@/src/lib/api/mockApi';
import {
  expressInterestInCoreTask,
  getProviderCoreTaskDetail,
  markProviderCoreTaskOnTheWay,
  reportProviderCannotAttend,
  reportProviderCoreTaskIssue,
  requestProviderCoreTaskCompletion,
  requestProviderCoreTaskSupport,
  startProviderCoreTask,
} from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ProviderIssueActionKind = 'cannot_attend' | 'report_issue' | 'support_request';

export default function ProviderCoreTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskId = String(params.taskId || 'demo-provider-task');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);
  const [isExpressingInterest, setIsExpressingInterest] = useState(false);
  const [isMarkingOnTheWay, setIsMarkingOnTheWay] = useState(false);
  const [isRequestingCompletion, setIsRequestingCompletion] = useState(false);
  const [isStartingTask, setIsStartingTask] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [providerIssueDetails, setProviderIssueDetails] = useState('');
  const [providerIssueError, setProviderIssueError] = useState<string | null>(null);
  const [providerIssueMode, setProviderIssueMode] = useState<ProviderIssueActionKind | null>(null);
  const [providerIssueReason, setProviderIssueReason] = useState('');
  const [providerIssueReasonError, setProviderIssueReasonError] = useState<string | null>(null);
  const [providerIssueSubmittingKind, setProviderIssueSubmittingKind] = useState<ProviderIssueActionKind | null>(null);
  const [providerIssueSuccess, setProviderIssueSuccess] = useState<string | null>(null);
  const [needsToolsConfirmation, setNeedsToolsConfirmation] = useState(false);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);
    setActionError(null);
    setProviderIssueError(null);

    if (status === 'demo') {
      setData(getMockProviderCoreTaskDetailResponse(taskId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredTasklyTaskDetail'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredTasklyTaskDetail'));
      setIsLoading(false);
      return;
    }

    const result = await getProviderCoreTaskDetail(taskId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? t('notFound') : result.status === 401 || result.status === 403 ? t('loginRequired') : t('backendUnavailable'));
    setMessage(result.status === 404 ? t('providerTasklyTaskNotFound') : t('couldNotLoadTasklyTaskDetail'));
  }, [getValidAccessToken, status, taskId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const task = data?.task;

  const markDemoInterestSent = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('alreadyExpressedInterest'),
            blockedReasonCode: 'ALREADY_INTERESTED',
            canExpressInterest: false,
            primary: { label: t('interestSent'), type: 'interest_sent' },
          },
        },
      };
    });
  }, []);

  const markDemoOnTheWay = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('youAreOnTheWay'),
            blockedReasonCode: 'ON_THE_WAY_MARKED',
            canMarkOnTheWay: false,
            primary: { label: t('onTheWay'), type: 'on_the_way_marked' },
          },
        },
      };
    });
  }, []);

  const markDemoTaskStarted = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskAlreadyStarted'),
            blockedReasonCode: 'TASK_STARTED',
            canMarkOnTheWay: false,
            canStart: false,
            primary: { label: t('taskStarted'), type: 'task_started' },
          },
          statusLabel: t('taskStarted'),
        },
      };
    });
  }, []);

  const markDemoCompletionRequested = useCallback(() => {
    setData((current) => {
      if (!current) return current;

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskAlreadyWaitingApproval'),
            blockedReasonCode: 'TASK_PENDING_COMPLETION',
            canRequestCompletion: false,
            primary: { label: t('completionRequested'), type: 'await_customer_approval' },
          },
          status: 'PENDING_COMPLETION',
          statusLabel: t('completionRequested'),
        },
      };
    });
  }, []);

  const markDemoProviderIssueSubmitted = useCallback((kind: ProviderIssueActionKind) => {
    setData((current) => {
      if (!current) return current;

      const supportLabel =
        kind === 'cannot_attend'
          ? t('cannotAttendRequestSubmitted')
          : kind === 'support_request'
            ? t('supportRequestSubmitted')
            : t('reportSubmitted');
      const issueState: ProviderCoreIssueState = {
        blockedReason: t('taskUnderReview'),
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: t('tasklyWillReviewRequest'),
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-provider-support',
        latestRequestType:
          kind === 'cannot_attend'
            ? 'PROVIDER_CANNOT_ATTEND'
            : kind === 'support_request'
              ? 'PROVIDER_SUPPORT_REQUEST'
              : 'PROVIDER_REPORT_ISSUE',
        providerIssueSummary: supportLabel,
        providerSupportReviewLabel: t('supportReviewInProgress'),
        status: 'under_review',
        statusLabel: t('taskUnderReview'),
      };

      return {
        task: {
          ...current.task,
          nextActions: {
            ...current.task.nextActions,
            blockedReason: t('taskUnderReview'),
            blockedReasonCode: 'TASK_DISPUTED',
            canCancelOrReportIssue: false,
            canDisputeRejection: false,
            canMarkOnTheWay: false,
            canReportCannotAttend: false,
            canReportIssue: false,
            canRequestCompletion: false,
            canRequestProviderSupport: false,
            canStart: false,
            providerBlockedReason: t('taskUnderReview'),
            providerBlockedReasonCode: 'TASK_DISPUTED',
            primary: { label: t('taskUnderReview'), type: 'view_task' },
          },
          paymentStatusLabel: t('underSupportReview'),
          providerBlockedReason: t('taskUnderReview'),
          providerCancellationState: issueState,
          providerDisputeState: issueState,
          providerIssueState: issueState,
          providerIssueSummary: supportLabel,
          providerSupportReviewLabel: t('supportReviewInProgress'),
          providerSupportState: issueState,
          status: 'DISPUTED',
          statusLabel: t('taskUnderReview'),
        },
      };
    });
  }, []);

  const handleExpressInterest = useCallback(async (options?: { toolsConfirmed?: boolean }) => {
    setActionError(null);
    setActionMessage(null);

    if (status === 'demo') {
      markDemoInterestSent();
      setActionMessage(`${t('interestSent')}. ${t('customerWillChooseTasker')}`);
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

    setIsExpressingInterest(true);
    const result = await expressInterestInCoreTask(taskId, authToken, {
      toolsConfirmed: options?.toolsConfirmed === true,
    });
    setIsExpressingInterest(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      }
      setNeedsToolsConfirmation(false);
      setActionMessage(
        result.data.alreadyInterested
          ? t('alreadyExpressedInterest')
          : `${t('interestSent')}. ${t('customerWillChooseTasker')}`,
      );
      return;
    }

    if (result.error.code === 'TOOLS_CONFIRMATION_REQUIRED') {
      setNeedsToolsConfirmation(true);
      setActionError(t('toolsConfirmationRequired'));
      return;
    }

    if (result.error.code === 'ALREADY_INTERESTED') {
      setActionError(t('alreadyExpressedInterest'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASK_NOT_OPEN') {
      setActionError(t('taskNoLongerAvailable'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASKER_NOT_VERIFIED' || result.error.code === 'TASKER_NOT_APPROVED') {
      setActionError(t('completeVerificationToRespond'));
      return;
    }

    if (result.status === 403) {
      setActionError(t('notEligibleForTask'));
      return;
    }

    setActionError(result.error.message || t('couldNotExpressInterest'));
  }, [getValidAccessToken, loadDetail, markDemoInterestSent, status, taskId]);

  const handleMarkOnTheWay = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);

    if (status === 'demo') {
      markDemoOnTheWay();
      setActionMessage(t('youAreOnTheWay'));
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

    setIsMarkingOnTheWay(true);
    const result = await markProviderCoreTaskOnTheWay(taskId, authToken);
    setIsMarkingOnTheWay(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      }
      setActionMessage(t('youAreOnTheWay'));
      return;
    }

    if (result.error.code === 'TOO_EARLY_ON_THE_WAY') {
      setActionError(t('tooEarlyOnTheWay'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'PAYMENT_NOT_READY' || result.error.code === 'TASK_NOT_READY') {
      setActionError(t('taskNotReadyYet'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'NOT_ASSIGNED_TASKER') {
      setActionError(t('notAssignedToTask'));
      return;
    }

    if (result.error.code === 'TASKER_NOT_VERIFIED' || result.error.code === 'TASKER_NOT_APPROVED') {
      setActionError(t('completeVerificationToRespond'));
      return;
    }

    setActionError(result.error.message || t('couldNotMarkOnTheWay'));
  }, [getValidAccessToken, loadDetail, markDemoOnTheWay, status, taskId]);

  const handleStartTask = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);

    if (status === 'demo') {
      markDemoTaskStarted();
      setActionMessage(t('taskStarted'));
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

    setIsStartingTask(true);
    const result = await startProviderCoreTask(taskId, authToken);
    setIsStartingTask(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      }
      setActionMessage(t('taskStarted'));
      return;
    }

    if (result.error.code === 'TOO_EARLY_START_TASK') {
      setActionError(t('tooEarlyToStart'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'PAYMENT_NOT_READY') {
      setActionError(t('paymentNotReadyYet'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASK_STARTED') {
      setActionError(t('taskAlreadyStarted'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASK_NOT_READY' || result.error.code === 'TOO_LATE_START_TASK') {
      setActionError(t('taskNotReadyYet'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'NOT_ASSIGNED_TASKER') {
      setActionError(t('notAssignedToTask'));
      return;
    }

    if (result.error.code === 'TASKER_NOT_VERIFIED' || result.error.code === 'TASKER_NOT_APPROVED') {
      setActionError(t('completeVerificationToRespond'));
      return;
    }

    setActionError(result.error.message || t('couldNotStartTask'));
  }, [getValidAccessToken, loadDetail, markDemoTaskStarted, status, taskId]);

  const confirmStartTask = useCallback(() => {
    Alert.alert(t('startTaskPrompt'), t('startTaskReadyOnly'), [
      { style: 'cancel', text: t('cancel') },
      { onPress: handleStartTask, text: t('startTask') },
    ]);
  }, [handleStartTask]);

  const handleRequestCompletion = useCallback(async () => {
    setActionError(null);
    setActionMessage(null);

    if (status === 'demo') {
      markDemoCompletionRequested();
      setActionMessage(t('completionRequested'));
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

    setIsRequestingCompletion(true);
    const result = await requestProviderCoreTaskCompletion(taskId, authToken);
    setIsRequestingCompletion(false);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      }
      setActionMessage(
        result.data.alreadyPending ? t('taskAlreadyWaitingApproval') : t('completionRequested'),
      );
      return;
    }

    if (result.error.code === 'TASK_NOT_STARTED') {
      setActionError(t('taskNotStartedYet'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASK_PENDING_COMPLETION') {
      setActionError(t('taskAlreadyWaitingApproval'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'TASK_COMPLETED') {
      setActionError(t('taskAlreadyCompleted'));
      void loadDetail();
      return;
    }

    if (
      result.error.code === 'TASK_NOT_IN_PROGRESS' ||
      result.error.code === 'TASK_CANCELLED' ||
      result.error.code === 'TASK_DISPUTED'
    ) {
      setActionError(t('taskNotReadyYet'));
      void loadDetail();
      return;
    }

    if (result.error.code === 'NOT_ASSIGNED_TASKER') {
      setActionError(t('notAssignedToTask'));
      return;
    }

    if (result.error.code === 'TASKER_NOT_VERIFIED' || result.error.code === 'TASKER_NOT_APPROVED') {
      setActionError(t('completeVerificationToRespond'));
      return;
    }

    setActionError(result.error.message || t('couldNotRequestCompletion'));
  }, [getValidAccessToken, loadDetail, markDemoCompletionRequested, status, taskId]);

  const confirmRequestCompletion = useCallback(() => {
    Alert.alert(t('requestCustomerApprovalPrompt'), t('customerMustApproveCompletion'), [
      { style: 'cancel', text: t('cancel') },
      { onPress: handleRequestCompletion, text: t('requestCompletion') },
    ]);
  }, [handleRequestCompletion]);

  const resetProviderIssueForm = useCallback(() => {
    setProviderIssueDetails('');
    setProviderIssueError(null);
    setProviderIssueMode(null);
    setProviderIssueReason('');
    setProviderIssueReasonError(null);
  }, []);

  const submitProviderIssueAction = useCallback(async (kind: ProviderIssueActionKind) => {
    setProviderIssueError(null);
    setProviderIssueSuccess(null);
    setProviderIssueReasonError(null);

    const reason = providerIssueReason.trim();
    const details = providerIssueDetails.trim();

    if (reason.length < 3) {
      setProviderIssueReasonError(t('reasonRequired'));
      return;
    }

    if (status === 'demo') {
      markDemoProviderIssueSubmitted(kind);
      setProviderIssueSuccess(
        kind === 'cannot_attend'
          ? t('cannotAttendRequestSubmitted')
          : kind === 'support_request'
            ? t('supportRequestSubmitted')
            : t('reportSubmitted'),
      );
      resetProviderIssueForm();
      return;
    }

    if (status !== 'authenticated') {
      setProviderIssueError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProviderIssueError(t('loginRequired'));
      return;
    }

    setProviderIssueSubmittingKind(kind);
    const payload = {
      ...(details ? { details } : null),
      reason,
    };
    const result =
      kind === 'cannot_attend'
        ? await reportProviderCannotAttend(taskId, payload, authToken)
        : kind === 'support_request'
          ? await requestProviderCoreTaskSupport(taskId, payload, authToken)
          : await reportProviderCoreTaskIssue(taskId, payload, authToken);
    setProviderIssueSubmittingKind(null);

    if (result.ok) {
      if (result.data.task) {
        setData({ task: result.data.task });
      } else {
        await loadDetail();
      }
      setProviderIssueSuccess(
        result.data.message ||
          (kind === 'cannot_attend'
            ? t('cannotAttendRequestSubmitted')
            : kind === 'support_request'
              ? t('supportRequestSubmitted')
              : t('reportSubmitted')),
      );
      resetProviderIssueForm();
      return;
    }

    if (result.error.code === 'MISSING_REASON') {
      setProviderIssueReasonError(t('reasonRequired'));
      return;
    }

    if (result.error.code === 'NOT_ASSIGNED_TASKER') {
      setProviderIssueError(t('notAssignedToTask'));
      return;
    }

    if (result.error.code === 'TASKER_NOT_VERIFIED' || result.error.code === 'TASKER_NOT_APPROVED') {
      setProviderIssueError(t('completeVerificationToRespond'));
      return;
    }

    if (result.error.code === 'TASK_CANCELLED' || result.error.code === 'TASK_COMPLETED' || result.error.code === 'PROVIDER_SUPPORT_NOT_AVAILABLE') {
      setProviderIssueError(t('providerActionUnavailable'));
      void loadDetail();
      return;
    }

    setProviderIssueError(result.error.message || t('somethingWentWrong'));
  }, [
    getValidAccessToken,
    loadDetail,
    markDemoProviderIssueSubmitted,
    providerIssueDetails,
    providerIssueReason,
    resetProviderIssueForm,
    status,
    taskId,
  ]);

  const confirmProviderIssueAction = useCallback((kind: ProviderIssueActionKind) => {
    if (kind !== 'cannot_attend') {
      void submitProviderIssueAction(kind);
      return;
    }

    Alert.alert(t('confirmCannotAttend'), t('mayAffectCustomerPaymentProtected'), [
      { style: 'cancel', text: t('cancel') },
      { onPress: () => void submitProviderIssueAction(kind), style: 'destructive', text: t('submitReport') },
    ]);
  }, [submitProviderIssueAction]);

  const handleOpenChat = useCallback(() => {
    if (task?.messageThreadId) {
      router.push(`/provider/messages/${encodeURIComponent(task.messageThreadId)}` as Href);
      return;
    }

    router.push('/provider/messages' as Href);
  }, [router, task?.messageThreadId]);

  const handleOpenMaps = useCallback(async () => {
    if (!task || !canOpenMapsForTask(task)) return;
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.addressPreviewLabel.trim())}`);
  }, [task]);

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="providerCore" />
        <AppButton onPress={() => router.back()} variant="ghost">{t('back')}</AppButton>
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('loadingProviderTasklyTaskDetail')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {task ? (
        <>
          <AppCard backgroundColor={colors.white}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <StatusBadge label={t('tasklyTask')} tone="core" />
              <StatusBadge label={getProviderTaskPhaseLabel(task)} tone="core" />
              {task.hasScheduleConflict ? <StatusBadge label={t('scheduleConflict')} tone="warning" /> : null}
            </View>
            <AppText variant="screenTitle">{task.title}</AppText>
            <AppText color={colors.slate700}>{task.description}</AppText>
            <AppText color={colors.slate700}>{task.categoryLabel} - {task.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={getPaymentStatusLabel(task.paymentStatusLabel)} tone={isPaymentProtected(task.paymentStatusLabel) ? 'success' : 'neutral'} />
            <AppText variant="sectionTitle">{t('taskDetails')}</AppText>
            <Info label={t('customer')} value={formatCustomerPreviewLabel(task.customerPreviewLabel)} />
            <Info label={t('schedule')} value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            {task.hasScheduleConflict ? <AppText color={colors.warning600}>{t('scheduleConflictHelper')}</AppText> : null}
            <Info label={t('address')} value={task.addressPreviewLabel || t('addressSharedAfterSelection')} />
            {canOpenMapsForTask(task) ? (
              <AppButton onPress={handleOpenMaps} variant="outline">
                {t('openInMaps')}
              </AppButton>
            ) : null}
          </AppCard>

          <ProviderPaymentBreakdownCard task={task} />
          <ProviderStatusCard task={task} />
          <ScopeChecklistCard task={task} />
          <Images images={task.images} />
          <ProviderIssueSupportCard task={task} />
          <ProviderCancellationSupportCard task={task} />
          <Timeline items={task.timeline} />
          <ProviderActions
            actionError={actionError}
            actionMessage={actionMessage}
            isExpressingInterest={isExpressingInterest}
            isMarkingOnTheWay={isMarkingOnTheWay}
            isRequestingCompletion={isRequestingCompletion}
            isStartingTask={isStartingTask}
            needsToolsConfirmation={needsToolsConfirmation}
            onConfirmTools={() => handleExpressInterest({ toolsConfirmed: true })}
            onExpressInterest={() => handleExpressInterest()}
            onMarkOnTheWay={handleMarkOnTheWay}
            onOpenChat={handleOpenChat}
            onRequestCompletion={confirmRequestCompletion}
            onStartTask={confirmStartTask}
            task={task}
          />
          <ProviderIssueActions
            details={providerIssueDetails}
            errorMessage={providerIssueError}
            mode={providerIssueMode}
            onCancel={resetProviderIssueForm}
            onDetailsChange={setProviderIssueDetails}
            onModeChange={setProviderIssueMode}
            onReasonChange={setProviderIssueReason}
            onSubmit={confirmProviderIssueAction}
            reason={providerIssueReason}
            reasonError={providerIssueReasonError}
            submittingKind={providerIssueSubmittingKind}
            successMessage={providerIssueSuccess}
            task={task}
          />
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard backgroundColor={colors.white}>
      <StatusBadge label={label} tone="core" />
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

function ProviderPaymentBreakdownCard({ task }: { task: ProviderCoreTaskDetail }) {
  const breakdown = task.providerPaymentBreakdown;
  if (!breakdown || breakdown.source === 'unavailable') return null;

  const hasCancellationBreakdown = Boolean(
    breakdown.cancellationFeeBreakdownLabel ||
    breakdown.lateCancellationProviderShareLabel ||
    breakdown.lateCancellationPlatformShareLabel,
  );

  return (
    <AppCard accentColor={colors.success600}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatusBadge label={breakdown.isEstimate ? t('paymentEstimate') : t('paymentRecord')} tone={breakdown.isEstimate ? 'warning' : 'success'} />
        {breakdown.paymentStateLabel ? <StatusBadge label={breakdown.paymentStateLabel} tone="neutral" /> : null}
      </View>
      <AppText variant="sectionTitle">{t('paymentDetails')}</AppText>
      {breakdown.customerTotalLabel ? <Info label={t('customerPays')} value={breakdown.customerTotalLabel} /> : null}
      {breakdown.grossTaskPriceLabel ? <Info label={t('grossTaskPrice')} value={breakdown.grossTaskPriceLabel} /> : null}
      {breakdown.tasklyFeeLabel ? <Info label={t('tasklyFee')} value={breakdown.tasklyFeeLabel} /> : null}
      {breakdown.providerPayoutLabel ? <Info label={breakdown.isEstimate ? t('estimatedProviderPayout') : t('finalPayout')} value={breakdown.providerPayoutLabel} /> : null}
      {breakdown.paymentStateLabel ? <Info label={t('paymentState')} value={breakdown.paymentStateLabel} /> : null}
      {breakdown.providerPayoutHint ? <AppText color={colors.slate500}>{breakdown.providerPayoutHint}</AppText> : null}
      {hasCancellationBreakdown ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="bodyStrong">{t('cancellationDetails')}</AppText>
          {breakdown.cancellationFeeBreakdownLabel ? <Info label={t('cancellationFee')} value={breakdown.cancellationFeeBreakdownLabel} /> : null}
          {breakdown.lateCancellationProviderShareLabel ? <Info label={t('lateCancellationProviderShare')} value={breakdown.lateCancellationProviderShareLabel} /> : null}
          {breakdown.lateCancellationPlatformShareLabel ? <Info label={t('lateCancellationPlatformShare')} value={breakdown.lateCancellationPlatformShareLabel} /> : null}
        </View>
      ) : null}
    </AppCard>
  );
}

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatusBadge label={t('photoCount').replace('{count}', String(images.length))} tone="core" />
      </View>
      <AppText variant="sectionTitle">{t('images')}</AppText>
      <View style={styles.imageGrid}>
        {images.map((image) => <Image key={image.id} accessibilityLabel={image.alt} source={{ uri: image.url }} style={styles.image} />)}
      </View>
    </AppCard>
  );
}

function ScopeChecklistCard({ task }: { task: ProviderCoreTaskDetail }) {
  const checklist = task.scopeChecklist ?? [];
  if (!checklist.length) return null;

  return (
    <AppCard>
      <StatusBadge label={`${checklist.filter((item) => item.checked).length}/${checklist.length}`} tone="core" />
      <AppText variant="sectionTitle">{t('scopeChecklist')}</AppText>
      <View style={styles.scopeChecklistList}>
        {checklist.map((item, index) => (
          <View key={`${item.code || 'scope'}-${index}`} style={styles.scopeChecklistRow}>
            <View style={[styles.scopeChecklistIcon, item.checked ? styles.scopeChecklistIconChecked : null]}>
              <AppText color={item.checked ? colors.white : colors.slate500} style={styles.scopeChecklistIconText}>
                {item.checked ? t('checkedShort') : '-'}
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

function Timeline({ items }: { items: { description: string; id: string; label: string; status: string }[] }) {
  return (
    <AppCard backgroundColor={colors.white}>
      <AppText variant="sectionTitle">{t('timeline')}</AppText>
      {items.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <StatusBadge label={item.status} tone="core" />
          <AppText variant="bodyStrong">{item.label}</AppText>
          <AppText color={colors.slate700}>{item.description}</AppText>
        </View>
      ))}
    </AppCard>
  );
}

function ProviderStatusCard({ task }: { task: ProviderCoreTaskDetail }) {
  const messages = [
    task.nextActions.blockedReason,
    task.nextActions.providerBlockedReason,
    task.providerBlockedReason,
    task.supportReviewLabel,
    task.providerSupportReviewLabel,
    task.cancellationPolicySummary,
  ].filter((item): item is string => Boolean(item && item.trim().length > 0));

  if (!messages.length) return null;

  return (
    <AppCard backgroundColor={colors.white}>
      <StatusBadge label={getProviderTaskPhaseLabel(task)} tone="core" />
      <AppText variant="sectionTitle">{t('tasklyTaskStatus')}</AppText>
      {messages.map((item, index) => (
        <AppText key={`${item}-${index}`} color={index === 0 ? colors.slate700 : colors.slate500}>
          {item}
        </AppText>
      ))}
    </AppCard>
  );
}

function ProviderIssueSupportCard({ task }: { task: ProviderCoreTaskDetail }) {
  const states = [
    task.providerIssueState,
    task.providerSupportState,
    task.providerCancellationState,
    task.providerDisputeState,
  ].filter(Boolean) as ProviderCoreIssueState[];
  const relevantStates = states.filter(isRelevantProviderIssueState);

  if (!relevantStates.length) return null;

  const primaryState = relevantStates[0];

  return (
    <AppCard accentColor={getProviderIssueAccent(relevantStates)}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {relevantStates.slice(0, 3).map((state, index) => (
          <StatusBadge key={`${state.status}-${state.statusLabel}-${index}`} label={getProviderIssueStateLabel(state)} tone={getProviderIssueTone(state)} />
        ))}
      </View>
      <AppText variant="sectionTitle">{t('issueAndSupport')}</AppText>
      {task.providerSupportReviewLabel ? (
        <AppText color={colors.slate700}>{task.providerSupportReviewLabel}</AppText>
      ) : null}
      {task.providerIssueSummary ? (
        <AppText color={colors.slate700}>{task.providerIssueSummary}</AppText>
      ) : null}
      <AppText color={colors.slate700}>{getProviderIssueHelperText(primaryState)}</AppText>
      {task.providerBlockedReason && primaryState.status === 'not_available' ? (
        <AppText color={colors.slate700}>{task.providerBlockedReason}</AppText>
      ) : null}
      <AppText color={colors.slate500}>{getProviderIssueReadOnlyText(primaryState)}</AppText>
    </AppCard>
  );
}

function ProviderCancellationSupportCard({ task }: { task: ProviderCoreTaskDetail }) {
  const cancellation = task.cancellationState;
  const support = task.supportState;
  const dispute = task.disputeState;
  const refund = task.refundState;
  const shouldShow =
    isRelevantProviderCancellationState(cancellation) ||
    isRelevantProviderSupportState(support) ||
    isRelevantProviderDisputeState(dispute) ||
    isRelevantProviderRefundState(refund);

  if (!shouldShow) return null;

  return (
    <AppCard accentColor={getProviderSupportAccent(cancellation, support, dispute)}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {cancellation && isRelevantProviderCancellationState(cancellation) ? (
          <StatusBadge label={getProviderCancellationLabel(cancellation)} tone={getProviderSupportTone(cancellation, support, dispute)} />
        ) : null}
        {support && isRelevantProviderSupportState(support) ? (
          <StatusBadge label={getProviderSupportLabel(support)} tone="warning" />
        ) : null}
        {refund && isRelevantProviderRefundState(refund) ? (
          <StatusBadge label={refund.statusLabel} tone="neutral" />
        ) : null}
      </View>
      <AppText variant="sectionTitle">{t('cancellationDetails')}</AppText>
      {cancellation ? <AppText color={colors.slate700}>{cancellation.helperText}</AppText> : null}
      {task.supportReviewLabel ? <AppText color={colors.slate700}>{task.supportReviewLabel}</AppText> : null}
      {dispute && isRelevantProviderDisputeState(dispute) ? <AppText color={colors.slate700}>{dispute.helperText}</AppText> : null}
      {refund && isRelevantProviderRefundState(refund) ? <AppText color={colors.slate700}>{refund.helperText}</AppText> : null}
      <AppText color={colors.slate500}>{t('readOnlyNoAction')}</AppText>
    </AppCard>
  );
}

function ProviderActions({
  actionError,
  actionMessage,
  isExpressingInterest,
  isMarkingOnTheWay,
  isRequestingCompletion,
  isStartingTask,
  needsToolsConfirmation,
  onConfirmTools,
  onExpressInterest,
  onMarkOnTheWay,
  onOpenChat,
  onRequestCompletion,
  onStartTask,
  task,
}: {
  actionError: string | null;
  actionMessage: string | null;
  isExpressingInterest: boolean;
  isMarkingOnTheWay: boolean;
  isRequestingCompletion: boolean;
  isStartingTask: boolean;
  needsToolsConfirmation: boolean;
  onConfirmTools: () => void;
  onExpressInterest: () => void;
  onMarkOnTheWay: () => void;
  onOpenChat: () => void;
  onRequestCompletion: () => void;
  onStartTask: () => void;
  task: ProviderCoreTaskDetail;
}) {
  const primaryAction = getPrimaryProviderAction(task);
  const blockedReason = getProviderBlockedReasonText(task);

  return (
    <AppCard backgroundColor={colors.white}>
      <AppText variant="sectionTitle">{t('nextSteps')}</AppText>
      {primaryAction === 'express_interest' ? (
        <>
          <AppText color={colors.slate700}>{t('customerWillChooseTasker')}</AppText>
          <AppText color={colors.slate700}>{t('doesNotReserveTask')}</AppText>
        </>
      ) : null}
      {primaryAction === 'mark_on_the_way' ? (
        <>
          <AppText color={colors.slate700}>{t('letCustomerKnowOnTheWay')}</AppText>
          <AppText color={colors.slate700}>{t('onTheWayDoesNotStartTask')}</AppText>
        </>
      ) : null}
      {primaryAction === 'start_task' ? (
        <>
          <AppText color={colors.slate700}>{t('startTaskWorkBegun')}</AppText>
          <AppText color={colors.slate700}>{t('startTaskReadyOnly')}</AppText>
        </>
      ) : null}
      {primaryAction === 'request_completion' ? (
        <>
          <AppText color={colors.slate700}>{t('requestCompletionCustomerApproves')}</AppText>
          <AppText color={colors.slate700}>{t('customerMustApproveCompletion')}</AppText>
        </>
      ) : null}
      {primaryAction === 'open_chat' ? (
        <AppText color={colors.slate700}>{t('openChat')}</AppText>
      ) : null}

      {actionMessage ? (
        <StatusBadge label={actionMessage} tone="success" />
      ) : null}

      {actionError ? (
        <AppText color={colors.danger600}>{actionError}</AppText>
      ) : null}

      {primaryAction === 'express_interest' ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('letCustomerKnowAvailable')}</AppText>
          <AppButton loading={isExpressingInterest} onPress={onExpressInterest}>
            {isExpressingInterest ? t('expressingInterest') : t('expressInterest')}
          </AppButton>
          {needsToolsConfirmation ? (
            <AppButton loading={isExpressingInterest} onPress={onConfirmTools} variant="outline">
              {t('confirmToolsAndExpressInterest')}
            </AppButton>
          ) : null}
        </View>
      ) : primaryAction === 'open_chat' ? (
        <AppButton onPress={onOpenChat} variant="outline">
          {t('openChat')}
        </AppButton>
      ) : primaryAction === 'mark_on_the_way' ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('actionAvailableNearStart')}</AppText>
          <AppButton loading={isMarkingOnTheWay} onPress={onMarkOnTheWay}>
            {isMarkingOnTheWay ? t('markingOnTheWay') : t('markOnTheWay')}
          </AppButton>
        </View>
      ) : primaryAction === 'start_task' ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('startTaskReadyOnly')}</AppText>
          <AppButton loading={isStartingTask} onPress={onStartTask}>
            {isStartingTask ? t('startingTask') : t('startTask')}
          </AppButton>
        </View>
      ) : primaryAction === 'request_completion' ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('customerMustApproveCompletion')}</AppText>
          <AppButton loading={isRequestingCompletion} onPress={onRequestCompletion}>
            {isRequestingCompletion ? t('requestingCompletion') : t('requestCompletion')}
          </AppButton>
        </View>
      ) : (
        <View style={styles.stack}>
          <StatusBadge label={getProviderTaskPhaseLabel(task)} tone="neutral" />
          <AppText color={colors.slate700}>{blockedReason}</AppText>
        </View>
      )}
    </AppCard>
  );
}

function ProviderIssueActions({
  details,
  errorMessage,
  mode,
  onCancel,
  onDetailsChange,
  onModeChange,
  onReasonChange,
  onSubmit,
  reason,
  reasonError,
  submittingKind,
  successMessage,
  task,
}: {
  details: string;
  errorMessage: string | null;
  mode: ProviderIssueActionKind | null;
  onCancel: () => void;
  onDetailsChange: (value: string) => void;
  onModeChange: (value: ProviderIssueActionKind) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (kind: ProviderIssueActionKind) => void;
  reason: string;
  reasonError: string | null;
  submittingKind: ProviderIssueActionKind | null;
  successMessage: string | null;
  task: ProviderCoreTaskDetail;
}) {
  const canReportIssue = task.nextActions.canReportIssue;
  const canRequestSupport = task.nextActions.canRequestProviderSupport;
  const canReportCannotAttend = task.nextActions.canReportCannotAttend;
  const hasActions = canReportIssue || canRequestSupport || canReportCannotAttend;

  if (!hasActions && !successMessage && !errorMessage) return null;

  const activeMode = mode;
  const isSubmitting = Boolean(activeMode && submittingKind === activeMode);

  return (
    <AppCard accentColor={colors.warning600}>
      <StatusBadge label={t('issueAndSupport')} tone="warning" />
      <AppText variant="sectionTitle">{t('issueAndSupport')}</AppText>
      <AppText color={colors.slate700}>{task.providerIssueSummary || t('tasklyWillReviewRequest')}</AppText>
      <AppText color={colors.slate700}>{t('mayAffectCustomerPaymentProtected')}</AppText>

      {!activeMode ? (
        <View style={styles.stack}>
          {canReportIssue ? (
            <AppButton onPress={() => onModeChange('report_issue')} tone="neutral" variant="outline">
              {t('reportIssue')}
            </AppButton>
          ) : null}
          {canRequestSupport ? (
            <AppButton onPress={() => onModeChange('support_request')} tone="neutral" variant="outline">
              {t('requestSupport')}
            </AppButton>
          ) : null}
          {canReportCannotAttend ? (
            <AppButton onPress={() => onModeChange('cannot_attend')} tone="neutral" variant="outline">
              {t('cannotAttend')}
            </AppButton>
          ) : null}
        </View>
      ) : (
        <View style={styles.stack}>
          <StatusBadge label={getProviderIssueActionLabel(activeMode)} tone={activeMode === 'cannot_attend' ? 'danger' : 'warning'} />
          <FormField
            errorText={reasonError || undefined}
            helperText={t('explainWhatHappened')}
            label={t('supportReason')}
            multiline
            onChangeText={onReasonChange}
            placeholder={t('explainWhatHappened')}
            value={reason}
          />
          <FormField
            helperText={t('addDetailsOptional')}
            label={t('supportDetails')}
            multiline
            onChangeText={onDetailsChange}
            placeholder={t('addDetailsOptional')}
            value={details}
          />
          <AppText color={colors.slate700}>{t('tasklyWillReviewRequest')}</AppText>
          <AppButton loading={isSubmitting} onPress={() => onSubmit(activeMode)} tone="neutral" variant="outline">
            {isSubmitting ? t('submittingSupportRequest') : getProviderIssueSubmitLabel(activeMode)}
          </AppButton>
          <AppButton disabled={Boolean(submittingKind)} onPress={onCancel} variant="ghost">
            {t('cancel')}
          </AppButton>
        </View>
      )}

      {successMessage ? <AppText color={colors.success600}>{successMessage}</AppText> : null}
      {errorMessage ? <AppText color={colors.danger600}>{errorMessage}</AppText> : null}
    </AppCard>
  );
}

type ProviderPrimaryAction = 'express_interest' | 'mark_on_the_way' | 'none' | 'open_chat' | 'request_completion' | 'start_task';

function getPrimaryProviderAction(task: ProviderCoreTaskDetail): ProviderPrimaryAction {
  const primaryType = task.nextActions.primary?.type;

  if (primaryType === 'express_interest' && task.nextActions.canExpressInterest) return 'express_interest';
  if (primaryType === 'open_chat' && task.nextActions.canChat) return 'open_chat';
  if (primaryType === 'mark_on_the_way' && task.nextActions.canMarkOnTheWay) return 'mark_on_the_way';
  if (primaryType === 'start_task' && task.nextActions.canStart) return 'start_task';
  if (primaryType === 'request_completion' && task.nextActions.canRequestCompletion) return 'request_completion';

  if (task.nextActions.canExpressInterest) return 'express_interest';
  if (task.nextActions.canMarkOnTheWay) return 'mark_on_the_way';
  if (task.nextActions.canStart) return 'start_task';
  if (task.nextActions.canRequestCompletion) return 'request_completion';
  if (task.nextActions.canChat && task.messageThreadId) return 'open_chat';

  return 'none';
}

function getProviderIssueActionLabel(kind: ProviderIssueActionKind) {
  if (kind === 'cannot_attend') return t('cannotAttend');
  if (kind === 'support_request') return t('requestSupport');
  return t('reportIssue');
}

function getProviderIssueSubmitLabel(kind: ProviderIssueActionKind) {
  if (kind === 'support_request') return t('submitSupportRequest');
  return t('submitReport');
}

function getProviderTaskPhaseLabel(task: ProviderCoreTaskDetail) {
  const code = task.nextActions.blockedReasonCode;
  const primaryType = task.nextActions.primary?.type;
  const status = task.status.toUpperCase();

  if (code === 'ALREADY_INTERESTED' || primaryType === 'interest_sent') return t('interestSent');
  if (status === 'OPEN' && task.nextActions.canExpressInterest) return t('available');
  if (status === 'RESERVED' && code === 'PAYMENT_NOT_READY') return t('paymentPreparing');
  if (status === 'RESERVED') return t('reservedUpcoming');
  if (code === 'ON_THE_WAY_MARKED' || primaryType === 'on_the_way_marked') return t('onTheWay');
  if (status === 'IN_PROGRESS') return t('inProgress');
  if (status === 'PENDING_COMPLETION' || code === 'TASK_PENDING_COMPLETION') return t('waitingForCustomerApproval');
  if (status === 'COMPLETED' || code === 'TASK_COMPLETED') return t('completed');
  if (status.includes('CANCELLED') || code === 'TASK_CANCELLED') return t('cancelled');
  if (status === 'DISPUTED' || code === 'TASK_DISPUTED') return t('disputed');
  if (status === 'OPEN') return t('available');

  return task.statusLabel || t('notAvailable');
}

function getProviderBlockedReasonText(task: ProviderCoreTaskDetail) {
  switch (task.nextActions.blockedReasonCode) {
    case 'ALREADY_INTERESTED':
      return t('alreadyExpressedInterest');
    case 'NOT_ASSIGNED_TASKER':
      return t('notAssignedToTask');
    case 'ON_THE_WAY_MARKED':
      return t('youAreOnTheWay');
    case 'PAYMENT_NOT_READY':
      return t('paymentPreparing');
    case 'TASK_CANCELLED':
    case 'TASK_NOT_OPEN':
      return t('notAvailable');
    case 'TASK_COMPLETED':
      return t('taskAlreadyCompleted');
    case 'TASK_DISPUTED':
      return t('disputed');
    case 'TASK_NOT_STARTED':
      return t('taskNotStartedYet');
    case 'TASK_PENDING_COMPLETION':
      return t('taskAlreadyWaitingApproval');
    case 'TASK_STARTED':
      return t('taskAlreadyStarted');
    case 'TASK_NOT_READY':
      return t('taskNotReadyYet');
    case 'TOO_EARLY_ON_THE_WAY':
      return t('actionAvailableNearStart');
    case 'TOO_EARLY_START_TASK':
      return t('tooEarlyToStart');
    case 'TOOLS_CONFIRMATION_REQUIRED':
      return t('toolsConfirmationRequired');
    default:
      return task.nextActions.blockedReason || t('waitingForCustomer');
  }
}

function canOpenMapsForTask(task: ProviderCoreTaskDetail) {
  const label = String(task.addressPreviewLabel || '').trim();
  if (!label) return false;

  const normalized = label.toLocaleLowerCase();
  const hiddenLabels = [
    t('addressSharedAfterSelection'),
    'Address shared after selection',
    'Address not set',
  ].map((value) => value.trim().toLocaleLowerCase());

  if (hiddenLabels.includes(normalized)) return false;
  if (normalized.includes('shared after selection')) return false;
  if (normalized.includes('address not set')) return false;

  return true;
}

function getPaymentStatusLabel(label: string) {
  if (isPaymentProtected(label)) return t('paymentProtected');
  if (['Not paid yet', 'Payment pending'].includes(label)) return t('paymentPreparing');
  return label;
}

function isPaymentProtected(label: string) {
  return label === 'Payment protected' || label === t('paymentProtected');
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start) return t('noScheduleSet');
  const startLabel = new Date(start).toLocaleString();
  const endLabel = end ? new Date(end).toLocaleTimeString() : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function isRelevantProviderCancellationState(state?: CoreCancellationState) {
  return Boolean(state && ['cancelled', 'cancelled_free', 'cancelled_late', 'support_review'].includes(state.status));
}

function isRelevantProviderSupportState(state?: CoreSupportState) {
  return Boolean(state && state.status !== 'none' && state.status !== 'unknown');
}

function isRelevantProviderDisputeState(state?: CoreDisputeState) {
  return Boolean(state && state.status !== 'none' && state.status !== 'unknown');
}

function isRelevantProviderRefundState(state?: CoreRefundState) {
  return Boolean(state && state.status !== 'not_available' && state.status !== 'not_requested' && state.status !== 'unknown');
}

function getProviderCancellationLabel(state: CoreCancellationState) {
  if (state.status === 'support_review') return t('underSupportReview');
  if (state.status === 'cancelled' || state.status === 'cancelled_free' || state.status === 'cancelled_late') return t('cancelled');
  return state.statusLabel || t('backendPolicyState');
}

function getProviderSupportLabel(state: CoreSupportState) {
  if (state.status === 'under_review') return t('underSupportReview');
  if (state.status === 'support_submitted') return t('supportRequestSent');
  return state.statusLabel || t('support');
}

function getProviderSupportTone(
  cancellation?: CoreCancellationState,
  support?: CoreSupportState,
  dispute?: CoreDisputeState,
): 'core' | 'danger' | 'neutral' | 'success' | 'warning' {
  if (dispute?.status === 'under_review' || support?.status === 'under_review' || cancellation?.status === 'support_review') return 'danger';
  if (cancellation?.status === 'cancelled' || cancellation?.status === 'cancelled_free' || cancellation?.status === 'cancelled_late') return 'neutral';
  return 'warning';
}

function getProviderSupportAccent(
  cancellation?: CoreCancellationState,
  support?: CoreSupportState,
  dispute?: CoreDisputeState,
) {
  const tone = getProviderSupportTone(cancellation, support, dispute);
  if (tone === 'danger') return colors.danger600;
  if (tone === 'warning') return colors.warning600;
  return colors.tasklyBlue600;
}

function isRelevantProviderIssueState(state: ProviderCoreIssueState) {
  return !['none', 'unknown'].includes(state.status);
}

function getProviderIssueStateLabel(state: ProviderCoreIssueState) {
  if (state.status === 'under_review') return t('taskUnderReview');
  if (state.status === 'submitted') return t('supportRequestSent');
  if (state.status === 'resolved') return state.statusLabel || t('completed');
  if (state.status === 'dispute_rejection_available') return t('customerRejectedCompletion');
  if (state.status === 'not_available') return t('providerActionUnavailable');
  return t('issueAndSupport');
}

function getProviderIssueHelperText(state: ProviderCoreIssueState) {
  if (state.status === 'under_review') return state.helperText || t('paymentProtectedReview');
  if (state.status === 'dispute_rejection_available') return t('customerRejectedCompletionHelper');
  if (state.status === 'cannot_attend_available') return t('cannotAttendLater');
  if (state.status === 'support_available') return t('providerSupportAvailableLater');
  if (state.status === 'report_available') return t('providerIssueReportingLater');
  if (state.status === 'not_available') return state.helperText || t('continueWhenTasklyUpdates');
  return state.helperText;
}

function getProviderIssueReadOnlyText(state: ProviderCoreIssueState) {
  if (state.status === 'cannot_attend_available') return t('cannotAttendLater');
  if (state.status === 'support_available') return t('providerSupportAvailableLater');
  if (state.status === 'report_available') return t('reportIssueLater');
  return t('readOnlyNoAction');
}

function getProviderIssueTone(state: ProviderCoreIssueState): 'core' | 'danger' | 'neutral' | 'success' | 'warning' {
  if (state.status === 'under_review') return 'danger';
  if (state.status === 'cannot_attend_available' || state.status === 'report_available' || state.status === 'support_available') return 'warning';
  if (state.status === 'resolved') return 'neutral';
  return 'neutral';
}

function getProviderIssueAccent(states: ProviderCoreIssueState[]) {
  if (states.some((state) => state.status === 'under_review')) return colors.danger600;
  if (states.some((state) => ['cannot_attend_available', 'report_available', 'support_available'].includes(state.status))) return colors.warning600;
  return colors.tasklyBlue600;
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  scopeChecklistIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#D7E7FA',
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
    borderColor: '#D7E7FA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  stack: { gap: spacing.sm },
  timelineItem: { gap: spacing.xs },
});
