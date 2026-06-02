import { Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';

import { PublicTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { getDefaultAuthenticatedRoute } from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const landingImage = require('../assets/branding/landing.png');
const LANDING_IMAGE_ASPECT_RATIO = 1122 / 1402;
const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;

export default function WelcomeScreen() {
  const { locale } = useI18n();
  const router = useRouter();
  const { session, status } = useAuth();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(10)).current;
  const heroScale = useRef(new Animated.Value(0.98)).current;

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

  useEffect(() => {
    if (status === 'demo') {
      router.replace(CUSTOMER_HOME_ROUTE);
      return;
    }

    if (status !== 'authenticated') return;

    const targetRoute = getDefaultAuthenticatedRoute(session);
    if (targetRoute) {
      router.replace(targetRoute as Href);
    }
  }, [router, session, status]);

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <PublicTopBar>
        <AppButton onPress={() => router.push('/login' as Href)} style={styles.loginButton} variant="outline">
          {t('loginTitle')}
        </AppButton>
      </PublicTopBar>

      <View style={styles.mainContent}>
        <Animated.View
          style={[
            styles.heroBox,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
            },
          ]}>
          <AppText style={[styles.heroTitle, locale === 'bg' ? styles.heroTitleBg : null]} variant="screenTitle">
            {t('entryWebHeadline')}
          </AppText>
          <AppText color={colors.slate700} style={styles.heroBody}>
            {t('entryWebSubtitle')}
          </AppText>
        </Animated.View>

        <View style={styles.imageFrame}>
          <Image
            accessibilityLabel={t('entryWebHeadline')}
            resizeMode="contain"
            source={landingImage}
            style={styles.landingImage}
          />
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
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
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
  heroTitleBg: {
    fontSize: 20,
    lineHeight: 26,
  },
  loginButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  imageFrame: {
    backgroundColor: colors.white,
    borderColor: '#CFE1F4',
    borderRadius: 24,
    borderWidth: 1,
    aspectRatio: LANDING_IMAGE_ASPECT_RATIO,
    maxHeight: 360,
    maxWidth: 320,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'center',
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 1,
  },
  landingImage: {
    borderRadius: 24,
    height: '100%',
    width: '100%',
  },
  mainContent: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
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
  registerText: {
    fontSize: 14,
    lineHeight: 19,
  },
  screen: {
    backgroundColor: '#F6F9FD',
  },
});
