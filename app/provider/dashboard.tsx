import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EmptyStateCard,
  isActiveProviderCoreTask,
  isAvailableProviderCoreTask,
  isHistoryProviderCoreTask,
  ModeBadge,
  ProviderCoreTaskCard,
  ProviderCoreTaskPrimaryAction,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageThreadSummary, MessageThreadsResponse, ProviderCoreTaskSummary, ProviderCoreTasksResponse, ProviderDashboardResponse } from '@/src/lib/api/domain';
import { getMessageThreads } from '@/src/lib/api/messages';
import { getProviderCoreTasks, getProviderDashboard, markProviderCoreTaskOnTheWay, requestProviderCoreTaskCompletion, startProviderCoreTask, expressInterestInCoreTask } from '@/src/lib/api/provider';
import { getMockMessageThreadsResponse, getMockProviderCoreTasksResponse, getMockProviderDashboardResponse } from '@/src/lib/api/mockApi';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import { hasApprovedProMode, hasCoreTaskerMode } from '@/src/lib/auth/workspaceAccess';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderDashboardScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, session: authSession, status, useDemoSession } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const [data, setData] = useState<ProviderDashboardResponse | null>(null);
  const [coreTasksData, setCoreTasksData] = useState<ProviderCoreTasksResponse | null>(null);
  const [messagesData, setMessagesData] = useState<MessageThreadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const { coreTaskerStatus } = session.providerCapabilities;
  const summary = data?.summary;
  const displayName = summary?.displayName ?? authSession?.user.displayName ?? mockAuth.currentSession.displayName;
  const greetingName = getFriendlyName(authSession?.user ?? summary ?? mockAuth.currentSession, displayName);
  const dashboardSession = summary
    ? {
        ...session,
        providerCapabilities: {
          ...session.providerCapabilities,
          coreTaskerStatus: summary.coreTaskerStatus,
          proStatus: summary.proStatus,
        },
      }
    : session;
  const hasCoreAccess = status === 'demo' || hasCoreTaskerMode(dashboardSession);
  const hasApprovedPro = status === 'demo' || hasApprovedProMode(dashboardSession);
  const coreStatusLabel = (summary?.coreTaskerStatus ?? coreTaskerStatus) === 'approved' ? t('available') : t('providerProfileReviewing');
  const coreTasks = coreTasksData?.tasks ?? [];
  const activeTasks = coreTasks.filter(isActiveProviderCoreTask);
  const availableTasks = coreTasks.filter(isAvailableProviderCoreTask);
  const historyTasks = coreTasks.filter(isHistoryProviderCoreTask);
  const customerMessageThreads = (messagesData?.threads ?? []).filter((thread) => thread.contextType === 'CORE_TASK');

  const loadDashboard = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderDashboardResponse());
      setCoreTasksData(getMockProviderCoreTasksResponse());
      setMessagesData(getMockMessageThreadsResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setCoreTasksData(null);
      setMessagesData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setCoreTasksData(null);
      setMessagesData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const [result, coreTasksResult, messagesResult] = await Promise.all([
      getProviderDashboard(authToken),
      getProviderCoreTasks(authToken),
      getMessageThreads(authToken),
    ]);

    if (result.ok) {
      setData(result.data);
    } else {
      setData(null);
      setIsUnauthorized(result.status === 401 || result.status === 403);
      setErrorMessage(
        result.status === 401 || result.status === 403
          ? t('loginOrProviderAccessRequired')
          : t('couldNotRefreshProviderDashboard'),
      );
    }

    setCoreTasksData(coreTasksResult.ok ? coreTasksResult.data : null);
    setMessagesData(messagesResult.ok ? messagesResult.data : null);
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
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

      await loadDashboard();
    },
    [getValidAccessToken, loadDashboard, openTaskDetail, openThread, status],
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText style={styles.screenTitle} variant="screenTitle">
          {t('taskerDashboard')}
        </AppText>
        <AppText color={colors.slate700}>{t('welcomeName').replace('{{name}}', greetingName)}</AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label={t('loading')} tone="neutral" />
          <AppText variant="sectionTitle">{t('loadingProviderProDetail')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('loginOrProviderAccessRequired') : t('couldNotRefreshProviderDashboard')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDashboard} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <AppCard backgroundColor={colors.white}>
          <View style={styles.metricsGrid}>
            <Metric label={t('activeTasks')} tone="blue" value={activeTasks.length || summary.activeCoreTasksCount + summary.reservedCoreTasksCount} />
            <Metric label={t('availableTasks')} tone="blue" value={availableTasks.length || summary.availableCoreTasksCount} />
            <Metric label={t('taskHistory')} tone="slate" value={historyTasks.length} />
            <Metric label={t('customerMessages')} tone="slate" value={customerMessageThreads.length} />
          </View>
        </AppCard>
      ) : null}

      <TaskSection
        emptyBody={t('noActiveTasksBody')}
        emptyIcon="briefcase-outline"
        emptyTitle={t('noActiveTasks')}
        title={t('activeTasks')}
        tasks={activeTasks.slice(0, 2)}
        onOpenChat={openThread}
        onOpenDetail={openTaskDetail}
        onPrimaryAction={handlePrimaryTaskAction}
        actionLoadingId={actionLoadingId}
        sectionActionLabel={t('viewActiveTasks')}
        onSectionAction={() => router.push('/provider/active-tasks')}
      />

      <TaskSection
        emptyBody={t('noMatchingTasksRightNowBody')}
        emptyIcon="search-outline"
        emptyTitle={t('noMatchingTasksRightNow')}
        title={t('availableTasks')}
        tasks={availableTasks.slice(0, 2)}
        onOpenChat={openThread}
        onOpenDetail={openTaskDetail}
        onPrimaryAction={handlePrimaryTaskAction}
        actionLoadingId={actionLoadingId}
        sectionActionLabel={t('checkTasks')}
        onSectionAction={() => router.push('/provider/core-tasks')}
      />

      <TaskSection
        compact
        emptyBody={t('taskHistoryEmptyBody')}
        emptyIcon="time-outline"
        emptyTitle={t('taskHistoryEmpty')}
        title={t('taskHistory')}
        tasks={historyTasks.slice(0, 2)}
        onOpenChat={openThread}
        onOpenDetail={openTaskDetail}
        onPrimaryAction={handlePrimaryTaskAction}
        actionLoadingId={actionLoadingId}
        sectionActionLabel={t('viewHistory')}
        onSectionAction={() => router.push('/provider/task-history')}
      />

      <MessagePreviewSection
        threads={customerMessageThreads.slice(0, 2)}
        onOpenMessages={() => router.push('/provider/messages' as Href)}
        onOpenThread={openThread}
      />

      {!hasCoreAccess ? (
        <AppCard backgroundColor={colors.white}>
          <StatusBadge label={coreStatusLabel} tone="warning" />
          <AppText color={colors.slate700}>{t('providerTasklyTaskerReadiness')}</AppText>
        </AppCard>
      ) : null}

      {hasApprovedPro ? (
        <AppCard backgroundColor={colors.proOrange50}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('tasklyProProductTitle')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyProProductBody')}</AppText>
          <AppButton onPress={() => router.push('/provider/pro-requests')} tone="pro">
            {t('openProRequests')}
          </AppButton>
        </AppCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  stack: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  panel: {
    minHeight: 142,
  },
  screenTitle: {
    fontSize: 26,
  },
  section: {
    gap: spacing.md,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  metricBlue: {
    backgroundColor: colors.tasklyBlue50,
  },
  metricSlate: {
    backgroundColor: colors.slate50,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  messageCard: {
    gap: spacing.sm,
  },
  productChip: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  screen: {
    backgroundColor: '#F7F9FB',
  },
  proOutlineButton: {
    borderColor: colors.proOrangeBorder,
  },
  quickActions: {
    gap: spacing.sm,
  },
});

function Metric({ label, tone, value }: { label: string; tone: 'blue' | 'slate'; value: number }) {
  return (
    <View style={[styles.metric, tone === 'blue' ? styles.metricBlue : styles.metricSlate]}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText variant="sectionTitle">{value}</AppText>
    </View>
  );
}

function TaskSection({
  actionLoadingId,
  compact = false,
  emptyBody,
  emptyIcon,
  emptyTitle,
  onOpenChat,
  onOpenDetail,
  onPrimaryAction,
  onSectionAction,
  sectionActionLabel,
  tasks,
  title,
}: {
  actionLoadingId: string | null;
  compact?: boolean;
  emptyBody: string;
  emptyIcon: ComponentProps<typeof EmptyStateCard>['icon'];
  emptyTitle: string;
  onOpenChat: (threadId: string) => void;
  onOpenDetail: (taskId: string) => void;
  onPrimaryAction: (task: ProviderCoreTaskSummary, action: ProviderCoreTaskPrimaryAction) => void;
  onSectionAction?: () => void;
  sectionActionLabel?: string;
  tasks: ProviderCoreTaskSummary[];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle">{title}</AppText>
      {tasks.length ? (
        tasks.map((task) => (
          <ProviderCoreTaskCard
            actionLoading={actionLoadingId === task.id}
            compact={compact}
            key={task.id}
            onOpenChat={onOpenChat}
            onOpenDetail={onOpenDetail}
            onPrimaryAction={onPrimaryAction}
            task={task}
          />
        ))
      ) : (
        <EmptyStateCard body={emptyBody} clean icon={emptyIcon} title={emptyTitle} />
      )}
      {sectionActionLabel && onSectionAction ? (
        <AppButton onPress={onSectionAction} tone="neutral" variant="outline">
          {sectionActionLabel}
        </AppButton>
      ) : null}
    </View>
  );
}

function MessagePreviewSection({
  onOpenMessages,
  onOpenThread,
  threads,
}: {
  onOpenMessages: () => void;
  onOpenThread: (threadId: string) => void;
  threads: MessageThreadSummary[];
}) {
  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle">{t('customerMessages')}</AppText>
      {threads.length ? (
        threads.map((thread) => (
          <AppCard backgroundColor={colors.white} key={thread.id} style={styles.messageCard}>
            <View style={styles.badges}>
              <StatusBadge label={t('customerMessages')} tone="core" />
              {thread.unreadCount ? (
                <StatusBadge label={t('unreadMessagesCount').replace('{count}', String(thread.unreadCount))} tone="warning" />
              ) : null}
            </View>
            <AppText variant="bodyStrong">{thread.title}</AppText>
            {thread.lastMessagePreview ? <AppText color={colors.slate700}>{thread.lastMessagePreview}</AppText> : null}
            <AppButton onPress={() => onOpenThread(thread.id)} variant="outline">
              {t('openConversation')}
            </AppButton>
          </AppCard>
        ))
      ) : (
        <EmptyStateCard body={t('customerMessagesEmptyBody')} clean icon="chatbubbles-outline" title={t('customerMessagesEmpty')} />
      )}
      <AppButton onPress={onOpenMessages} tone="neutral" variant="outline">
        {t('openMessages')}
      </AppButton>
    </View>
  );
}


function getFriendlyName(source: unknown, fallback: string) {
  const record = source && typeof source === 'object' ? (source as Record<string, unknown>) : {};
  const firstName = typeof record.firstName === 'string' ? record.firstName.trim() : '';
  if (firstName) return firstName;

  const displayName = fallback.trim();
  return displayName.split(/\s+/).filter(Boolean)[0] || displayName || 'Tasker';
}
