import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  hasApprovedProMode,
  hasCoreTaskerMode,
} from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';
import { TasklyLogoText } from './TasklyLogoText';

type ProviderDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

type DrawerItem = {
  action?: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: (pathname: string, supportMessagesActive: boolean) => boolean;
  label: string;
  route?: Href;
  tone?: 'taskly' | 'pro';
};

type DrawerGroup = {
  items: DrawerItem[];
  label: string;
};

export function ProviderDrawer({ onClose, visible }: ProviderDrawerProps) {
  useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ context?: string }>();
  const { logout, session, status } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(width * 0.74, 286);
  const panelTopInset = Math.max(insets.top + spacing.md, spacing.xl);
  const panelBottomInset = Math.max(insets.bottom + spacing.lg, spacing.xxl);
  const drawerBottomPadding = spacing.lg;
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const supportMessagesActive = pathname === '/provider/messages' && params.context === 'support';
  const showCoreTasker = status === 'demo' || hasCoreTaskerMode(session);
  const showApprovedPro = status === 'demo' || hasApprovedProMode(session);
  const showProUpsell = showCoreTasker && !showApprovedPro;
  const proRoute: Href = (showApprovedPro
    ? '/provider/pro-requests'
    : '/provider/pro-upsell') as Href;

  useEffect(() => {
    if (!visible) {
      translateX.setValue(-drawerWidth);
      return;
    }

    translateX.setValue(-drawerWidth);
    Animated.timing(translateX, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, translateX, visible]);

  const drawerGroups: DrawerGroup[] = [
    {
      label: t('drawerGroupMain'),
      items: [
        {
          icon: 'grid-outline',
          isActive: (current) => current === '/provider/dashboard' || current === '/provider',
          label: t('drawerMyDashboard'),
          route: '/provider/dashboard' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupMyWork'),
      items: [
        {
          icon: 'briefcase-outline',
          isActive: (current) => current === '/provider/active-tasks',
          label: t('drawerActiveTasks'),
          route: '/provider/active-tasks' as Href,
        },
        ...(showCoreTasker
          ? [
              {
                icon: 'search-outline' as keyof typeof Ionicons.glyphMap,
                isActive: (current: string) => current.startsWith('/provider/core-tasks'),
                label: t('drawerCheckTasks'),
                route: '/provider/core-tasks' as Href,
              },
            ]
          : []),
        {
          icon: 'hand-right-outline',
          isActive: (current) => current === '/provider/interests',
          label: t('drawerInterestsSent'),
          route: '/provider/interests' as Href,
        },
        {
          icon: 'time-outline',
          isActive: (current) => current === '/provider/task-history',
          label: t('drawerTaskHistory'),
          route: '/provider/task-history' as Href,
        },
        {
          icon: 'wallet-outline',
          isActive: (current) => current === '/provider/payouts',
          label: t('drawerPayouts'),
          route: '/provider/payouts' as Href,
        },
      ],
    },
    ...(showApprovedPro || showProUpsell
      ? [
          {
            label: t('drawerGroupTasklyPro'),
            items: [
              {
                icon: 'ribbon-outline' as keyof typeof Ionicons.glyphMap,
                isActive: (current: string) =>
                  current === '/provider/pro-requests' ||
                  current === '/provider/pro-upsell',
                label: showApprovedPro ? t('tasklyPro') : t('applyForTasklyPro'),
                route: proRoute,
                tone: 'pro' as const,
              },
            ],
          },
        ]
      : []),
    {
      label: t('drawerGroupCommunication'),
      items: [
        {
          icon: 'chatbubbles-outline',
          isActive: (current, isSupport) => current.startsWith('/provider/messages') && !isSupport,
          label: t('drawerMessages'),
          route: '/provider/messages' as Href,
        },
        {
          icon: 'mail-outline',
          isActive: (_current, isSupport) => isSupport,
          label: t('drawerSupportMessages'),
          route: '/provider/messages?context=support' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupAccount'),
      items: [
        {
          icon: 'person-outline',
          isActive: (current) => current === '/provider/profile',
          label: t('drawerMyProfile'),
          route: '/provider/profile' as Href,
        },
      ],
    },
    {
      label: t('drawerSettings'),
      items: [
        {
          icon: 'notifications-outline',
          isActive: (current) => current === '/provider/account',
          label: t('notifications'),
          route: '/provider/account' as Href,
        },
        {
          action: () => Linking.openSettings(),
          icon: 'settings-outline',
          isActive: () => false,
          label: t('drawerAppSettings'),
        },
      ],
    },
  ];

  const handleNavigate = (item: DrawerItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login' as Href);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onClose} style={styles.scrim} />
        <Animated.View
          style={[
            styles.animatedDrawer,
            {
              bottom: panelBottomInset,
              top: panelTopInset,
              transform: [{ translateX }],
              width: drawerWidth,
            },
          ]}>
          <SafeAreaView style={[styles.drawer, { paddingBottom: drawerBottomPadding }]}>
            <View style={styles.header}>
              <View style={styles.headerIdentity}>
                <TasklyLogoText compact iconOnly />
                <AppText color={colors.sidebarMuted} style={styles.areaLabel} variant="small">
                  {t('drawerTaskerArea')}
                </AppText>
              </View>
              <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.navy900} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false} style={styles.navScroll}>
              {drawerGroups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <AppText color={colors.sidebarMuted} style={styles.groupLabel} variant="small">
                    {group.label}
                  </AppText>
                  <View style={styles.groupItems}>
                    {group.items.map((item) => (
                      <DrawerNavItem
                        active={item.isActive(pathname, supportMessagesActive)}
                        icon={item.icon}
                        key={`${group.label}-${item.label}`}
                        label={item.label}
                        onPress={() => handleNavigate(item)}
                        tone={item.tone}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable accessibilityRole="button" onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null]}>
                <View style={styles.logoutIcon}>
                  <Ionicons color={colors.slate500} name="log-out-outline" size={18} />
                </View>
                <AppText color={colors.slate500} style={styles.logoutLabel} variant="bodyStrong">
                  {t('drawerLogout')}
                </AppText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerNavItem({
  active,
  icon,
  label,
  onPress,
  tone = 'taskly',
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'taskly' | 'pro';
}) {
  const isPro = tone === 'pro';
  const accent = isPro ? colors.proOrange500 : colors.tasklyBlue600;
  const iconColor = active ? (isPro ? colors.proOrangeText : colors.tasklyBlue700) : colors.sidebarMuted;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active ? styles.itemActive : null,
        pressed && !active ? styles.itemPressed : null,
      ]}>
      {active ? <View style={[styles.activeBar, { backgroundColor: accent }]} /> : null}
      <View style={[styles.itemIcon, isPro ? styles.itemIconAccent : active ? styles.itemIconActiveTaskly : null]}>
        <Ionicons color={iconColor} name={icon} size={18} />
      </View>
      <AppText color={active ? colors.navy900 : colors.sidebarMuted} style={styles.itemText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeBar: {
    borderBottomRightRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    bottom: 8,
    left: 0,
    position: 'absolute',
    top: 8,
    width: 4,
  },
  animatedDrawer: {
    borderBottomRightRadius: 28,
    borderTopRightRadius: 28,
    elevation: 12,
    left: 0,
    position: 'absolute',
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    zIndex: 1,
  },
  areaLabel: {
    letterSpacing: 0,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.sidebarBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  drawer: {
    backgroundColor: colors.tasklyBlue50,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: colors.tasklyBlueBorder,
    borderRightWidth: 1,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    flex: 1,
    gap: spacing.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  footer: {
    borderTopColor: colors.tasklyBlueBorder,
    borderTopWidth: 1,
    flexShrink: 0,
    paddingTop: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  groupItems: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 14,
    paddingHorizontal: spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  headerIdentity: {
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  itemActive: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderWidth: 1,
    elevation: 2,
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: designTokens.size.drawerIcon,
    justifyContent: 'center',
    width: designTokens.size.drawerIcon,
  },
  itemIconAccent: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F0D9B8',
  },
  itemIconActiveTaskly: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#BFDBFE',
  },
  itemPressed: {
    backgroundColor: '#EEF6FF',
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  logoutIcon: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: designTokens.size.drawerIcon,
    justifyContent: 'center',
    width: designTokens.size.drawerIcon,
  },
  logoutLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  navContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  navScroll: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(8, 12, 20, 0.18)',
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
});
