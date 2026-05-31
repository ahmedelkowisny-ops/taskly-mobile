import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';
import { LanguageToggle } from './LanguageToggle';
import { TasklyLogoText } from './TasklyLogoText';

type CustomerDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

type DrawerItem = {
  icon: keyof typeof Ionicons.glyphMap;
  isActive: (pathname: string) => boolean;
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
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.88, 344);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

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
          isActive: (current) => current.startsWith('/customer/messages'),
          label: t('drawerChat'),
          route: '/customer/messages' as Href,
        },
        {
          icon: 'mail-outline',
          isActive: () => false,
          label: t('drawerSupportMessages'),
          route: '/customer/messages' as Href,
        },
      ],
    },
    {
      label: t('drawerGroupAccount'),
      items: [
        {
          icon: 'person-outline',
          isActive: (current) => current === '/customer/account',
          label: t('drawerProfile'),
          route: '/customer/account' as Href,
        },
        {
          icon: 'settings-outline',
          isActive: () => false,
          label: t('drawerSettings'),
          route: '/customer/account' as Href,
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
        <Animated.View style={[styles.animatedDrawer, { transform: [{ translateX }], width: drawerWidth }]}>
          <SafeAreaView style={styles.drawer}>
            <View style={styles.header}>
              <View style={styles.logoBlock}>
                <TasklyLogoText compact wordmarkOnly />
                <AppText color={colors.sidebarMuted} style={styles.areaLabel} variant="small">
                  {t('drawerCustomerArea')}
                </AppText>
              </View>
              <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.navy900} name="close" size={20} />
              </Pressable>
            </View>

            <View style={styles.languageCard}>
              <AppText color={colors.sidebarMuted} style={styles.languageLabel} variant="small">
                {t('drawerLanguage')}
              </AppText>
              <LanguageToggle />
            </View>

            <ScrollView contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
              {drawerGroups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <AppText color={colors.sidebarMuted} style={styles.groupLabel} variant="small">
                    {group.label}
                  </AppText>
                  <View style={styles.groupItems}>
                    {group.items.map((item) => (
                      <DrawerNavItem
                        active={item.isActive(pathname)}
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
              <View style={styles.trustNote}>
                <Ionicons color={colors.tasklyBlue600} name="shield-checkmark-outline" size={16} />
                <AppText color={colors.sidebarMuted} style={styles.trustText} variant="small">
                  {t('drawerTrustNote')}
                </AppText>
              </View>
              <Pressable accessibilityRole="button" onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null]}>
                <View style={styles.logoutIcon}>
                  <Ionicons color={colors.danger600} name="log-out-outline" size={18} />
                </View>
                <AppText color={colors.danger600} style={styles.logoutLabel} variant="bodyStrong">
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
    height: '100%',
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
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
    backgroundColor: colors.sidebarBackground,
    borderBottomRightRadius: radius.card,
    borderColor: colors.sidebarBorder,
    borderRightWidth: 1,
    borderTopRightRadius: radius.card,
    flex: 1,
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  footer: {
    borderTopColor: colors.sidebarBorder,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  groupItems: {
    gap: 6,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    paddingHorizontal: spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
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
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    textTransform: 'uppercase',
  },
  languageCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.sidebarBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  languageLabel: {
    fontWeight: '800',
  },
  logoBlock: {
    gap: 2,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.sidebarBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
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
    fontSize: 13,
  },
  navContent: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  overlay: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(8, 12, 20, 0.18)',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  pressed: {
    opacity: 0.86,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  trustNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.sidebarBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  trustText: {
    flex: 1,
    lineHeight: 17,
  },
});
