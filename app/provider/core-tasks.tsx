import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EmptyStateCard,
  isAvailableProviderCoreTask,
  ProviderCoreTaskCard,
  ProviderCoreTaskPrimaryAction,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
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
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderCoreTasksScreen() {
  useI18n();
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
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('availableTasksScreenTitle')}</AppText>
        <AppText color={colors.slate500} style={styles.subtitle}>{t('availableTasksScreenSubtitle')}</AppText>
      </View>

      {isLoading ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText variant="sectionTitle">{t('loadingMatchingTasklyTasks')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('tasklyTasksNeedProviderAccess') : t('couldNotRefreshTasklyTasks')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.stack}>
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
        <View style={styles.taskList}>
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
          actionLabel={t('updateMyProfile')}
          body={t('noMatchingTasksRightNowBody')}
          icon="search-outline"
          onActionPress={() => router.push('/provider/profile' as Href)}
          title={t('noMatchingTasksRightNow')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + 96,
    paddingTop: spacing.lg,
  },
  header: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  stack: {
    gap: spacing.sm,
  },
  stateCard: {
    borderColor: colors.border,
    ...designTokens.shadows.card,
  },
  subtitle: {
    lineHeight: 22,
  },
  taskList: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
