import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCustomerCreateBarVisibility } from '@/src/components/taskly/CustomerCreateBarVisibility';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: Href;
  value: 'home' | 'messages' | 'profile' | 'tasks';
};

const MAIN_CUSTOMER_PATHS = new Set([
  '/customer/home',
  '/customer/dashboard',
  '/customer/tasks',
  '/customer/pro-requests',
  '/customer/messages',
  '/customer/profile',
]);

export function CustomerBottomNav() {
  useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const visibility = useCustomerCreateBarVisibility();
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [postSheetVisible, setPostSheetVisible] = useState(false);
  const hidden = visibility?.hidden ?? false;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        duration: hidden ? 220 : 180,
        toValue: hidden ? 112 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        duration: hidden ? 160 : 160,
        toValue: hidden ? 0 : 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hidden, opacity, translateY]);

  if (!MAIN_CUSTOMER_PATHS.has(pathname)) {
    return null;
  }

  const items: NavItem[] = [
    { icon: 'home-outline', label: t('bottomNavHome'), route: '/customer/home' as Href, value: 'home' },
    { icon: 'list-outline', label: t('bottomNavTasks'), route: '/customer/tasks' as Href, value: 'tasks' },
    { icon: 'chatbubbles-outline', label: t('bottomNavMessages'), route: '/customer/messages' as Href, value: 'messages' },
    { icon: 'person-outline', label: t('bottomNavProfile'), route: '/customer/profile' as Href, value: 'profile' },
  ];

  function navigate(route: Href) {
    setPostSheetVisible(false);
    router.push(route);
  }

  return (
    <>
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
            <NavButton active={pathname === '/customer/home' || pathname === '/customer/dashboard'} item={items[0]} onPress={() => navigate(items[0].route)} />
            <NavButton active={pathname === '/customer/tasks'} item={items[1]} onPress={() => navigate(items[1].route)} />
            <PostNavButton onPress={() => setPostSheetVisible(true)} />
            <NavButton active={pathname === '/customer/messages'} item={items[2]} onPress={() => navigate(items[2].route)} />
            <NavButton active={pathname === '/customer/profile'} item={items[3]} onPress={() => navigate(items[3].route)} />
          </View>
        </View>
      </Animated.View>

      <Modal animationType="slide" onRequestClose={() => setPostSheetVisible(false)} transparent visible={postSheetVisible}>
        <View style={styles.sheetOverlay}>
          <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={() => setPostSheetVisible(false)} style={styles.scrim} />
          <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <AppText variant="sectionTitle">{t('bottomPostSheetTitle')}</AppText>
              <AppText color={colors.slate500}>{t('bottomPostSheetBody')}</AppText>
              <PostAction
                body={t('smallHomeTasks')}
                icon="construct-outline"
                onPress={() => navigate('/customer/post-task' as Href)}
                title={t('postTaskShort')}
                tone="core"
              />
              <PostAction
                body={t('biggerProjects')}
                icon="ribbon-outline"
                onPress={() => navigate('/customer/post-pro-request' as Href)}
                title={t('postProRequestShort')}
                tone="pro"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function NavButton({ active, item, onPress }: { active: boolean; item: NavItem; onPress: () => void }) {
  const iconName = (active ? item.icon.replace('-outline', '') : item.icon) as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed ? styles.pressed : null]}>
      <Ionicons color={active ? colors.tasklyBlue600 : colors.slate500} name={iconName} size={24} />
      {active ? <View style={styles.activeIndicator} /> : null}
    </Pressable>
  );
}

function PostNavButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={t('bottomNavPost')} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.navItem, styles.postNavItem, pressed ? styles.pressed : null]}>
      <View style={styles.postButton}>
        <Ionicons color={colors.white} name="add" size={26} />
      </View>
    </Pressable>
  );
}

function PostAction({
  body,
  icon,
  onPress,
  title,
  tone,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
  tone: 'core' | 'pro';
}) {
  const isPro = tone === 'pro';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.postAction, isPro ? styles.postActionPro : styles.postActionCore, pressed ? styles.pressed : null]}>
      <View style={[styles.postActionIcon, isPro ? styles.postActionIconPro : styles.postActionIconCore]}>
        <Ionicons color={isPro ? colors.proOrange600 : colors.white} name={icon} size={22} />
      </View>
      <View style={styles.postActionText}>
        <AppText color={isPro ? colors.proOrangeTextDark : colors.white} variant="cardTitle">
          {title}
        </AppText>
        <AppText color={isPro ? colors.proOrangeText : 'rgba(255,255,255,0.82)'} variant="small">
          {body}
        </AppText>
      </View>
      <Ionicons color={isPro ? colors.proOrange600 : colors.white} name="arrow-forward" size={19} />
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
  navBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    shadowColor: '#1877F2',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
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
    gap: 0,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
  },
  navWrap: {
    paddingHorizontal: spacing.md,
  },
  postAction: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 84,
    padding: spacing.lg,
  },
  postActionCore: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
    elevation: 4,
    shadowColor: '#1877F2',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  postActionIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  postActionIconCore: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  postActionIconPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderWidth: 1,
  },
  postActionPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  postActionText: {
    flex: 1,
    gap: spacing.xs,
  },
  postButton: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    elevation: 6,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#1877F2',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    width: 50,
  },
  postNavItem: {
    marginTop: -spacing.lg,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    elevation: 10,
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    height: 4,
    width: 44,
  },
  sheetOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetSafeArea: {
    justifyContent: 'flex-end',
  },
});
