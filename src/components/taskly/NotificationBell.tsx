import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

import { AppText } from '../ui';

type NotificationBellProps = {
  compact?: boolean;
};

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

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const { locale } = useI18n();
  const { getValidAccessToken, session, status } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const loadNotifications = useCallback(async () => {
    if (status === 'demo') {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

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

    setNotifications(result.data.notifications);
    setUnreadCount(result.data.unreadCount);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const openModal = useCallback(() => {
    setModalVisible(true);
    void loadNotifications();
  }, [loadNotifications]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setError(null);
  }, []);

  const applyNotificationResponse = useCallback((items: MobileNotificationItem[], count: number) => {
    setNotifications(items);
    setUnreadCount(count);
  }, []);

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

      closeModal();
      router.push(openableTarget.href);
    },
    [applyNotificationResponse, closeModal, getValidAccessToken, router, session, status],
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

  const content = useMemo(() => {
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
      return (
        <View style={styles.stateCard}>
          <Ionicons color={colors.tasklyBlue600} name="notifications-outline" size={22} />
          <AppText variant="bodyStrong">{t('noNotificationsYet')}</AppText>
          <AppText color={colors.slate700} style={styles.stateText}>
            {t('notificationEmptyHelper')}
          </AppText>
        </View>
      );
    }

    return notifications.map((notification) => {
      const timeLabel = formatNotificationTime(notification.createdAt, locale);
      return (
        <Pressable
          accessibilityRole="button"
          key={notification.id}
          onPress={() => void openNotification(notification)}
          style={({ pressed }) => [
            styles.notificationItem,
            !notification.read ? styles.notificationItemUnread : null,
            pressed ? styles.pressed : null,
          ]}>
          <View style={styles.notificationHeader}>
            <AppText style={styles.notificationTitle} variant="bodyStrong">
              {notification.title}
            </AppText>
            {!notification.read ? (
              <View style={styles.unreadChip}>
                <AppText color={colors.tasklyBlue700} style={styles.unreadChipText}>
                  {t('notificationUnread')}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText color={colors.slate700} style={styles.notificationMessage}>
            {notification.message}
          </AppText>
          {timeLabel ? (
            <AppText color={colors.slate500} style={styles.notificationTime} variant="caption">
              {timeLabel}
            </AppText>
          ) : null}
        </Pressable>
      );
    });
  }, [isLoading, locale, notifications, openNotification]);

  return (
    <>
      <Pressable
        accessibilityLabel={t('notifications')}
        accessibilityRole="button"
        onPress={openModal}
        style={({ pressed }) => [styles.bellButton, compact ? styles.bellButtonCompact : null, pressed ? styles.pressed : null]}>
        <Ionicons color={colors.navy900} name="notifications-outline" size={compact ? 19 : 20} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <AppText color={colors.white} style={styles.badgeText}>
              {unreadLabel}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <Modal animationType="fade" onRequestClose={closeModal} transparent visible={modalVisible}>
        <View style={styles.overlay}>
          <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={closeModal} style={styles.scrim} />
          <SafeAreaView style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleGroup}>
                  <AppText variant="sectionTitle">{t('notifications')}</AppText>
                  {unreadCount > 0 ? (
                    <AppText color={colors.slate500} variant="caption">
                      {unreadCount} {t('notificationUnread').toLocaleLowerCase()}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.headerActions}>
                  {unreadCount > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isMarkingAll}
                      onPress={() => void markAllRead()}
                      style={({ pressed }) => [styles.markAllButton, pressed ? styles.pressed : null]}>
                      <AppText color={colors.tasklyBlue700} style={styles.markAllText}>
                        {t('markAllAsRead')}
                      </AppText>
                    </Pressable>
                  ) : null}
                  <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={closeModal} style={styles.closeButton}>
                    <Ionicons color={colors.navy900} name="close" size={19} />
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBanner}>
                  <AppText color={colors.warning600} style={styles.errorText}>
                    {error}
                  </AppText>
                </View>
              ) : null}

              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {content}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.proOrange600,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    minWidth: 17,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 13,
  },
  bellButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  bellButtonCompact: {
    height: 38,
    width: 38,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  errorBanner: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  markAllButton: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#BFDBFE',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
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
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#BFDBFE',
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  overlay: {
    backgroundColor: 'rgba(8, 12, 20, 0.28)',
    flex: 1,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    elevation: 8,
    maxHeight: '72%',
    overflow: 'hidden',
    shadowColor: colors.navy900,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  sheetTitleGroup: {
    flex: 1,
    gap: 2,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  unreadChip: {
    backgroundColor: colors.white,
    borderColor: '#BFDBFE',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  unreadChipText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
  },
});
