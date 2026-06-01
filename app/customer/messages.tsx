import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, EmptyStateCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageThreadSummary, MessageThreadsResponse } from '@/src/lib/api/domain';
import { getMessageThreads } from '@/src/lib/api/messages';
import { getMockMessageThreadsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerMessagesScreen() {
  useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ context?: string }>();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<MessageThreadsResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const supportOnly = params.context === 'support';
  const allThreads = data?.threads ?? [];
  const threads = supportOnly
    ? allThreads.filter((thread) => thread.contextType === 'SUPPORT' || thread.id.startsWith('admin:'))
    : allThreads;

  return (
    <Screen>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <AppText variant="screenTitle">{supportOnly ? t('supportMessagesTitle') : t('messages')}</AppText>
        <AppText color={colors.slate700}>
          {supportOnly ? t('supportMessagesInboxHelper') : t('yourConversationsAppearHere')}
        </AppText>
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
          body={supportOnly ? t('noSupportMessagesBody') : t('yourConversationsAppearHere')}
          title={supportOnly ? t('noSupportMessagesYet') : t('noMessagesYet')}
        />
      ) : null}

      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onPress={() => router.push(`/customer/messages/${encodeURIComponent(thread.id)}` as Href)}
        />
      ))}

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <StatusBadge label={label} tone="core" />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function ThreadCard({ onPress, thread }: { onPress: () => void; thread: MessageThreadSummary }) {
  const tone = thread.accent === 'pro' ? 'pro' : thread.accent === 'core' ? 'core' : 'neutral';

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <AppCard>
        <View style={styles.threadHeader}>
          <StatusBadge label={getContextLabel(thread.contextType)} tone={tone} />
          {thread.unreadCount ? <StatusBadge label={`${thread.unreadCount} ${t('unreadMessages')}`} tone="warning" /> : null}
          {!thread.capabilities.canSendText ? <StatusBadge label={t('readOnly')} tone="neutral" /> : null}
        </View>
        <AppText variant="cardTitle">{thread.title}</AppText>
        {thread.subtitle ? <AppText color={colors.slate700}>{thread.subtitle}</AppText> : null}
        {thread.lastMessagePreview ? (
          <AppText color={colors.slate700}>{`${t('lastMessage')}: ${thread.lastMessagePreview}`}</AppText>
        ) : null}
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
  threadHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
