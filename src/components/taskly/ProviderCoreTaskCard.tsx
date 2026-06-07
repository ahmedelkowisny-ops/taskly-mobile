import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ProviderCoreTaskSummary } from '@/src/lib/api/domain';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppButton, AppCard, AppText, StatusBadge } from '../ui';

export type ProviderCoreTaskPrimaryAction =
  | 'express_interest'
  | 'mark_on_the_way'
  | 'none'
  | 'open_chat'
  | 'request_completion'
  | 'start_task';

type ProviderCoreTaskCardProps = {
  actionLoading?: boolean;
  compact?: boolean;
  onOpenChat?: (threadId: string) => void;
  onOpenDetail: (taskId: string) => void;
  onPrimaryAction?: (task: ProviderCoreTaskSummary, action: ProviderCoreTaskPrimaryAction) => void;
  task: ProviderCoreTaskSummary;
};

export function ProviderCoreTaskCard({
  actionLoading = false,
  compact = false,
  onOpenChat,
  onOpenDetail,
  onPrimaryAction,
  task,
}: ProviderCoreTaskCardProps) {
  const primaryAction = getProviderPrimaryAction(task);
  const blockedReason = getProviderBlockedReason(task);
  const showSupportAction = Boolean(
    task.nextActions.canReportIssue ||
      task.nextActions.canReportCannotAttend ||
      task.nextActions.canRequestProviderSupport ||
      task.nextActions.canDisputeRejection,
  );
  const canOpenChat = Boolean(task.nextActions.canChat && task.messageThreadId && onOpenChat);
  const statusChips = getUniqueStatusChips(task);

  return (
    <AppCard backgroundColor={compact ? colors.tasklyBlue50 : colors.white} style={[styles.card, compact ? styles.compactCard : undefined]}>
      <View style={styles.badges}>
        {statusChips.map((chip) => (
          <StatusBadge key={chip.label} label={chip.label} tone={chip.tone} style={chip.style} />
        ))}
      </View>

      <View style={styles.titleBlock}>
        <AppText variant={compact ? 'bodyStrong' : 'sectionTitle'}>{task.title}</AppText>
        <AppText color={colors.slate700} variant="small">
          {task.categoryLabel} / {task.cityLabel}
        </AppText>
      </View>

      <InfoRow task={task} />

      {task.providerPaymentBreakdown?.providerPayoutLabel ? (
        <View style={styles.payoutBox}>
          <AppText color={colors.tasklyBlue700} variant="bodyStrong">
            {t(task.providerPaymentBreakdown.isEstimate ? 'estimatedProviderPayout' : 'finalPayout')}: {task.providerPaymentBreakdown.providerPayoutLabel}
          </AppText>
          {task.providerPaymentBreakdown.providerPayoutHint ? (
            <AppText color={colors.slate500} variant="small">
              {task.providerPaymentBreakdown.providerPayoutHint}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {isHistoryProviderCoreTask(task) && task.aftercare ? (
        <View style={styles.payoutBox}>
          {task.aftercare.completedAt ? (
            <AppText color={colors.tasklyBlue700} variant="bodyStrong">
              {t('completedOn')}: {formatDate(task.aftercare.completedAt)}
            </AppText>
          ) : null}
          {task.aftercare.customerReview ? (
            <AppText color={colors.slate700}>
              {t('customerReview')}: {t('ratingOutOfFive').replace('{rating}', String(task.aftercare.customerReview.rating))}
            </AppText>
          ) : null}
          {task.aftercare.invoice ? (
            <AppText color={colors.slate700}>
              {t('invoice')}: {task.aftercare.invoice.invoiceNumber}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {task.edgeCase ? (
        <View style={styles.payoutBox}>
          {task.edgeCase.canceledAt ? (
            <AppText color={colors.slate700}>
              {t('cancelledOn')}: {formatDate(task.edgeCase.canceledAt)}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {blockedReason ? <AppText color={colors.slate700}>{blockedReason}</AppText> : null}
      {getProviderSupportSummary(task) ? <AppText color={colors.slate700}>{getProviderSupportSummary(task)}</AppText> : null}

      <View style={styles.actions}>
        {primaryAction !== 'none' && primaryAction !== 'open_chat' ? (
          <AppButton loading={actionLoading} onPress={() => onPrimaryAction?.(task, primaryAction)} style={styles.actionButton}>
            {getPrimaryActionLabel(primaryAction)}
          </AppButton>
        ) : null}
        {primaryAction === 'open_chat' && canOpenChat ? (
          <AppButton onPress={() => onOpenChat?.(String(task.messageThreadId))} style={styles.actionButton} variant="outline">
            {t('openConversation')}
          </AppButton>
        ) : null}
        {canOpenChat && primaryAction !== 'open_chat' ? (
          <AppButton onPress={() => onOpenChat?.(String(task.messageThreadId))} style={styles.actionButton} variant="outline">
            {t('messageCustomer')}
          </AppButton>
        ) : null}
        {showSupportAction ? (
          <AppButton onPress={() => onOpenDetail(task.id)} style={styles.actionButton} tone="neutral" variant="outline">
            {t('issueAndSupport')}
          </AppButton>
        ) : null}
        <AppButton onPress={() => onOpenDetail(task.id)} style={styles.actionButton} variant="outline">
          {getDetailActionLabel(task)}
        </AppButton>
      </View>
    </AppCard>
  );
}

function InfoRow({ task }: { task: ProviderCoreTaskSummary }) {
  const scheduleLabel = formatCompactSchedule(task.scheduledStartAt, task.scheduledEndAt);
  const parts: string[] = [];

  if (task.priceLabel) parts.push(task.priceLabel);
  if (scheduleLabel) parts.push(scheduleLabel);
  if (task.cityLabel) parts.push(task.cityLabel);

  if (!parts.length) return null;

  return (
    <View style={styles.infoRow}>
      <Ionicons color={colors.slate500} name="location-outline" size={13} />
      <AppText color={colors.slate500} variant="small" style={styles.infoText}>
        {parts.join(' · ')}
      </AppText>
    </View>
  );
}

type ChipTone = 'core' | 'danger' | 'neutral' | 'success' | 'warning';
type ChipEntry = { label: string; tone: ChipTone; style?: StyleProp<ViewStyle> };

function getUniqueStatusChips(task: ProviderCoreTaskSummary): ChipEntry[] {
  const paymentLabel = getPaymentStatusLabel(task.paymentStatusLabel);
  const isPaymentPreparingChip = paymentLabel === t('paymentPreparing');

  const chips: ChipEntry[] = [
    { label: t('tasklyTask'), tone: 'core' },
    { label: getProviderTaskPhaseLabel(task), tone: 'core' },
    {
      label: paymentLabel,
      tone: isPaymentPreparingChip ? 'warning' : (isPaymentProtected(task.paymentStatusLabel) ? 'success' : 'neutral'),
      style: isPaymentPreparingChip ? styles.paymentPreparingChip : undefined,
    },
  ];

  if (task.hasScheduleConflict) chips.push({ label: t('scheduleConflict'), tone: 'warning' });
  if (task.unreadMessagesCount > 0) {
    chips.push({ label: t('unreadMessagesCount').replace('{count}', String(task.unreadMessagesCount)), tone: 'warning' });
  }

  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.label.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getProviderPrimaryAction(task: ProviderCoreTaskSummary): ProviderCoreTaskPrimaryAction {
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

export function isAvailableProviderCoreTask(task: ProviderCoreTaskSummary) {
  return task.status.toUpperCase() === 'OPEN' || task.nextActions.canExpressInterest;
}

export function isHistoryProviderCoreTask(task: ProviderCoreTaskSummary) {
  const status = task.status.toUpperCase();
  return status === 'COMPLETED' || status.includes('CANCELLED');
}

export function isActiveProviderCoreTask(task: ProviderCoreTaskSummary) {
  if (isAvailableProviderCoreTask(task) || isHistoryProviderCoreTask(task)) return false;
  const status = task.status.toUpperCase();
  return (
    status === 'RESERVED' ||
    status === 'IN_PROGRESS' ||
    status === 'PENDING_COMPLETION' ||
    status === 'DISPUTED' ||
    task.nextActions.canChat ||
    task.nextActions.canMarkOnTheWay ||
    task.nextActions.canStart ||
    task.nextActions.canRequestCompletion
  );
}

export function getProviderTaskPhaseLabel(task: ProviderCoreTaskSummary) {
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

function getPrimaryActionLabel(action: ProviderCoreTaskPrimaryAction) {
  if (action === 'express_interest') return t('expressInterest');
  if (action === 'mark_on_the_way') return t('markOnTheWay');
  if (action === 'start_task') return t('startTask');
  if (action === 'request_completion') return t('requestCompletion');
  if (action === 'open_chat') return t('openConversation');
  return t('notAvailable');
}

function getDetailActionLabel(task: ProviderCoreTaskSummary) {
  if (isActiveProviderCoreTask(task)) return t('continueTask');
  if (isAvailableProviderCoreTask(task)) return t('checkTask');
  if (task.status.toUpperCase() === 'COMPLETED') return t('viewCompletedTask');
  return t('viewDetails');
}

function getProviderBlockedReason(task: ProviderCoreTaskSummary) {
  return task.nextActions.blockedReason || task.nextActions.providerBlockedReason || task.providerBlockedReason || null;
}

function getProviderSupportSummary(task: ProviderCoreTaskSummary) {
  if (task.providerSupportReviewLabel) return task.providerSupportReviewLabel;
  if (task.providerIssueSummary) return task.providerIssueSummary;
  if (task.supportReviewLabel) return task.supportReviewLabel;
  if (task.cancellationState?.status === 'cancelled_late' || task.cancellationState?.status === 'cancelled') {
    return task.cancellationState.estimatedPolicyOutcomeLabel || task.cancellationState.helperText;
  }
  return null;
}

function getPaymentStatusLabel(label: string) {
  if (isPaymentProtected(label)) return t('paymentProtected');
  if (['Not paid yet', 'Payment pending'].includes(label)) return t('paymentPreparing');
  return label;
}

function isPaymentProtected(label: string) {
  return label === 'Payment protected' || label === t('paymentProtected');
}

export function formatCustomerPreviewLabel(label: string) {
  return label.replace(/^customer:\s*/i, '').trim() || label;
}

function formatCompactSchedule(start: string | null, end: string | null) {
  if (!start) return null;
  try {
    const startDate = new Date(start);
    const month = startDate.toLocaleString('en-US', { month: 'short' });
    const day = startDate.getDate();
    const startHour = startDate.getHours().toString().padStart(2, '0');
    const startMin = startDate.getMinutes().toString().padStart(2, '0');
    const startTime = `${startHour}:${startMin}`;

    if (end) {
      const endDate = new Date(end);
      const endHour = endDate.getHours().toString().padStart(2, '0');
      const endMin = endDate.getMinutes().toString().padStart(2, '0');
      return `${month} ${day}, ${startTime} – ${endHour}:${endMin}`;
    }

    return `${month} ${day}, ${startTime}`;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  actionButton: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 46,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    borderColor: colors.border,
    ...designTokens.shadows.card,
  },
  compactCard: {
    borderColor: colors.tasklyBlueBorder,
    padding: spacing.md,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  paymentPreparingChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  payoutBox: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  titleBlock: {
    gap: spacing.xs,
  },
});
