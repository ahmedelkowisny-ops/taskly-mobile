import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
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

  const threads = data?.threads ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.modeRow}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText variant="screenTitle">{t('messages')}</AppText>
        <AppText color={colors.slate700}>{t('yourConversationsAppearHere')}</AppText>
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
        <EmptyStateCard body={t('yourConversationsAppearHere')} title={t('noMessagesYet')} />
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
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  threadHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
