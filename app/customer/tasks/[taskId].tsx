import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { FormField } from '@/src/components/taskly/FormField';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { approveCustomerTaskCompletion, getCustomerTaskDetail, rejectCustomerTaskCompletion } from '@/src/lib/api/customer';
import { CustomerCoreTaskNextActions, CustomerTaskDetail, CustomerTaskDetailResponse } from '@/src/lib/api/domain';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockCustomerTaskDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskId = String(params.taskId || 'demo-task');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerTaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [isApprovingCompletion, setIsApprovingCompletion] = useState(false);
  const [isRejectingCompletion, setIsRejectingCompletion] = useState(false);
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
            <StatusBadge label={getPaymentStatusLabel(task.paymentStatusLabel)} tone={isPaymentProtected(task.paymentStatusLabel) ? 'success' : 'neutral'} />
            <Info label="Price" value={task.priceLabel} />
            <Info label="Schedule" value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            <Info label="Address" value={task.addressPreviewLabel} />
            {task.taskerPreview ? <Info label="Tasker" value={`${task.taskerPreview.displayName} - ${task.taskerPreview.ratingLabel}`} /> : null}
          </AppCard>

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
  const isCompletionReview = actions.canApproveCompletion || actions.canRejectCompletion;
  const label = isCompletionReview
    ? t('waitingForCustomerApproval')
    : actions.primaryAction === 'prepare_payment'
      ? t('paymentPreparing')
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

function getPaymentStatusLabel(label: string) {
  if (isPaymentProtected(label)) return t('paymentProtected');
  if (['Not paid yet', 'Payment pending'].includes(label)) return t('paymentPreparing');
  return label;
}

function isPaymentProtected(label: string) {
  return label === 'Payment protected' || label === t('paymentProtected');
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  stack: { gap: spacing.sm },
  timelineItem: { gap: spacing.xs },
});
