import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { getProviderCoreTasks } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderCoreTasksScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadTasks = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderCoreTasksResponse());
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

    const result = await getProviderCoreTasks(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? 'Login or Provider Workspace access is required.'
        : 'Could not load Core task previews.',
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
        <ModeBadge mode="providerCore" />
        <AppText variant="screenTitle">{t('coreTasks')}</AppText>
        <AppText color={colors.slate700}>
          Approved Core Taskers see matching tasks by city and category inside the Provider Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading Core task previews</AppText>
          <AppText color={colors.slate700}>Fetching read-only Core tasks from the backend.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Core tasks need Provider access' : 'Could not refresh Core tasks'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry or continue in demo mode while the backend is unavailable.'}
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
                <StatusBadge label={getProviderTaskPhaseLabel(task)} tone="core" />
                <StatusBadge label={task.paymentStatusLabel} tone={task.paymentStatusLabel === 'Payment protected' ? 'success' : 'neutral'} />
                {getProviderNextActionHint(task) ? (
                  <StatusBadge label={getProviderNextActionHint(task) || ''} tone="success" />
                ) : null}
              </View>
              <AppText variant="sectionTitle">{task.title}</AppText>
              <AppText color={colors.slate700}>
                {task.categoryLabel} - {task.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>
                {task.priceLabel} - {task.customerPreviewLabel}
              </AppText>
              <AppButton
                onPress={() => router.push(`/provider/core-tasks/${task.id}` as Href)}
                variant="outline">
                View details
              </AppButton>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          body={data.emptyState.description}
          title={data.emptyState.title}
        />
      ) : null}

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label="Core Tasker" tone="core" />
          <StatusBadge label="Stripe verification" tone="warning" />
        </View>
        <AppText color={colors.slate700}>
          Stripe verification is shown here only as a Core payout readiness placeholder, not as Pro logic.
        </AppText>
      </AppCard>
    </Screen>
  );
}

function getProviderPrimaryAction(task: ProviderCoreTaskSummary) {
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

function getProviderNextActionHint(task: ProviderCoreTaskSummary) {
  switch (getProviderPrimaryAction(task)) {
    case 'express_interest':
      return t('expressInterest');
    case 'open_chat':
      return t('openConversation');
    case 'mark_on_the_way':
      return t('markOnTheWay');
    case 'start_task':
      return t('startTask');
    case 'request_completion':
      return t('requestCompletion');
    default:
      return null;
  }
}

function getProviderTaskPhaseLabel(task: ProviderCoreTaskSummary) {
  const code = task.nextActions.blockedReasonCode;
  const primaryType = task.nextActions.primary?.type;
  const status = task.status.toUpperCase();

  if (code === 'ALREADY_INTERESTED' || primaryType === 'interest_sent') return t('interestSent');
  if (status === 'OPEN' && task.nextActions.canExpressInterest) return t('available');
  if (status === 'RESERVED') return t('upcoming');
  if (code === 'ON_THE_WAY_MARKED' || primaryType === 'on_the_way_marked') return t('onTheWay');
  if (status === 'IN_PROGRESS') return t('inProgress');
  if (status === 'PENDING_COMPLETION' || code === 'TASK_PENDING_COMPLETION') return t('waitingForCustomerApproval');
  if (status === 'COMPLETED' || code === 'TASK_COMPLETED') return t('completed');
  if (status.includes('CANCELLED') || code === 'TASK_CANCELLED') return t('cancelled');
  if (status === 'DISPUTED' || code === 'TASK_DISPUTED') return t('disputed');
  if (status === 'OPEN') return t('available');

  return task.statusLabel || t('notAvailable');
}
