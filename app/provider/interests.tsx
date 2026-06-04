import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyStateCard, isAvailableProviderCoreTask, ProviderCoreTaskCard, ProviderCoreTaskPrimaryAction, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { ProviderCoreTaskSummary, ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import { getProviderCoreTasks } from '@/src/lib/api/provider';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function isInterestSentTask(task: ProviderCoreTaskSummary) {
  return (
    task.status.toUpperCase() === 'OPEN' &&
    isAvailableProviderCoreTask(task) &&
    !task.nextActions.canExpressInterest
  );
}

export default function ProviderInterestsSentScreen() {
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

  const interestTasks = (data?.tasks ?? []).filter(isInterestSentTask);

  const openTaskDetail = useCallback(
    (taskId: string) => router.push(`/provider/core-tasks/${taskId}` as Href),
    [router],
  );

  const openThread = useCallback(
    (threadId: string) => router.push(`/provider/messages/${encodeURIComponent(threadId)}` as Href),
    [router],
  );

  const handlePrimaryAction = useCallback(
    (task: ProviderCoreTaskSummary, _action: ProviderCoreTaskPrimaryAction) => {
      openTaskDetail(task.id);
    },
    [openTaskDetail],
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('interestsSent')}</AppText>
        <AppText color={colors.slate700}>{t('interestsSentIntro')}</AppText>
      </View>

      {isLoading ? (
        <AppCard backgroundColor={colors.white}>
          <AppText color={colors.slate700}>{t('interestsSent')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard backgroundColor={colors.white}>
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={load} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !errorMessage && interestTasks.length === 0 ? (
        <EmptyStateCard
          actionLabel={t('browseAvailableTasks')}
          body={t('noInterestsSentYetBody')}
          icon="hand-right-outline"
          onActionPress={() => router.push('/provider/core-tasks' as Href)}
          title={t('noInterestsSentYet')}
        />
      ) : null}

      {interestTasks.map((task) => (
        <ProviderCoreTaskCard
          key={task.id}
          onOpenChat={openThread}
          onOpenDetail={openTaskDetail}
          onPrimaryAction={handlePrimaryAction}
          task={task}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingTop: spacing.lg },
  header: { gap: spacing.sm },
  screen: { backgroundColor: '#F7F9FB' },
  stack: { gap: spacing.sm },
});
