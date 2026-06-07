import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageThreadSummary, MessageThreadsResponse } from '@/src/lib/api/domain';
import { getMessageThreads } from '@/src/lib/api/messages';
import { getMockMessageThreadsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

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
    ? allThreads.filter((thread) => thread.contextType === 'SUPPORT' || thread.id.startsWith('admin:') || thread.id.startsWith('support:'))
    : allThreads.filter((thread) => thread.contextType !== 'SUPPORT' && !thread.id.startsWith('admin:') && !thread.id.startsWith('support:'));

  return (
    <Screen contentStyle={styles.screenContent}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <AppText variant="screenTitle">{supportOnly ? t('supportMessagesTitle') : t('messages')}</AppText>
      </View>

      {isLoading ? <StateCard label="Loading" message={t('messages')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600} style={styles.stateCard}>
          <StatusBadge label={t('couldNotLoadMessages')} tone="warning" />
          <AppText color={colors.slate700}>{message}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadThreads} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {!isLoading && !message && threads.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconBox}>
              <Ionicons color={colors.tasklyBlue600} name="chatbubble-outline" size={28} />
            </View>
            <AppText style={styles.emptyTitle} variant="cardTitle">
              {supportOnly ? t('noSupportMessagesYet') : t('noMessagesYet')}
            </AppText>
            <AppText color={colors.slate500} style={styles.emptyBody}>
              {supportOnly ? t('noSupportMessagesBody') : t('startTaskToBeginConversation')}
            </AppText>
          </View>
        </View>
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
    <AppCard accentColor={colors.tasklyBlue600} style={styles.stateCard}>
      <StatusBadge label={label} tone="core" />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function getSupportStatusBadge(supportStatus?: string) {
  if (supportStatus === 'RESOLVED') return { label: t('supportThreadResolved'), tone: 'neutral' as const };
  if (supportStatus === 'RESOLUTION_REQUESTED') return { label: t('supportThreadResolutionRequested'), tone: 'warning' as const };
  return null;
}

function ThreadCard({ onPress, thread }: { onPress: () => void; thread: MessageThreadSummary }) {
  const tone = thread.accent === 'pro' ? 'pro' : thread.accent === 'core' ? 'core' : 'neutral';
  const supportBadge = thread.contextType === 'SUPPORT' ? getSupportStatusBadge(thread.supportStatus) : null;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.threadPressable, pressed ? styles.pressedCard : null]}>
      <AppCard style={styles.threadCard}>
        <View style={styles.threadHeader}>
          <StatusBadge label={getContextLabel(thread.contextType)} tone={tone} />
          {thread.unreadCount ? <StatusBadge label={`${thread.unreadCount} ${t('unreadMessages')}`} tone="warning" /> : null}
          {supportBadge ? <StatusBadge label={supportBadge.label} tone={supportBadge.tone} /> : null}
          {!thread.capabilities.canSendText && !supportBadge ? <StatusBadge label={t('readOnly')} tone="neutral" /> : null}
        </View>
        <AppText style={styles.threadTitle} variant="cardTitle">{thread.title}</AppText>
        {thread.subtitle ? <AppText color={colors.slate700} style={styles.threadText}>{thread.subtitle}</AppText> : null}
        {thread.lastMessagePreview ? (
          <AppText color={colors.slate500} style={styles.threadPreview}>{`${t('lastMessage')}: ${thread.lastMessagePreview}`}</AppText>
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
  actions: { gap: spacing.md },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyIconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  emptyStateCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
    ...designTokens.shadows.card,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    color: colors.navy900,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pressedCard: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  screenContent: {
    backgroundColor: colors.slate50,
    flexGrow: 1,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + 96,
  },
  stateCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  threadCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  threadHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  threadPressable: {
    borderRadius: radius.card,
  },
  threadPreview: {
    fontSize: 13,
    lineHeight: 19,
  },
  threadText: {
    fontSize: 14,
    lineHeight: 21,
  },
  threadTitle: {
    color: colors.navy900,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
