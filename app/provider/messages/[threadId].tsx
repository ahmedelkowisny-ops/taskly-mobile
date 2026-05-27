import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { FormField, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { MessageAttachment, MessageItem, MessageThreadDetailResponse, MessageThreadMeta } from '@/src/lib/api/domain';
import { getMessageThread, sendMessage, sendMessageImage } from '@/src/lib/api/messages';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockMessageThreadResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import {
  compressSelectedImage,
  pickTasklyImages,
  requestImageLibraryPermission,
  validateSelectedImages,
} from '@/src/lib/images/imagePicker';
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
  const [isSendingImage, setIsSendingImage] = useState(false);
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

    if (!canSendTextInThread(data.thread)) {
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
              messages: appendMessageIfMissing(current.messages, result.data.message),
            }
          : current,
      );
      setDraftMessage('');
      return;
    }

    setSendError(getSendErrorMessage(result.error.code));
  }, [data, draftMessage, getValidAccessToken, status, threadId]);

  const handleSendPhoto = useCallback(async () => {
    if (!data) return;

    if (!canSendAttachmentsInThread(data.thread)) {
      setSendError(t('attachmentsUnavailableForConversation'));
      return;
    }

    setSendError(null);

    try {
      const permission = await requestImageLibraryPermission();
      if (!permission.granted) {
        setSendError(t('allowPhotoAccess'));
        return;
      }

      const pickedImages = await pickTasklyImages({ maxImages: 1 });
      if (!pickedImages.length) return;

      const validation = validateSelectedImages(pickedImages, {
        acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxImages: 1,
      });

      if (!validation.accepted.length) {
        setSendError(t('unsupportedImageType'));
        return;
      }

      const image = await compressSelectedImage(validation.accepted[0], {
        compress: 0.75,
        maxWidth: 1600,
      });

      if (image.status === 'error') {
        setSendError(t('couldNotProcessPhoto'));
        return;
      }

      if (status === 'demo') {
        const demoUri = image.compressedUri || image.uri;
        const demoMessage: MessageItem = {
          attachments: [
            {
              id: `demo-photo-${Date.now()}`,
              mimeType: image.mimeType || 'image/jpeg',
              size: image.compressedFileSize ?? image.fileSize,
              type: 'image',
              url: demoUri,
            },
          ],
          body: '',
          createdAt: new Date().toISOString(),
          id: `demo-image-message-${Date.now()}`,
          isMine: true,
          senderId: 'demo-user',
          senderName: t('you'),
          senderRole: 'TASKER',
        };

        setData((current) =>
          current ? { ...current, messages: appendMessageIfMissing(current.messages, demoMessage) } : current,
        );
        return;
      }

      if (status !== 'authenticated') {
        setSendError(t('loginRequired'));
        return;
      }

      setIsSendingImage(true);
      const authToken = await getValidAccessToken();

      if (!authToken) {
        setSendError(t('loginRequired'));
        setIsSendingImage(false);
        return;
      }

      const result = await sendMessageImage(threadId, image, authToken);
      setIsSendingImage(false);

      if (result.ok) {
        setData((current) =>
          current
            ? {
                ...current,
                messages: appendMessageIfMissing(current.messages, result.data.message),
              }
            : current,
        );
        return;
      }

      setSendError(getSendPhotoErrorMessage(result.error.code));
    } catch {
      setSendError(t('couldNotSendPhoto'));
      setIsSendingImage(false);
    }
  }, [data, getValidAccessToken, status, threadId]);

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
        (() => {
          const thread = getSafeThread(data.thread);
          return (
        <>
          <ThreadHeader thread={thread} />
          <Messages messages={data.messages ?? []} accent={thread.accent} />
          <MessageComposer
            draftMessage={draftMessage}
            isSendingImage={isSendingImage}
            isSending={isSending}
            onChangeDraft={setDraftMessage}
            onSend={handleSend}
            onSendPhoto={handleSendPhoto}
            sendError={sendError}
            thread={thread}
          />
        </>
          );
        })()
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
  const visual = getThreadVisual(thread);

  return (
    <AppCard accentColor={visual.accentColor}>
      <StatusBadge label={getContextLabel(thread.contextType)} tone={visual.tone} />
      <AppText variant="screenTitle">{thread.title}</AppText>
      {thread.subtitle ? <AppText color={colors.slate700}>{thread.subtitle}</AppText> : null}
    </AppCard>
  );
}

function Messages({ accent, messages }: { accent: MessageThreadMeta['accent']; messages: MessageItem[] }) {
  const mineColor = getThreadAccentColor(accent);

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
          {message.attachments?.length ? <MessageAttachments attachments={message.attachments} /> : null}
          {message.body ? (
            <AppText color={message.isMine ? colors.white : colors.navy900}>{message.body}</AppText>
          ) : null}
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
  isSendingImage,
  isSending,
  onChangeDraft,
  onSend,
  onSendPhoto,
  sendError,
  thread,
}: {
  draftMessage: string;
  isSendingImage: boolean;
  isSending: boolean;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onSendPhoto: () => void;
  sendError: string | null;
  thread: MessageThreadMeta;
}) {
  const trimmed = draftMessage.trim();
  const canSend = canSendTextInThread(thread);
  const canSendAttachments = canSendAttachmentsInThread(thread);
  const isTooLong = trimmed.length > MESSAGE_MAX_LENGTH;
  const disabled = !canSend || !trimmed || isTooLong || isSending || isSendingImage;
  const visual = getThreadVisual(thread);
  const actionTone = thread.accent === 'pro' ? 'pro' : 'core';

  return (
    <AppCard accentColor={canSend ? visual.accentColor : colors.slate500}>
      <StatusBadge label={t('textOrPhotoMessagesOnly')} tone={canSend ? visual.tone : 'neutral'} />
      {canSend ? (
        <>
          <AppText color={colors.slate700}>{t('coreTaskChatsOnly')}</AppText>
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
          {isSendingImage ? <AppText color={colors.slate700}>{t('sendingPhoto')}</AppText> : null}
          {canSendAttachments ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSending || isSendingImage}
              onPress={onSendPhoto}
              style={({ pressed }) => [
                styles.photoButton,
                { opacity: isSending || isSendingImage ? 0.55 : pressed ? 0.82 : 1 },
              ]}>
              <Ionicons color={colors.tasklyBlue700} name="image-outline" size={18} />
              <AppText color={colors.tasklyBlue700} variant="bodyStrong">
                {t('addPhoto')}
              </AppText>
            </Pressable>
          ) : (
            <AppText color={colors.slate700}>{t('attachmentsUnavailableForConversation')}</AppText>
          )}
          <AppButton disabled={disabled} loading={isSending} onPress={onSend} tone={actionTone}>
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

function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  return (
    <View style={styles.attachmentList}>
      {attachments.map((attachment) => (
        <MessageAttachmentImage attachment={attachment} key={attachment.id} />
      ))}
    </View>
  );
}

function MessageAttachmentImage({ attachment }: { attachment: MessageAttachment }) {
  const [hasError, setHasError] = useState(false);
  const uri = resolveApiMediaUrl(attachment.url);

  if (hasError || !uri) {
    return (
      <View style={styles.imageFallback}>
        <AppText color={colors.slate700} variant="small">
          {t('imageCouldNotLoad')}
        </AppText>
      </View>
    );
  }

  return <Image onError={() => setHasError(true)} source={{ uri }} style={styles.attachmentImage} />;
}

function getContextLabel(contextType: MessageThreadMeta['contextType']) {
  if (contextType === 'CORE_TASK') return t('coreTask');
  if (contextType === 'PRO_REQUEST') return t('proRequest');
  if (contextType === 'SUPPORT') return t('support');
  return t('conversation');
}

function getSafeThread(thread?: MessageThreadMeta | null): MessageThreadMeta {
  const contextType = isMessageContextType(thread?.contextType) ? thread.contextType : 'OTHER';
  const accent = isMessageAccent(thread?.accent) ? thread.accent : getFallbackAccent(contextType);

  return {
    accent,
    capabilities: {
      canRead: Boolean(thread?.capabilities?.canRead),
      canSendAttachments: Boolean(thread?.capabilities?.canSendAttachments),
      canSendText: Boolean(thread?.capabilities?.canSendText),
      readOnlyReason: thread?.capabilities?.readOnlyReason,
    },
    contextId: thread?.contextId,
    contextType,
    id: thread?.id || 'unknown-thread',
    subtitle: thread?.subtitle,
    title: thread?.title || t('conversation'),
  };
}

function getThreadVisual(thread: MessageThreadMeta) {
  if (thread.accent === 'pro') {
    return { accentColor: getThreadAccentColor(thread.accent), tone: 'pro' as const };
  }

  if (thread.accent === 'core') {
    return { accentColor: getThreadAccentColor(thread.accent), tone: 'core' as const };
  }

  return { accentColor: getThreadAccentColor(thread.accent), tone: 'neutral' as const };
}

function getThreadAccentColor(accent: MessageThreadMeta['accent']) {
  if (accent === 'pro') return colors.proOrange600;
  if (accent === 'core') return colors.tasklyBlue600;
  return colors.navy900;
}

function getFallbackAccent(contextType: MessageThreadMeta['contextType']): MessageThreadMeta['accent'] {
  if (contextType === 'PRO_REQUEST') return 'pro';
  if (contextType === 'CORE_TASK') return 'core';
  return 'neutral';
}

function isMessageAccent(value: unknown): value is MessageThreadMeta['accent'] {
  return value === 'core' || value === 'neutral' || value === 'pro';
}

function isMessageContextType(value: unknown): value is MessageThreadMeta['contextType'] {
  return value === 'CORE_TASK' || value === 'OTHER' || value === 'PRO_REQUEST' || value === 'SUPPORT';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function canSendTextInThread(thread: MessageThreadMeta) {
  return thread.capabilities.canSendText;
}

function canSendAttachmentsInThread(thread: MessageThreadMeta) {
  return thread.capabilities.canSendText && thread.capabilities.canSendAttachments && thread.contextType === 'CORE_TASK';
}

function getSendErrorMessage(code: string) {
  if (code === 'EMPTY_MESSAGE') return t('messageCannotBeEmpty');
  if (code === 'MESSAGE_TOO_LONG') return t('messageTooLong');
  if (code === 'SENDING_NOT_SUPPORTED') return t('sendingNotAvailable');
  return t('couldNotSendMessage');
}

function getSendPhotoErrorMessage(code: string) {
  if (code === 'IMAGE_TOO_LARGE') return t('couldNotSendPhoto');
  if (code === 'UNSUPPORTED_IMAGE_TYPE') return t('unsupportedImageType');
  if (code === 'SENDING_NOT_SUPPORTED') return t('attachmentsUnavailableForConversation');
  return t('couldNotSendPhoto');
}

function appendMessageIfMissing(messages: MessageItem[], nextMessage: MessageItem) {
  return messages.some((message) => message.id === nextMessage.id) ? messages : [...messages, nextMessage];
}

function getReadOnlyReason(thread: MessageThreadMeta) {
  if (thread.capabilities.readOnlyReason === 'SUPPORT_READ_ONLY') return t('mobileConversationReadOnly');
  if (thread.capabilities.readOnlyReason === 'PRO_CHAT_NOT_AVAILABLE') return t('proChatConnectedLater');
  if (thread.capabilities.readOnlyReason === 'UNSUPPORTED_THREAD_TYPE') return t('unsupportedConversationType');
  return t('sendingNotAvailable');
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  attachmentImage: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.slate100,
    borderRadius: 10,
    width: 220,
  },
  attachmentList: { gap: spacing.sm },
  header: { gap: spacing.sm },
  imageFallback: {
    alignItems: 'center',
    aspectRatio: 4 / 3,
    backgroundColor: colors.slate100,
    borderRadius: 10,
    justifyContent: 'center',
    padding: spacing.md,
    width: 220,
  },
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
  photoButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.tasklyBlue600,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
