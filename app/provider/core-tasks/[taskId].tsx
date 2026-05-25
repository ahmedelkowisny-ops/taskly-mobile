import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTaskDetail, ProviderCoreTaskDetailResponse } from '@/src/lib/api/domain';
import { getMockProviderCoreTaskDetailResponse } from '@/src/lib/api/mockApi';
import {
  expressInterestInCoreTask,
  getProviderCoreTaskDetail,
  markProviderCoreTaskOnTheWay,
  requestProviderCoreTaskCompletion,
  startProviderCoreTask,
} from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

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
  const [needsToolsConfirmation, setNeedsToolsConfirmation] = useState(false);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);
    setActionError(null);

    if (status === 'demo') {
      setData(getMockProviderCoreTaskDetailResponse(taskId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this provider Core task detail.');
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this provider Core task detail.');
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
    setStateLabel(result.status === 404 ? 'Not found' : result.status === 401 || result.status === 403 ? 'Login required' : 'Backend unavailable');
    setMessage(result.status === 404 ? 'This task was not found or is not available to this provider account.' : 'Could not load this task detail.');
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

  const handleOpenChat = useCallback(() => {
    router.push('/provider/messages' as Href);
  }, [router]);

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="providerCore" />
        <AppButton onPress={() => router.back()} variant="ghost">Back</AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message="Loading provider Core task detail." /> : null}

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
            <StatusBadge label={getProviderTaskPhaseLabel(task)} tone="core" />
            <AppText variant="screenTitle">{task.title}</AppText>
            <AppText color={colors.slate700}>{task.description}</AppText>
            <AppText color={colors.slate700}>{task.categoryLabel} - {task.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={getPaymentStatusLabel(task.paymentStatusLabel)} tone={isPaymentProtected(task.paymentStatusLabel) ? 'success' : 'neutral'} />
            <Info label="Price" value={task.priceLabel} />
            <Info label="Customer" value={task.customerPreviewLabel} />
            <Info label="Schedule" value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            <Info label="Address" value={task.addressPreviewLabel || t('locationSharedWhenReserved')} />
          </AppCard>

          <Images images={task.images} />
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
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600}>
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

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <AppText variant="sectionTitle">Images</AppText>
      <View style={styles.imageGrid}>
        {images.map((image) => <Image key={image.id} accessibilityLabel={image.alt} source={{ uri: image.url }} style={styles.image} />)}
      </View>
    </AppCard>
  );
}

function Timeline({ items }: { items: { description: string; id: string; label: string; status: string }[] }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <AppText variant="sectionTitle">Timeline</AppText>
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
  const hasPrimaryAction = primaryAction !== 'none';

  return (
    <AppCard accentColor={hasPrimaryAction ? colors.tasklyBlue600 : undefined}>
      <AppText variant="sectionTitle">Next steps</AppText>
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
        <AppText color={colors.slate700}>{t('openConversation')}</AppText>
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
          {t('openConversation')}
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
          <AppButton disabled variant="outline">
            {task.nextActions.primary?.label || t('notAvailable')}
          </AppButton>
        </View>
      )}
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

  return 'none';
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

function getPaymentStatusLabel(label: string) {
  if (isPaymentProtected(label)) return t('paymentProtected');
  if (['Not paid yet', 'Payment pending'].includes(label)) return t('paymentPreparing');
  return label;
}

function isPaymentProtected(label: string) {
  return label === 'Payment protected' || label === t('paymentProtected');
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start) return 'Schedule not set';
  const startLabel = new Date(start).toLocaleString();
  const endLabel = end ? new Date(end).toLocaleTimeString() : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  stack: { gap: spacing.sm },
  timelineItem: { gap: spacing.xs },
});
