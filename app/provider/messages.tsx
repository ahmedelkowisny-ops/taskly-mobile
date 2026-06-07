import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyStateCard, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageThreadSummary, MessageThreadsResponse } from '@/src/lib/api/domain';
import { getMessageThreads } from '@/src/lib/api/messages';
import { getMockMessageThreadsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { hasApprovedProMode } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderMessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ context?: string }>();
  const { getValidAccessToken, session, status, useDemoSession } = useAuth();
  const [data, setData] = useState<MessageThreadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'pro' | 'support'>('tasks');
  const showProTab = status === 'demo' || hasApprovedProMode(session);

  useEffect(() => {
    if (params.context === 'support') {
      setActiveTab('support');
    } else if (params.context === 'pro') {
      setActiveTab('pro');
    }
  }, [params.context]);

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
  const taskThreads = allThreads.filter((th) => th.contextType === 'CORE_TASK');
  const proThreads = allThreads.filter((th) => th.contextType === 'PRO_REQUEST');
  const supportThreads = allThreads.filter((th) => th.contextType === 'SUPPORT' || th.id.startsWith('admin:') || th.id.startsWith('support:'));
  const threads =
    activeTab === 'pro' ? proThreads :
    activeTab === 'support' ? supportThreads :
    showProTab ? taskThreads : allThreads.filter((th) => th.contextType === 'CORE_TASK' || th.contextType === 'PRO_REQUEST');

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
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
        {showProTab ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab('pro')}
            style={[styles.tab, activeTab === 'pro' ? styles.tabActivePro : null]}>
            <AppText color={activeTab === 'pro' ? colors.proOrangeTextDark : colors.slate500} variant="bodyStrong">
              {t('proTab')}
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('support')}
          style={[styles.tab, activeTab === 'support' ? styles.tabActive : null]}>
          <AppText color={activeTab === 'support' ? colors.tasklyBlue700 : colors.slate500} variant="bodyStrong">
            {t('supportTab')}
          </AppText>
        </Pressable>
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('messages')} /> : null}

      {message ? (
        <AppCard backgroundColor={colors.white} style={styles.stateCard}>
          <AppText color={colors.slate700}>{message}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadThreads} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !message && threads.length === 0 ? (
        <EmptyStateCard
          accent={activeTab === 'pro' ? 'pro' : 'core'}
          body={
            activeTab === 'pro'
              ? t('noProConversationsYetBody')
              : activeTab === 'support'
              ? t('providerNoSupportMessagesBody')
              : t('providerNoTaskConversationsYetBody')
          }
          icon={
            activeTab === 'pro'
              ? 'ribbon-outline'
              : activeTab === 'support'
              ? 'shield-checkmark-outline'
              : 'chatbubble-outline'
          }
          title={
            activeTab === 'pro'
              ? t('noProConversationsYet')
              : activeTab === 'support'
              ? t('providerNoSupportMessagesYet')
              : t('providerNoTaskConversationsYet')
          }
        />
      ) : null}

      {threads.length ? (
        <View style={styles.threadList}>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onPress={() => router.push(`/provider/messages/${encodeURIComponent(thread.id)}` as Href)}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard backgroundColor={colors.white} style={styles.stateCard}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function ThreadCard({ onPress, thread }: { onPress: () => void; thread: MessageThreadSummary }) {
  const tone = thread.accent === 'pro' ? 'pro' : thread.accent === 'core' ? 'core' : 'neutral';
  const accentColor = thread.accent === 'pro' ? colors.proOrange600 : thread.accent === 'core' ? colors.tasklyBlue600 : colors.navy900;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <AppCard
        backgroundColor={colors.white}
        style={[
          styles.threadCard,
          thread.accent === 'pro' ? styles.threadCardPro : thread.accent === 'core' ? styles.threadCardCore : null,
        ]}>
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  stateCard: {
    borderColor: colors.border,
    ...designTokens.shadows.card,
  },
  tab: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  tabActivePro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  tabs: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    ...designTokens.shadows.card,
  },
  threadCard: {
    borderColor: colors.border,
    ...designTokens.shadows.card,
  },
  threadCardCore: {
    borderColor: colors.tasklyBlueBorder,
  },
  threadCardPro: {
    borderColor: colors.proOrangeBorder,
  },
  threadHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  threadList: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
