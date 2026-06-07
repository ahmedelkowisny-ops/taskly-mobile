import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EmptyStateCard,
  isHistoryProviderCoreTask,
  ProviderCoreTaskCard,
  ProviderCoreTaskPrimaryAction,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import { getProviderCoreTasks } from '@/src/lib/api/provider';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderTaskHistoryScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const historyTasks = (data?.tasks ?? []).filter(isHistoryProviderCoreTask);

  const openTaskDetail = useCallback(
    (taskId: string) => router.push(`/provider/core-tasks/${taskId}` as Href),
    [router],
  );

  const openThread = useCallback(
    (threadId: string) => router.push(`/provider/messages/${encodeURIComponent(threadId)}` as Href),
    [router],
  );

  // History tasks have no active actions — open detail on tap
  const handlePrimaryAction = useCallback(
    (_task: ProviderCoreTaskSummary, _action: ProviderCoreTaskPrimaryAction) => {
      openTaskDetail(_task.id);
    },
    [openTaskDetail],
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('taskHistory')}</AppText>
        <AppText color={colors.slate500}>{t('taskHistorySubtitle')}</AppText>
      </View>

      {isLoading ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{t('taskHistory')}</AppText>
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

      {!isLoading && !errorMessage && historyTasks.length === 0 ? (
        <EmptyStateCard
          body={t('taskHistoryEmptyBody')}
          icon="time-outline"
          title={t('taskHistoryEmpty')}
        />
      ) : null}

      {historyTasks.length ? (
        <View style={styles.taskList}>
          {historyTasks.map((task) => (
            <ProviderCoreTaskCard
              compact
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
    backgroundColor: colors.white,
    borderColor: colors.border,
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
