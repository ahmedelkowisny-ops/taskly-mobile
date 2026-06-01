import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { LanguageToggle, TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { canAccessCustomerWorkspace, canAccessProviderWorkspace } from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type RoleId = 'customer' | 'tasker' | 'proTasker';
type RoleTone = 'customer' | 'pro' | 'tasker';

type RoleAction = {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: RoleId;
  title: string;
  tone: RoleTone;
};

const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;
const PROVIDER_DASHBOARD_ROUTE = '/provider/dashboard' as Href;
const PROVIDER_START_ROUTE = '/provider/start' as Href;

export default function WelcomeScreen() {
  useI18n();
  const router = useRouter();
  const { session, status } = useAuth();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(10)).current;
  const heroScale = useRef(new Animated.Value(0.98)).current;
  const loginActions = getLoginActions();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(heroScale, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroScale, heroTranslateY]);

  function openRole(role: RoleId) {
    if (role === 'customer' && (status === 'demo' || canAccessCustomerWorkspace(session))) {
      router.push(CUSTOMER_HOME_ROUTE);
      return;
    }

    if ((role === 'tasker' || role === 'proTasker') && (status === 'demo' || canAccessProviderWorkspace(session))) {
      router.push(status === 'demo' || session?.nextAction.type === 'none' ? PROVIDER_DASHBOARD_ROUTE : PROVIDER_START_ROUTE);
      return;
    }

    router.push(`/login?role=${role}&intent=login` as Href);
  }

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.brandMark}>
          <TasklyLogoText compact iconOnly />
        </View>
        <View style={styles.topActions}>
          <LanguageToggle />
          <AppButton onPress={() => router.push('/login' as Href)} style={styles.loginButton} variant="outline">
            {t('loginTitle')}
          </AppButton>
        </View>
      </View>

      <Animated.View
        style={[
          styles.heroBox,
          {
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
          },
        ]}>
        <AppText style={styles.heroTitle} variant="screenTitle">
          {t('entryWebHeadline')}
        </AppText>
        <AppText color={colors.slate700} style={styles.heroBody}>
          {t('entryWebSubtitle')}
        </AppText>
      </Animated.View>

      <View style={styles.actionStack}>
        {loginActions.map((action) => (
          <RoleActionButton
            action={action}
            key={action.id}
            onPress={() => {
              openRole(action.id);
            }}
          />
        ))}
      </View>

      <View style={styles.registerLine}>
        <AppText color={colors.slate500} style={styles.registerText}>
          {t('newToTaskly')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/register' as Href)}
          style={({ pressed }) => [styles.registerLink, pressed ? styles.pressed : null]}>
          <AppText color={colors.tasklyBlue600} style={styles.registerLinkText}>
            {t('createAccount')}
          </AppText>
        </Pressable>
      </View>

    </Screen>
  );
}

function getLoginActions(): RoleAction[] {
  return [
    {
      body: t('loginCustomerHelper'),
      icon: 'home-outline',
      id: 'customer',
      title: t('continueAsCustomer'),
      tone: 'customer',
    },
    {
      body: t('loginTaskerHelper'),
      icon: 'hammer-outline',
      id: 'tasker',
      title: t('continueAsTasker'),
      tone: 'tasker',
    },
    {
      body: t('loginProTaskerHelper'),
      icon: 'ribbon-outline',
      id: 'proTasker',
      title: t('continueAsProTasker'),
      tone: 'pro',
    },
  ];
}

function RoleActionButton({
  action,
  compact = false,
  onPress,
}: {
  action: RoleAction;
  compact?: boolean;
  onPress: () => void;
}) {
  const visual = getRoleVisual(action.tone);
  const foreground = action.tone === 'customer' ? colors.white : colors.slate700;
  const iconColor = action.tone === 'customer' ? colors.white : visual.accent;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleButton,
        compact ? styles.roleButtonCompact : null,
        {
          backgroundColor: visual.background,
          borderColor: pressed ? visual.accent : visual.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.roleIcon, { backgroundColor: visual.iconBackground, borderColor: visual.border }]}>
        <Ionicons color={iconColor} name={action.icon} size={compact ? 17 : 19} />
      </View>
      <View style={styles.roleText}>
        <AppText color={visual.titleColor} style={[styles.roleTitle, compact ? styles.roleTitleCompact : null]}>
          {action.title}
        </AppText>
        <AppText color={foreground} style={[styles.roleBody, compact ? styles.roleBodyCompact : null]}>
          {action.body}
        </AppText>
      </View>
      <Ionicons color={iconColor} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function getRoleVisual(tone: RoleTone) {
  if (tone === 'pro') {
    return {
      accent: colors.proOrange600,
      background: colors.proOrange50,
      border: colors.proOrangeBorder,
      iconBackground: colors.white,
      titleColor: colors.proOrangeTextDark,
    };
  }

  if (tone === 'tasker') {
    return {
      accent: colors.tasklyBlue700,
      background: colors.white,
      border: colors.slate100,
      iconBackground: colors.tasklyBlue50,
      titleColor: colors.navy900,
    };
  }

  return {
    accent: colors.tasklyBlue600,
    background: colors.tasklyBlue600,
    border: colors.tasklyBlue600,
    iconBackground: 'rgba(255,255,255,0.16)',
    titleColor: colors.white,
  };
}

const styles = StyleSheet.create({
  actionStack: {
    gap: spacing.sm,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DCEBFA',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    shadowColor: colors.navy900,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    width: 46,
    elevation: 1,
  },
  content: {
    gap: spacing.md,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  heroBox: {
    backgroundColor: colors.white,
    borderColor: '#CFE1F4',
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: colors.tasklyBlue600,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  loginButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  registerActions: {
    gap: spacing.sm,
  },
  registerLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  registerLink: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  registerPanel: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  registerPanelBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  registerPanelHeader: {
    gap: spacing.xs,
  },
  registerPanelTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  registerText: {
    fontSize: 14,
    lineHeight: 19,
  },
  roleBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  roleBodyCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  roleButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  roleButtonCompact: {
    minHeight: 58,
  },
  roleIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  roleText: {
    flex: 1,
    gap: 2,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  roleTitleCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  screen: {
    backgroundColor: '#F6F9FD',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
