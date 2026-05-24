import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageItem, MessageThreadDetailResponse, MessageThreadMeta } from '@/src/lib/api/domain';
import { getMessageThread, sendMessage } from '@/src/lib/api/messages';
import { getMockMessageThreadResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const MESSAGE_MAX_LENGTH = 2000;

export default function ProviderMessageThreadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ threadId?: string }>();
  const threadId = String(params.threadId || '');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<MessageThreadDetailResponse | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    setMessage(null);
    setSendError(null);

    if (status === 'demo') {
      setData(getMockMessageThreadResponse(threadId));
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

    const result = await getMessageThread(threadId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setMessage(t('couldNotLoadConversation'));
  }, [getValidAccessToken, status, threadId]);

  const handleSend = useCallback(async () => {
    if (!data) return;

    const body = draftMessage.trim();

    if (!canSendInThread(data.thread)) {
      setSendError(t('sendingNotAvailable'));
      return;
    }

    if (!body) {
      setSendError(t('messageCannotBeEmpty'));
      return;
    }

    if (body.length > MESSAGE_MAX_LENGTH) {
      setSendError(t('messageTooLong'));
      return;
    }

    setSendError(null);

    if (status === 'demo') {
      const demoMessage: MessageItem = {
        attachments: [],
        body,
        createdAt: new Date().toISOString(),
        id: `demo-message-${Date.now()}`,
        isMine: true,
        senderId: 'demo-user',
        senderName: t('you'),
        senderRole: 'TASKER',
      };

      setData((current) => (current ? { ...current, messages: [...current.messages, demoMessage] } : current));
      setDraftMessage('');
      return;
    }

    if (status !== 'authenticated') {
      setSendError(t('loginRequired'));
      return;
    }

    setIsSending(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setSendError(t('loginRequired'));
      setIsSending(false);
      return;
    }

    const result = await sendMessage(threadId, body, authToken);
    setIsSending(false);

    if (result.ok) {
      setData((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, result.data.message],
            }
          : current,
      );
      setDraftMessage('');
      return;
    }

    setSendError(getSendErrorMessage(result.error.code));
  }, [data, draftMessage, getValidAccessToken, status, threadId]);

  useFocusEffect(
    useCallback(() => {
      void loadThread();
    }, [loadThread]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.modeRow}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppButton onPress={() => router.back()} tone="neutral" variant="ghost">{t('backToTaskly')}</AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message={t('conversation')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('couldNotLoadConversation')} tone="warning" />
          <AppText color={colors.slate700}>{message}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadThread} variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {data ? (
        <>
          <ThreadHeader thread={data.thread} />
          <Messages messages={data.messages} accent={data.thread.accent} />
          <MessageComposer
            draftMessage={draftMessage}
            isSending={isSending}
            onChangeDraft={setDraftMessage}
            onSend={handleSend}
            sendError={sendError}
            thread={data.thread}
          />
        </>
      ) : null}
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

function ThreadHeader({ thread }: { thread: MessageThreadMeta }) {
  const tone = thread.accent === 'pro' ? 'pro' : thread.accent === 'core' ? 'core' : 'neutral';
  const accentColor = thread.accent === 'pro' ? colors.proOrange600 : thread.accent === 'core' ? colors.tasklyBlue600 : colors.navy900;

  return (
    <AppCard accentColor={accentColor}>
      <StatusBadge label={getContextLabel(thread.contextType)} tone={tone} />
      <AppText variant="screenTitle">{thread.title}</AppText>
      {thread.subtitle ? <AppText color={colors.slate700}>{thread.subtitle}</AppText> : null}
    </AppCard>
  );
}

function Messages({ accent, messages }: { accent: MessageThreadMeta['accent']; messages: MessageItem[] }) {
  const mineColor = accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;

  if (!messages.length) {
    return (
      <AppCard>
        <AppText color={colors.slate700}>{t('noMessagesYet')}</AppText>
      </AppCard>
    );
  }

  return (
    <View style={styles.messageList}>
      {messages.map((message) => (
        <View
          key={message.id}
          style={[styles.messageBubble, message.isMine ? { ...styles.myMessage, backgroundColor: mineColor } : styles.otherMessage]}>
          <AppText color={message.isMine ? colors.white : colors.slate500} variant="small">
            {message.isMine ? t('you') : message.senderName}
          </AppText>
          <AppText color={message.isMine ? colors.white : colors.navy900}>{message.body}</AppText>
          <AppText color={message.isMine ? colors.white : colors.slate500} variant="small">
            {formatDate(message.createdAt)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function MessageComposer({
  draftMessage,
  isSending,
  onChangeDraft,
  onSend,
  sendError,
  thread,
}: {
  draftMessage: string;
  isSending: boolean;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  sendError: string | null;
  thread: MessageThreadMeta;
}) {
  const trimmed = draftMessage.trim();
  const canSend = canSendInThread(thread);
  const isTooLong = trimmed.length > MESSAGE_MAX_LENGTH;
  const disabled = !canSend || !trimmed || isTooLong || isSending;
  const accentColor = thread.accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;
  const tone = thread.accent === 'pro' ? 'pro' : 'core';

  return (
    <AppCard accentColor={canSend ? accentColor : colors.slate500}>
      <StatusBadge label={t('textMessagesOnly')} tone={canSend ? tone : 'neutral'} />
      {canSend ? (
        <>
          <AppText color={colors.slate700}>{t('coreTaskChatsOnly')}</AppText>
          <AppText color={colors.slate700}>{t('attachmentsNotAvailableYet')}</AppText>
          <FormField
            errorText={isTooLong ? t('messageTooLong') : undefined}
            label={t('typeMessage')}
            multiline
            onChangeText={onChangeDraft}
            placeholder={t('typeMessage')}
            value={draftMessage}
          />
          {sendError ? <AppText color={colors.danger600}>{sendError}</AppText> : null}
          {isSending ? <AppText color={colors.slate700}>{t('sending')}</AppText> : null}
          <AppButton disabled={disabled} loading={isSending} onPress={onSend} tone={tone}>
            {isSending ? t('sending') : t('send')}
          </AppButton>
        </>
      ) : (
        <>
          <StatusBadge label={t('sendingNotAvailableShort')} tone="neutral" />
          <AppText color={colors.slate700}>{getReadOnlyReason(thread)}</AppText>
        </>
      )}
    </AppCard>
  );
}

function getContextLabel(contextType: MessageThreadMeta['contextType']) {
  if (contextType === 'CORE_TASK') return t('coreTask');
  if (contextType === 'PRO_REQUEST') return t('proRequest');
  if (contextType === 'SUPPORT') return t('support');
  return t('conversation');
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function canSendInThread(thread: MessageThreadMeta) {
  return thread.capabilities.canSendText;
}

function getSendErrorMessage(code: string) {
  if (code === 'EMPTY_MESSAGE') return t('messageCannotBeEmpty');
  if (code === 'MESSAGE_TOO_LONG') return t('messageTooLong');
  if (code === 'SENDING_NOT_SUPPORTED') return t('sendingNotAvailable');
  return t('couldNotSendMessage');
}

function getReadOnlyReason(thread: MessageThreadMeta) {
  if (thread.capabilities.readOnlyReason === 'SUPPORT_READ_ONLY') return t('mobileConversationReadOnly');
  if (thread.capabilities.readOnlyReason === 'PRO_CHAT_NOT_AVAILABLE') return t('proChatConnectedLater');
  if (thread.capabilities.readOnlyReason === 'UNSUPPORTED_THREAD_TYPE') return t('unsupportedConversationType');
  return t('sendingNotAvailable');
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  header: { gap: spacing.sm },
  messageBubble: {
    borderRadius: 14,
    gap: spacing.xs,
    maxWidth: '86%',
    padding: spacing.md,
  },
  messageList: { gap: spacing.md },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.tasklyBlue600,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderWidth: 1,
  },
});
