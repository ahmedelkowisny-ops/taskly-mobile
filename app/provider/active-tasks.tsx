import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EmptyStateCard,
  isActiveProviderCoreTask,
  ProviderCoreTaskCard,
  ProviderCoreTaskPrimaryAction,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import {
  expressInterestInCoreTask,
  getProviderCoreTasks,
  markProviderCoreTaskOnTheWay,
  requestProviderCoreTaskCompletion,
  startProviderCoreTask,
} from '@/src/lib/api/provider';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderActiveTasksScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);

    if (status === 'demo') {
      setData(getMockProviderCoreTasksResponse());
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setErrorMessage(t('loginRequired'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setData(null);
      setErrorMessage(t('loginRequired'));
      setIsLoading(false);
      return;
    }

    const result = await getProviderCoreTasks(authToken);
    setIsLoading(false);
    if (result.ok) {
      setData(result.data);
    } else {
      setData(null);
      setErrorMessage(t('couldNotRefreshProviderDashboard'));
    }
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const activeTasks = (data?.tasks ?? []).filter(isActiveProviderCoreTask);

  const openTaskDetail = useCallback(
    (taskId: string) => router.push(`/provider/core-tasks/${taskId}` as Href),
    [router],
  );

  const openThread = useCallback(
    (threadId: string) => router.push(`/provider/messages/${encodeURIComponent(threadId)}` as Href),
    [router],
  );

  const handlePrimaryAction = useCallback(
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
      if (!authToken) { setErrorMessage(t('loginRequired')); return; }
      setActionLoadingId(task.id);
      const result =
        action === 'express_interest' ? await expressInterestInCoreTask(task.id, authToken)
        : action === 'mark_on_the_way' ? await markProviderCoreTaskOnTheWay(task.id, authToken)
        : action === 'start_task' ? await startProviderCoreTask(task.id, authToken)
        : action === 'request_completion' ? await requestProviderCoreTaskCompletion(task.id, authToken)
        : null;
      setActionLoadingId(null);
      if (!result) return;
      if (!result.ok) { setErrorMessage(result.error.message || t('providerActionUnavailable')); return; }
      await load();
    },
    [getValidAccessToken, load, openTaskDetail, openThread, status],
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('activeTasks')}</AppText>
        <AppText color={colors.slate700}>{t('activeTasksIntro')}</AppText>
      </View>

      {isLoading ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{t('activeTasks')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={load} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && activeTasks.length === 0 ? (
        <EmptyStateCard
          actionLabel={t('browseAvailableTasks')}
          body={t('noActiveTasksBody')}
          icon="briefcase-outline"
          onActionPress={() => router.push('/provider/core-tasks')}
          title={t('noActiveTasks')}
        />
      ) : null}

      {activeTasks.length ? (
        <View style={styles.taskList}>
          {activeTasks.map((task) => (
            <ProviderCoreTaskCard
              actionLoading={actionLoadingId === task.id}
              key={task.id}
              onOpenChat={openThread}
              onOpenDetail={openTaskDetail}
              onPrimaryAction={handlePrimaryAction}
              task={task}
            />
          ))}
        </View>
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
  taskList: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
