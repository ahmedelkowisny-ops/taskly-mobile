import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';
import { TasklyLogoText } from './TasklyLogoText';

type CustomerDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

type DrawerItem = {
  icon: keyof typeof Ionicons.glyphMap;
  isActive: (pathname: string, supportMessagesActive: boolean) => boolean;
  label: string;
  route: Href;
  tone?: 'taskly' | 'pro';
};

type DrawerGroup = {
  items: DrawerItem[];
  label: string;
};

export function CustomerDrawer({ onClose, visible }: CustomerDrawerProps) {
  useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ context?: string }>();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(width * 0.74, 286);
  const panelTopInset = Math.max(insets.top + spacing.md, spacing.xl);
  const panelBottomInset = Math.max(insets.bottom + spacing.lg, spacing.xxl);
  const drawerBottomPadding = spacing.lg;
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const supportMessagesActive = pathname === '/customer/messages' && params.context === 'support';

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
          icon: 'home-outline',
          isActive: (current) => current === '/customer/home' || current === '/customer',
          label: t('drawerHome'),
          route: '/customer/home' as Href,
        },
        {
          icon: 'grid-outline',
          isActive: (current) => current === '/customer/dashboard',
          label: t('drawerMyDashboard'),
          route: '/customer/dashboard' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupTaskly'),
      items: [
        {
          icon: 'list-outline',
          isActive: (current) => current.startsWith('/customer/tasks'),
          label: t('drawerMyTasklyTasks'),
          route: '/customer/tasks' as Href,
        },
        {
          icon: 'add-circle-outline',
          isActive: (current) => current === '/customer/post-task',
          label: t('drawerPostTasklyTask'),
          route: '/customer/post-task' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupTasklyPro'),
      items: [
        {
          icon: 'sparkles-outline',
          isActive: (current) => current.startsWith('/customer/pro-requests'),
          label: t('drawerMyTasklyProProjects'),
          route: '/customer/pro-requests' as Href,
          tone: 'pro',
        },
        {
          icon: 'color-wand-outline',
          isActive: (current) => current === '/customer/post-pro-request',
          label: t('drawerStartTasklyProProject'),
          route: '/customer/post-pro-request' as Href,
          tone: 'pro',
        },
      ],
    },
    {
      label: t('drawerGroupCommunication'),
      items: [
        {
          icon: 'chatbubbles-outline',
          isActive: (current, isSupport) => current.startsWith('/customer/messages') && !isSupport,
          label: t('messages'),
          route: '/customer/messages' as Href,
        },
        {
          icon: 'mail-outline',
          isActive: (current, isSupport) => current.startsWith('/customer/messages') && isSupport,
          label: t('drawerSupportMessages'),
          route: '/customer/messages?context=support' as Href,
        },
        {
          icon: 'help-circle-outline',
          isActive: (current) => current === '/customer/support',
          label: t('drawerContactSupport'),
          route: '/customer/support' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupAccount'),
      items: [
        {
          icon: 'card-outline',
          isActive: (current) => current === '/customer/payments-unlocks',
          label: t('drawerPaymentsUnlocks'),
          route: '/customer/payments-unlocks' as Href,
        },
        {
          icon: 'person-outline',
          isActive: (current) => current === '/customer/profile' || current === '/customer/account',
          label: t('drawerProfile'),
          route: '/customer/profile' as Href,
        },
        {
          icon: 'shield-checkmark-outline',
          isActive: (current) => current === '/customer/security',
          label: t('accountSecurityTitle'),
          route: '/customer/security' as Href,
        },
        {
          icon: 'settings-outline',
          isActive: (current) => current === '/customer/settings',
          label: t('drawerSettings'),
          route: '/customer/settings' as Href,
        },
      ],
    },
  ];

  const handleNavigate = (route: Href) => {
    onClose();
    router.push(route);
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
                <TasklyLogoText compact wordmarkOnly />
                <AppText color={colors.sidebarMuted} style={styles.areaLabel} variant="small">
                  {t('drawerCustomerArea')}
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
                        onPress={() => handleNavigate(item.route)}
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
        {toTitleCase(label)}
      </AppText>
    </Pressable>
  );
}

function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase());
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
    left: 0,
    position: 'absolute',
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 12,
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
    backgroundColor: colors.white,
    borderBottomRightRadius: 28,
    borderColor: colors.sidebarBorder,
    borderBottomWidth: 1,
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
    borderTopColor: colors.sidebarBorder,
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
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.sidebarBorder,
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
    backgroundColor: colors.white,
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
    borderColor: colors.sidebarBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  logoutIcon: {
    alignItems: 'center',
    borderColor: colors.sidebarBorder,
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
