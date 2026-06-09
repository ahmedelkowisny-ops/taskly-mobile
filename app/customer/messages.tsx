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
        {supportOnly ? <AppText color={colors.slate700}>{t('supportWorkspaceIntro')}</AppText> : null}
        {supportOnly && threads.length > 0 ? (
          <SupportWorkspaceSummary threads={threads} />
        ) : null}
        {supportOnly ? (
          <AppButton onPress={() => router.push('/customer/support' as Href)} variant="outline">
            {t('newSupportRequest')}
          </AppButton>
        ) : null}
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('messages')} /> : null}

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
            {supportOnly ? (
              <AppButton onPress={() => router.push('/customer/support' as Href)} variant="outline">
                {t('newSupportRequest')}
              </AppButton>
            ) : null}
          </View>
        </View>
      ) : null}

      {threads.map((thread) => (
        supportOnly ? (
          <SupportCaseCard
            key={thread.id}
            onNewRequest={() => router.push('/customer/support' as Href)}
            onPress={() => router.push(`/customer/messages/${encodeURIComponent(thread.id)}` as Href)}
            thread={thread}
          />
        ) : (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onPress={() => router.push(`/customer/messages/${encodeURIComponent(thread.id)}` as Href)}
          />
        )
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
  return { label: t('supportThreadOpen'), tone: 'core' as const };
}

function SupportWorkspaceSummary({ threads }: { threads: MessageThreadSummary[] }) {
  const openCount = threads.filter((thread) => thread.supportStatus !== 'RESOLVED').length;
  const resolutionCount = threads.filter((thread) => thread.supportStatus === 'RESOLUTION_REQUESTED').length;
  const evidenceCount = threads.filter((thread) => thread.hasEvidencePhoto).length;

  return (
    <View style={styles.supportSummaryGrid}>
      <SupportMetric label={t('openSupportCases')} value={String(openCount)} />
      <SupportMetric label={t('awaitingSupportConfirmation')} value={String(resolutionCount)} />
      <SupportMetric label={t('casesWithPhotos')} value={String(evidenceCount)} />
    </View>
  );
}

function SupportMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.supportMetric}>
      <AppText color={colors.tasklyBlue700} variant="cardTitle">{value}</AppText>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
    </View>
  );
}

function SupportCaseCard({
  onNewRequest,
  onPress,
  thread,
}: {
  onNewRequest: () => void;
  onPress: () => void;
  thread: MessageThreadSummary;
}) {
  const supportBadge = getSupportStatusBadge(thread.supportStatus);
  const linkedLabel = thread.linkedContext?.type === 'pro_request'
    ? t('linkedProRequest')
    : thread.linkedContext?.type === 'task'
      ? t('linkedTask')
      : null;

  return (
    <AppCard style={styles.supportCaseCard}>
      <View style={styles.threadHeader}>
        <StatusBadge label={thread.issueTypeLabel ? formatIssueType(thread.issueTypeLabel) : t('support')} tone="neutral" />
        <StatusBadge label={supportBadge.label} tone={supportBadge.tone} />
        {thread.hasEvidencePhoto ? <StatusBadge label={t('photoEvidence')} tone="neutral" /> : null}
      </View>
      <AppText style={styles.threadTitle} variant="cardTitle">{thread.title}</AppText>
      {thread.lastMessagePreview ? (
        <AppText color={colors.slate700} style={styles.threadText}>{thread.lastMessagePreview}</AppText>
      ) : null}

      <View style={styles.supportMetaGrid}>
        <MetaPill label={t('created')} value={formatDate(thread.createdAt)} />
        <MetaPill label={t('latestUpdate')} value={formatDate(thread.lastMessageAt)} />
        <MetaPill label={t('messages')} value={String(thread.messageCount ?? 1)} />
        {linkedLabel && thread.linkedContext ? (
          <MetaPill label={linkedLabel} value={thread.linkedContext.label} />
        ) : null}
      </View>

      <View style={styles.recommendationBox}>
        <Ionicons color={colors.tasklyBlue600} name="compass-outline" size={18} />
        <AppText color={colors.slate700} style={styles.recommendationText}>
          {t('nextRecommendedAction')}: {getRecommendedActionLabel(thread)}
        </AppText>
      </View>

      <View style={styles.supportActions}>
        <AppButton onPress={onPress} style={styles.supportActionButton}>
          {thread.capabilities.canSendText ? t('openAndReply') : t('openConversation')}
        </AppButton>
        <AppButton onPress={onNewRequest} style={styles.supportActionButton} variant="outline">
          {t('newSupportRequest')}
        </AppButton>
      </View>
    </AppCard>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.navy900} style={styles.metaPillValue} variant="small">{value}</AppText>
    </View>
  );
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
  if (contextType === 'CORE_TASK') return t('tasklyTask');
  if (contextType === 'PRO_REQUEST') return t('proRequest');
  if (contextType === 'SUPPORT') return t('support');
  return t('conversation');
}

function formatDate(value?: string | null) {
  if (!value) return t('notAvailable');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('notAvailable');
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function formatIssueType(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLocaleLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase());
}

function getRecommendedActionLabel(thread: MessageThreadSummary) {
  if (thread.supportStatus === 'RESOLUTION_REQUESTED') return t('confirmIfResolved');
  if (thread.supportStatus === 'RESOLVED') return t('reviewHistory');
  if (thread.capabilities.canSendText) return t('replyToSupport');
  return thread.nextRecommendedAction || t('openConversation');
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
  recommendationBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  recommendationText: {
    flex: 1,
    lineHeight: 19,
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
  metaPill: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: 2,
    minWidth: 132,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metaPillValue: {
    fontWeight: '700',
  },
  supportActionButton: {
    flex: 1,
    minWidth: 140,
  },
  supportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  supportCaseCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  supportMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  supportMetric: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 96,
    padding: spacing.md,
  },
  supportSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
