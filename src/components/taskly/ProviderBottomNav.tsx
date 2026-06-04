import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';
import { useProviderBottomNavVisibility } from './ProviderBottomNavVisibility';

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: Href;
  value: string;
};

export function ProviderBottomNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const visibility = useProviderBottomNavVisibility();
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hidden = visibility?.hidden ?? false;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        duration: hidden ? 220 : 180,
        toValue: hidden ? 112 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        duration: 160,
        toValue: hidden ? 0 : 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hidden, opacity, translateY]);

  if (!pathname.startsWith('/provider') || pathname === '/provider/start') {
    return null;
  }

  const items: NavItem[] = [
    {
      icon: 'grid-outline',
      label: t('providerNavDashboard'),
      route: '/provider/dashboard' as Href,
      value: 'dashboard',
    },
    {
      icon: 'briefcase-outline',
      label: t('providerNavTasks'),
      route: '/provider/active-tasks' as Href,
      value: 'tasks',
    },
    {
      icon: 'chatbubble-outline',
      label: t('providerNavMessages'),
      route: '/provider/messages' as Href,
      value: 'messages',
    },
    {
      icon: 'person-outline',
      label: t('providerNavProfile'),
      route: '/provider/profile' as Href,
      value: 'profile',
    },
  ];

  function isActive(value: string) {
    if (value === 'dashboard') return pathname === '/provider/dashboard';
    if (value === 'tasks') return pathname === '/provider/active-tasks';
    if (value === 'messages') return pathname.startsWith('/provider/messages');
    if (value === 'profile') return pathname === '/provider/profile';
    return false;
  }

  function navigate(route: Href) {
    router.push(route);
  }

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'box-none'}
      style={[
        styles.navFloat,
        {
          bottom: Math.max(insets.bottom, spacing.md),
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <View style={styles.navWrap}>
        <View style={styles.navBar}>
          <NavButton active={isActive('dashboard')} item={items[0]} onPress={() => navigate(items[0].route)} />
          <NavButton active={isActive('tasks')} item={items[1]} onPress={() => navigate(items[1].route)} />
          <BrowseNavButton active={pathname.startsWith('/provider/core-tasks')} onPress={() => navigate('/provider/core-tasks' as Href)} />
          <NavButton
            active={isActive('messages')}
            badge={unreadMessages > 0}
            item={items[2]}
            onPress={() => navigate(items[2].route)}
          />
          <NavButton active={isActive('profile')} item={items[3]} onPress={() => navigate(items[3].route)} />
        </View>
      </View>
    </Animated.View>
  );
}

function NavButton({
  active,
  badge,
  item,
  onPress,
}: {
  active: boolean;
  badge?: boolean;
  item: NavItem;
  onPress: () => void;
}) {
  const iconName = (active ? item.icon.replace('-outline', '') : item.icon) as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed ? styles.pressed : null]}>
      <View style={styles.iconWrap}>
        <Ionicons color={active ? colors.tasklyBlue600 : colors.slate500} name={iconName} size={24} />
        {badge ? <View style={styles.unreadDot} /> : null}
      </View>
      {active ? <View style={styles.activeIndicator} /> : null}
    </Pressable>
  );
}

function BrowseNavButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={t('providerNavBrowse')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, styles.browseNavItem, pressed ? styles.pressed : null]}>
      <View style={styles.browseButton}>
        <Ionicons color={colors.white} name="search" size={24} />
      </View>
      <AppText color={active ? colors.tasklyBlue600 : colors.slate500} style={styles.browseLabel} variant="small">
        {t('providerNavBrowse')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 3,
    marginTop: spacing.xs,
    width: 18,
  },
  browseButton: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
    ...designTokens.shadows.buttonBlue,
  },
  browseLabel: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 2,
  },
  browseNavItem: {
    marginTop: -spacing.lg,
  },
  iconWrap: {
    position: 'relative',
  },
  navBar: {
    ...designTokens.shadows.card,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: spacing.sm,
  },
  navFloat: {
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
  },
  navWrap: {
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  unreadDot: {
    backgroundColor: '#EF4444',
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 8,
    position: 'absolute',
    right: -2,
    top: -1,
    width: 8,
  },
});
