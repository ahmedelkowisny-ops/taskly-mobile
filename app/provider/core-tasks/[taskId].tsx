import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
            <StatusBadge label={task.statusLabel} tone="core" />
            <AppText variant="screenTitle">{task.title}</AppText>
            <AppText color={colors.slate700}>{task.description}</AppText>
            <AppText color={colors.slate700}>{task.categoryLabel} - {task.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={task.paymentStatusLabel} tone={task.paymentStatusLabel === 'Payment protected' ? 'success' : 'neutral'} />
            <Info label="Price" value={task.priceLabel} />
            <Info label="Customer" value={task.customerPreviewLabel} />
            <Info label="Schedule" value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            <Info label="Address" value={task.addressPreviewLabel} />
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
  onRequestCompletion: () => void;
  onStartTask: () => void;
  task: ProviderCoreTaskDetail;
}) {
  const canExpressInterest = task.nextActions.canExpressInterest;
  const canMarkOnTheWay = task.nextActions.canMarkOnTheWay;
  const canRequestCompletion = task.nextActions.canRequestCompletion;
  const canStart = task.nextActions.canStart;
  const blockedReason = task.nextActions.blockedReason;

  return (
    <AppCard accentColor={canExpressInterest || canMarkOnTheWay || canRequestCompletion || canStart ? colors.tasklyBlue600 : undefined}>
      <AppText variant="sectionTitle">Next steps</AppText>
      {canExpressInterest ? (
        <>
          <AppText color={colors.slate700}>{t('customerWillChooseTasker')}</AppText>
          <AppText color={colors.slate700}>{t('doesNotReserveTask')}</AppText>
        </>
      ) : null}
      {canMarkOnTheWay ? (
        <>
          <AppText color={colors.slate700}>{t('letCustomerKnowOnTheWay')}</AppText>
          <AppText color={colors.slate700}>{t('onTheWayDoesNotStartTask')}</AppText>
        </>
      ) : null}
      {canStart ? (
        <>
          <AppText color={colors.slate700}>{t('startTaskPrompt')}</AppText>
          <AppText color={colors.slate700}>{t('startTaskReadyOnly')}</AppText>
        </>
      ) : null}
      {canRequestCompletion ? (
        <>
          <AppText color={colors.slate700}>{t('requestCustomerApprovalPrompt')}</AppText>
          <AppText color={colors.slate700}>{t('customerMustApproveCompletion')}</AppText>
        </>
      ) : null}

      {actionMessage ? (
        <StatusBadge label={actionMessage} tone="success" />
      ) : null}

      {actionError ? (
        <AppText color={colors.danger600}>{actionError}</AppText>
      ) : null}

      {canExpressInterest ? (
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
      ) : canRequestCompletion ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('customerMustApproveCompletion')}</AppText>
          <AppButton loading={isRequestingCompletion} onPress={onRequestCompletion}>
            {isRequestingCompletion ? t('requestingCompletion') : t('requestCompletion')}
          </AppButton>
        </View>
      ) : canStart ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('startTaskReadyOnly')}</AppText>
          <AppButton loading={isStartingTask} onPress={onStartTask}>
            {isStartingTask ? t('startingTask') : t('startTask')}
          </AppButton>
        </View>
      ) : canMarkOnTheWay ? (
        <View style={styles.stack}>
          <AppText color={colors.slate700}>{t('onTheWayCloseToStart')}</AppText>
          <AppButton loading={isMarkingOnTheWay} onPress={onMarkOnTheWay}>
            {isMarkingOnTheWay ? t('markingOnTheWay') : t('markOnTheWay')}
          </AppButton>
        </View>
      ) : (
        <AppButton disabled variant="outline">
          {blockedReason || task.nextActions.primary?.label || t('alreadyExpressedInterest')}
        </AppButton>
      )}
    </AppCard>
  );
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
