import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import {
  EmptyStateCard,
  isAvailableProviderCoreTask,
  ModeBadge,
  ProviderCoreTaskCard,
  ProviderCoreTaskPrimaryAction,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import {
  expressInterestInCoreTask,
  getProviderCoreTasks,
  markProviderCoreTaskOnTheWay,
  requestProviderCoreTaskCompletion,
  startProviderCoreTask,
} from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderCoreTasksScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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
        ? t('loginOrProviderAccessRequired')
        : t('couldNotRefreshTasklyTasks'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  const openTaskDetail = useCallback(
    (taskId: string) => router.push(`/provider/core-tasks/${taskId}` as Href),
    [router],
  );

  const openThread = useCallback(
    (threadId: string) => router.push(`/provider/messages/${encodeURIComponent(threadId)}` as Href),
    [router],
  );

  const handlePrimaryTaskAction = useCallback(
    async (task: ProviderCoreTaskSummary, action: ProviderCoreTaskPrimaryAction) => {
      if (action === 'open_chat' && task.messageThreadId) {
        openThread(task.messageThreadId);
        return;
      }

      if (status === 'demo') {
        openTaskDetail(task.id);
        return;
      }

      const authToken = await getValidAccessToken();
      if (!authToken) {
        setErrorMessage(t('loginRequired'));
        return;
      }

      setActionLoadingId(task.id);
      const result =
        action === 'express_interest'
          ? await expressInterestInCoreTask(task.id, authToken)
          : action === 'mark_on_the_way'
            ? await markProviderCoreTaskOnTheWay(task.id, authToken)
            : action === 'start_task'
              ? await startProviderCoreTask(task.id, authToken)
              : action === 'request_completion'
                ? await requestProviderCoreTaskCompletion(task.id, authToken)
                : null;
      setActionLoadingId(null);

      if (!result) return;
      if (!result.ok) {
        setErrorMessage(result.error.message || t('providerActionUnavailable'));
        return;
      }

      await loadTasks();
    },
    [getValidAccessToken, loadTasks, openTaskDetail, openThread, status],
  );

  const availableTasks = (data?.tasks ?? []).filter(isAvailableProviderCoreTask);

  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerCore" />
        <AppText variant="screenTitle">{t('checkTasks')}</AppText>
        <AppText color={colors.slate700}>{t('checkTasksIntro')}</AppText>
      </View>

      {isLoading ? (
        <AppCard backgroundColor={colors.white}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText variant="sectionTitle">{t('loadingMatchingTasklyTasks')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('tasklyTasksNeedProviderAccess') : t('couldNotRefreshTasklyTasks')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadTasks} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {availableTasks.length ? (
        <View style={{ gap: spacing.md }}>
          {availableTasks.map((task) => (
            <ProviderCoreTaskCard
              actionLoading={actionLoadingId === task.id}
              key={task.id}
              onOpenChat={openThread}
              onOpenDetail={openTaskDetail}
              onPrimaryAction={handlePrimaryTaskAction}
              task={task}
            />
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          body={t('noMatchingTasksRightNowBody')}
          clean
          icon="search-outline"
          title={t('noMatchingTasksRightNow')}
        />
      ) : null}
    </Screen>
  );
}
