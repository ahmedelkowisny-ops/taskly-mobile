import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/src/lib/api/notifications';
import type { MobileNotificationItem } from '@/src/lib/api/domain';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import {
  canOpenDeepLinkTarget,
  resolveDeepLinkTargetFromNotificationData,
  resolveDeepLinkTargetFromPath,
  type DeepLinkTarget,
} from '@/src/lib/navigation/deepLinks';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeNotificationTitle(title: string) {
  const lower = title.toLowerCase();
  if (lower === 'new task available') return t('notificationNewTaskAvailable');
  if (lower === 'selection expired' || lower.includes('reservation expired')) return t('notificationReservationExpired');
  return title
    .replace(/\bâ°\b/g, '')
    .trim()
    .replace(/\b[A-Z]/g, (c, i) => (i === 0 ? c : c.toLowerCase()));
}

function normalizeNotificationMessage(message: string) {
  return message.replace(/\b[a-z]+_[a-z_]+\b/g, (match) => toTitleCase(match));
}

function getNotificationContext(notification: MobileNotificationItem) {
  const entityType = notification.routeData?.entityType;
  if (entityType === 'pro_request') return { label: t('proRequest'), tone: 'pro' as const };
  if (entityType === 'core_task') return { label: t('coreTask'), tone: 'core' as const };
  if (entityType === 'message_thread') return { label: t('messages'), tone: 'neutral' as const };
  return null;
}

function formatNotificationTime(value: string, locale: 'bg' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    return new Intl.DateTimeFormat(locale === 'bg' ? 'bg-BG' : 'en-US', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function getTarget(notification: MobileNotificationItem) {
  const routeTarget = notification.routeData
    ? resolveDeepLinkTargetFromNotificationData(notification.routeData)
    : null;

  if (routeTarget) return routeTarget;
  return notification.link ? resolveDeepLinkTargetFromPath(notification.link, 'notification') : null;
}

function getAlternateMessageTarget(notification: MobileNotificationItem, currentTarget: DeepLinkTarget | null) {
  if (notification.routeData?.entityType !== 'message_thread' || !notification.routeData.entityId) return null;

  const currentWorkspace = currentTarget?.workspace ?? notification.routeData.workspace;
  const workspace = currentWorkspace === 'customer' ? 'provider' : 'customer';
  const entityId = notification.routeData.entityId;

  return {
    entityId,
    entityType: 'message_thread',
    href: `/${workspace}/messages/${encodeURIComponent(entityId)}` as Href,
    source: 'notification',
    workspace,
  } satisfies DeepLinkTarget;
}

export default function ProviderNotificationsScreen() {
  const { locale } = useI18n();
  const { getValidAccessToken, session, status } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const applyNotificationResponse = useCallback((items: MobileNotificationItem[], count: number) => {
    setNotifications(items);
    setUnreadCount(count);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (status === 'demo') {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    if (status !== 'authenticated') return;

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setNotifications([]);
      setUnreadCount(0);
      setError(t('couldNotLoadNotifications'));
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await getNotifications(authToken);
    setIsLoading(false);

    if (!result.ok) {
      setError(t('couldNotLoadNotifications'));
      return;
    }

    applyNotificationResponse(result.data.notifications, result.data.unreadCount);
  }, [applyNotificationResponse, getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const openNotification = useCallback(
    async (notification: MobileNotificationItem) => {
      const target = getTarget(notification);
      const alternateTarget = getAlternateMessageTarget(notification, target);
      const openableTarget =
        target && canOpenDeepLinkTarget({ session, status, target })
          ? target
          : alternateTarget && canOpenDeepLinkTarget({ session, status, target: alternateTarget })
            ? alternateTarget
            : null;

      const authToken = await getValidAccessToken();
      if (authToken && !notification.read) {
        const result = await markNotificationAsRead(notification.id, authToken);
        if (result.ok) {
          applyNotificationResponse(result.data.notifications, result.data.unreadCount);
        }
      }

      if (!openableTarget) {
        setError(t('couldNotOpenNotification'));
        return;
      }

      router.push(openableTarget.href);
    },
    [applyNotificationResponse, getValidAccessToken, router, session, status],
  );

  const markAllRead = useCallback(async () => {
    const authToken = await getValidAccessToken();
    if (!authToken || isMarkingAll || unreadCount === 0) return;

    setIsMarkingAll(true);
    setError(null);
    const result = await markAllNotificationsAsRead(authToken);
    setIsMarkingAll(false);

    if (!result.ok) {
      setError(t('couldNotLoadNotifications'));
      return;
    }

    applyNotificationResponse(result.data.notifications, result.data.unreadCount);
  }, [applyNotificationResponse, getValidAccessToken, isMarkingAll, unreadCount]);

  const renderContent = () => {
    if (status === 'unauthenticated') {
      return <StateCard icon="person-circle-outline" message={t('loginRequired')} title={t('pleaseLoginToContinue')} />;
    }

    if (isLoading && notifications.length === 0) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.tasklyBlue600} />
          <AppText color={colors.slate700} style={styles.stateText}>
            {t('loadingNotifications')}
          </AppText>
        </View>
      );
    }

    if (notifications.length === 0) {
      return <StateCard icon="notifications-outline" message={t('notificationEmptyHelper')} title={t('noNotificationsYet')} />;
    }

    return (
      <View style={styles.list}>
        {notifications.map((notification) => {
          const timeLabel = formatNotificationTime(notification.createdAt, locale);
          const context = getNotificationContext(notification);
          const isProNotification = notification.routeData?.entityType === 'pro_request';
          return (
            <Pressable
              accessibilityRole="button"
              key={notification.id}
              onPress={() => void openNotification(notification)}
              style={({ pressed }) => [
                styles.notificationItem,
                !notification.read ? styles.notificationItemUnread : null,
                isProNotification && !notification.read ? styles.notificationItemUnreadPro : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={styles.notificationHeader}>
                <AppText style={styles.notificationTitle} variant="bodyStrong">
                  {normalizeNotificationTitle(notification.title)}
                </AppText>
                <View style={styles.notificationBadges}>
                  {context ? <StatusBadge label={context.label} tone={context.tone} /> : null}
                  {!notification.read ? (
                    <View style={styles.unreadChip}>
                      <AppText color={isProNotification ? colors.proOrangeTextDark : colors.tasklyBlue700} style={styles.unreadChipText}>
                        {t('notificationUnread')}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
              <AppText color={colors.slate700} style={styles.notificationMessage}>
                {normalizeNotificationMessage(notification.message)}
              </AppText>
              {timeLabel ? (
                <AppText color={colors.slate500} style={styles.notificationTime} variant="caption">
                  {timeLabel}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <Screen>
      <ProviderTopBar />

      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <AppText variant="screenTitle">{t('notifications')}</AppText>
          <AppText color={colors.slate700}>{t('notificationsScreenSubtitle')}</AppText>
        </View>
        {unreadCount > 0 ? (
          <AppButton disabled={isMarkingAll} loading={isMarkingAll} onPress={() => void markAllRead()} variant="outline">
            {t('markAllAsRead')}
          </AppButton>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <AppText color={colors.warning600} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}

      {renderContent()}
    </Screen>
  );
}

function StateCard({
  icon,
  message,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  title: string;
}) {
  return (
    <View style={styles.stateCard}>
      <Ionicons color={colors.tasklyBlue600} name={icon} size={24} />
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText color={colors.slate700} style={styles.stateText}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F9CACA',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  notificationBadges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  notificationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  notificationItem: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  notificationItemUnread: {
    backgroundColor: '#F7FBFF',
    borderColor: colors.tasklyBlueBorder,
  },
  notificationItemUnreadPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    marginTop: spacing.xs,
  },
  notificationTitle: {
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  stateText: {
    textAlign: 'center',
  },
  titleGroup: {
    gap: spacing.xs,
  },
  unreadChip: {
    backgroundColor: colors.tasklyBlue50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  unreadChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
