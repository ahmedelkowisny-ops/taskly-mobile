import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { PublicTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { getDefaultAuthenticatedRoute } from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, status } = useAuth();
  useI18n();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(10)).current;

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
    ]).start();
  }, [heroOpacity, heroTranslateY]);

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
        <AppButton onPress={() => router.push('/login' as Href)} style={styles.topLoginButton} variant="outline">
          {t('loginTitle')}
        </AppButton>
      </PublicTopBar>

      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }]}>
        <View style={styles.cityPill}>
          <View style={styles.cityDot} />
          <AppText color={colors.slate500} variant="small">
            {t('landingCityPill')}
          </AppText>
        </View>
        <AppText style={styles.heroTitle} variant="screenTitle">
          <AppText color={colors.tasklyBlue600} style={styles.heroTitle} variant="screenTitle">
            {t('landingHeroHome')}
          </AppText>
          {t('landingHeroConnector')}
          <AppText color={colors.proAmber500} style={styles.heroTitle} variant="screenTitle">
            {t('landingHeroPro')}
          </AppText>
          {t('landingHeroSuffix')}
        </AppText>
        <AppText color={colors.slate500} style={styles.heroSubtitle}>
          {t('landingHeroSubtitle')}
        </AppText>
      </Animated.View>

      <View style={styles.ctaStack}>
        <LandingActionCard
          backgroundColor={colors.tasklyBlue600}
          icon="construct-outline"
          onPress={() => router.push('/customer/post-task' as Href)}
          subtitle={t('landingTaskSubtitle')}
          textColor={colors.white}
          title={t('postTaskShort')}
          variant="core"
        />
        <LandingActionCard
          backgroundColor={colors.proOrange50}
          borderColor={colors.proOrangeBorder}
          icon="ribbon-outline"
          onPress={() => router.push('/customer/post-pro-request' as Href)}
          subtitle={t('landingProSubtitle')}
          textColor={colors.proOrangeTextDark}
          title={t('postProRequestShort')}
          variant="pro"
        />
      </View>

      <View style={styles.trustStrip}>
        <TrustStripItem icon="shield-checkmark-outline" label={t('paymentProtected')} />
        <TrustStripItem icon="checkmark-circle-outline" label={t('verifiedTaskers')} />
        <TrustStripItem icon="star-outline" label={t('approvedProsChip')} />
        <TrustStripItem icon="headset-outline" label={t('supportAlways')} />
      </View>

      <View style={styles.section}>
        <SectionHeader helperLabel={t('andMore')} title={t('popularTasks')} />
        <View style={styles.chipWrap}>
          <CategoryChip icon="hammer-outline" label={t('mounting')} />
          <CategoryChip icon="cube-outline" label={t('furniture')} />
          <CategoryChip icon="build-outline" label={t('smallRepairs')} />
          <CategoryChip icon="water-outline" label={t('plumbing')} pro />
          <CategoryChip icon="flash-outline" label={t('electrical')} pro />
          <CategoryChip icon="home-outline" label={t('renovation')} pro />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.steps}>
          <HowStep body={t('landingStepOneBody')} index={1} title={t('landingStepOneTitle')} />
          <HowStep body={t('landingStepTwoBody')} index={2} title={t('landingStepTwoTitle')} />
          <HowStep body={t('landingStepThreeBody')} index={3} title={t('landingStepThreeTitle')} last />
        </View>
      </View>

      <View style={styles.bottomCtas}>
        <AppButton onPress={() => router.push('/register' as Href)} style={styles.primaryButton}>
          {t('getStartedFree')}
        </AppButton>
        <AppButton onPress={() => router.push('/login' as Href)} style={styles.secondaryButton} variant="outline">
          {t('loginToMyAccount')}
        </AppButton>
      </View>
    </Screen>
  );
}

function LandingActionCard({
  backgroundColor,
  borderColor,
  icon,
  onPress,
  subtitle,
  textColor,
  title,
  variant,
}: {
  backgroundColor: string;
  borderColor?: string;
  icon: IoniconName;
  onPress: () => void;
  subtitle: string;
  textColor: string;
  title: string;
  variant: 'core' | 'pro';
}) {
  const isPro = variant === 'pro';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor, borderColor: borderColor ?? backgroundColor },
        pressed ? styles.pressedScale : null,
      ]}>
      <View style={[styles.actionIconBox, isPro ? styles.proIconBox : styles.whiteIconBox]}>
        <Ionicons color={isPro ? colors.proOrange600 : colors.white} name={icon} size={22} />
      </View>
      <View style={styles.actionCopy}>
        <AppText color={textColor} variant="cardTitle">
          {title}
        </AppText>
        <AppText color={isPro ? colors.proOrangeText : colors.white} style={isPro ? null : styles.mutedWhite} variant="small">
          {subtitle}
        </AppText>
      </View>
      <View style={[styles.actionArrowBox, isPro ? styles.proArrowBox : styles.whiteIconBox]}>
        <Ionicons color={isPro ? colors.proOrange600 : colors.white} name="arrow-forward" size={18} />
      </View>
    </Pressable>
  );
}

function TrustStripItem({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <View style={styles.trustItem}>
      <Ionicons color={colors.tasklyBlue600} name={icon} size={18} />
      <AppText color={colors.slate500} style={styles.trustLabel}>
        {label}
      </AppText>
    </View>
  );
}

function SectionHeader({ helperLabel, title }: { helperLabel: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText color={colors.slate500} style={styles.upperTitle}>
        {title}
      </AppText>
      <AppText color={colors.slate500} style={styles.sectionHelper}>
        {helperLabel}
      </AppText>
    </View>
  );
}

function CategoryChip({ icon, label, pro = false }: { icon: IoniconName; label: string; pro?: boolean }) {
  return (
    <View style={[styles.categoryChip, pro ? styles.categoryChipPro : null]}>
      <Ionicons color={pro ? colors.proOrange600 : colors.tasklyBlue600} name={icon} size={15} />
      <AppText color={pro ? colors.proOrangeTextDark : colors.navy900} variant="small">
        {label}
      </AppText>
    </View>
  );
}

function HowStep({ body, index, last = false, title }: { body: string; index: number; last?: boolean; title: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepRail}>
        <View style={styles.stepNumber}>
          <AppText color={colors.tasklyBlue600} style={styles.stepNumberText}>
            {index}
          </AppText>
        </View>
        {!last ? <View style={styles.stepLine} /> : null}
      </View>
      <View style={styles.stepCopy}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText color={colors.slate500} variant="small">
          {body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionArrowBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  actionCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  actionIconBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bottomCtas: {
    gap: spacing.md,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  categoryChipPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cityDot: {
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  cityPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    gap: spacing.xl,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xxxl,
  },
  ctaStack: {
    gap: spacing.md,
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 28,
    lineHeight: 35,
  },
  mutedWhite: {
    opacity: 0.82,
  },
  pressed: {
    opacity: 0.78,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    borderRadius: radius.pill,
    minHeight: 52,
  },
  proArrowBox: {
    backgroundColor: colors.proOrange50,
  },
  proIconBox: {
    backgroundColor: colors.proOrange50,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  secondaryButton: {
    borderRadius: radius.lg,
    minHeight: 52,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHelper: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  stepLine: {
    backgroundColor: colors.border,
    flex: 1,
    width: 1,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepRail: {
    alignItems: 'center',
    minHeight: 72,
    width: 32,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  steps: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minWidth: 64,
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'center',
  },
  trustStrip: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topLoginButton: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  upperTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  whiteIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
