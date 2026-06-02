import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyStateCard, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageThreadSummary, MessageThreadsResponse } from '@/src/lib/api/domain';
import { getMessageThreads } from '@/src/lib/api/messages';
import { getMockMessageThreadsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderMessagesScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<MessageThreadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'support'>('tasks');

  const loadThreads = useCallback(async () => {
    setMessage(null);

    if (status === 'demo') {
      setData(getMockMessageThreadsResponse());
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setMessage(t('loginRequired'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setMessage(t('loginRequired'));
      setIsLoading(false);
      return;
    }

    const result = await getMessageThreads(authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setMessage(t('couldNotLoadMessages'));
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadThreads();
    }, [loadThreads]),
  );

  const allThreads = data?.threads ?? [];
  const taskThreads = allThreads.filter((th) => th.contextType === 'CORE_TASK' || th.contextType === 'PRO_REQUEST');
  const supportThreads = allThreads.filter((th) => th.contextType === 'SUPPORT' || th.id.startsWith('admin:') || th.id.startsWith('support:'));
  const threads = activeTab === 'tasks' ? taskThreads : supportThreads;

  return (
    <Screen>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText variant="screenTitle">{t('messages')}</AppText>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('tasks')}
          style={[styles.tab, activeTab === 'tasks' ? styles.tabActive : null]}>
          <AppText color={activeTab === 'tasks' ? colors.tasklyBlue700 : colors.slate500} variant="bodyStrong">
            {t('tasksTab')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('support')}
          style={[styles.tab, activeTab === 'support' ? styles.tabActive : null]}>
          <AppText color={activeTab === 'support' ? colors.tasklyBlue700 : colors.slate500} variant="bodyStrong">
            {t('supportTab')}
          </AppText>
        </Pressable>
      </View>

      {isLoading ? <StateCard label="Loading" message={t('messages')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('couldNotLoadMessages')} tone="warning" />
          <AppText color={colors.slate700}>{message}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadThreads} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !message && threads.length === 0 ? (
        <EmptyStateCard
          body={activeTab === 'tasks' ? t('noTaskConversationsYetBody') : t('noSupportMessagesBody')}
          title={activeTab === 'tasks' ? t('noTaskConversationsYet') : t('noSupportMessagesYet')}
        />
      ) : null}

      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onPress={() => router.push(`/provider/messages/${encodeURIComponent(thread.id)}` as Href)}
        />
      ))}
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard accentColor={colors.navy900}>
      <StatusBadge label={label} tone="neutral" />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function ThreadCard({ onPress, thread }: { onPress: () => void; thread: MessageThreadSummary }) {
  const tone = thread.accent === 'pro' ? 'pro' : thread.accent === 'core' ? 'core' : 'neutral';
  const accentColor = thread.accent === 'pro' ? colors.proOrange600 : thread.accent === 'core' ? colors.tasklyBlue600 : colors.navy900;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <AppCard accentColor={accentColor}>
        <View style={styles.threadHeader}>
          <StatusBadge label={getContextLabel(thread.contextType)} tone={tone} />
          {thread.roleLabel ? <StatusBadge label={thread.roleLabel} tone="neutral" /> : null}
          {!thread.capabilities.canSendText ? <StatusBadge label={t('readOnly')} tone="neutral" /> : null}
        </View>
        <AppText variant="sectionTitle">{thread.title}</AppText>
        {thread.subtitle ? <AppText color={colors.slate700}>{thread.subtitle}</AppText> : null}
        {thread.lastMessagePreview ? (
          <AppText color={colors.slate700}>{`${t('lastMessage')}: ${thread.lastMessagePreview}`}</AppText>
        ) : null}
        <AppText color={accentColor} variant="bodyStrong">{t('openConversation')}</AppText>
      </AppCard>
    </Pressable>
  );
}

function getContextLabel(contextType: MessageThreadSummary['contextType']) {
  if (contextType === 'CORE_TASK') return t('coreTask');
  if (contextType === 'PRO_REQUEST') return t('proRequest');
  if (contextType === 'SUPPORT') return t('support');
  return t('conversation');
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  header: { gap: spacing.sm },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colors.tasklyBlue600,
  },
  tabs: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  threadHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
