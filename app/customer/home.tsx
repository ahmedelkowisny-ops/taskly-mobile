import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  useI18n();
  const router = useRouter();
  const { session: authSession } = useAuth();
  const session = authSession ?? getMockUserSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const displayName = session.user.displayName;

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.greeting}>
        <AppText style={styles.greetingTitle} variant="screenTitle">
          {t('welcomeName').replace('{name}', displayName)}
        </AppText>
        <AppText color={colors.slate700} style={styles.greetingBody}>
          {t('customerHomePromise')}
        </AppText>
      </View>

      <View style={styles.actionCards}>
        <HomeActionCard
          accent="core"
          chips={[t('mountTv'), t('furniture'), t('fixSink'), t('smallRepairs')]}
          cta={t('postTaskShort')}
          icon="add-circle-outline"
          onPress={() => router.push('/customer/post-task' as Href)}
          subtitle={t('forQuickSmallJobs')}
          title="Taskly"
        />
        <HomeActionCard
          accent="pro"
          chips={[t('bathroom'), t('electrical'), t('kitchen'), t('renovation')]}
          cta={t('postProRequestShort')}
          icon="sparkles-outline"
          onPress={() => router.push('/customer/post-pro-request' as Href)}
          subtitle={t('forBiggerQuoteProjects')}
          title="Taskly Pro"
        />
      </View>

      <View style={styles.trustCard}>
        <AppText variant="cardTitle">{t('customerHomeTrustTitle')}</AppText>
        <View style={styles.trustChips}>
          <TrustChip icon="shield-checkmark-outline" label={t('paymentProtectedChip')} tone="core" />
          <TrustChip icon="ribbon-outline" label={t('approvedProsChip')} tone="pro" />
          <TrustChip icon="help-circle-outline" label={t('supportWhenNeededChip')} tone="neutral" />
        </View>
      </View>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  actionCards: {
    gap: spacing.md,
  },
  actionCardCore: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E7FF',
  },
  actionCardPro: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F3D6AF',
  },
  actionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionTitleWrap: {
    flex: 1,
    gap: 4,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipCore: {
    backgroundColor: colors.white,
    borderColor: '#BFDBFE',
  },
  chipPro: {
    backgroundColor: colors.white,
    borderColor: '#FCD9A8',
  },
  chipNeutral: {
    backgroundColor: colors.slate50,
    borderColor: '#E6EBF0',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  greeting: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  greetingTitle: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  proActionButton: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  screen: {
    backgroundColor: '#F7F9FB',
  },
  trustCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  trustChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  trustChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

function HomeActionCard({
  accent,
  chips,
  cta,
  icon,
  onPress,
  subtitle,
  title,
}: {
  accent: 'core' | 'pro';
  chips: string[];
  cta: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  const isPro = accent === 'pro';
  const accentColor = isPro ? colors.proOrange600 : colors.tasklyBlue600;

  return (
    <View style={[styles.actionCard, isPro ? styles.actionCardPro : styles.actionCardCore]}>
      <View style={styles.actionHeader}>
        <View style={[styles.actionIcon, { backgroundColor: isPro ? colors.proOrange50 : colors.tasklyBlue50 }]}>
          <Ionicons color={accentColor} name={icon} size={22} />
        </View>
        <View style={styles.actionTitleWrap}>
          <AppText color={accentColor} variant="small">
            {title}
          </AppText>
          <AppText variant="cardTitle">{subtitle}</AppText>
        </View>
      </View>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={`${title}-${chip}`} style={[styles.chip, isPro ? styles.chipPro : styles.chipCore]}>
            <AppText color={isPro ? '#92400E' : colors.tasklyBlue700} variant="caption">
              {chip}
            </AppText>
          </View>
        ))}
      </View>
      <AppButton onPress={onPress} style={isPro ? styles.proActionButton : null} tone={isPro ? 'pro' : 'core'}>
        {cta}
      </AppButton>
    </View>
  );
}

function TrustChip({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: 'core' | 'neutral' | 'pro';
}) {
  const color = tone === 'pro' ? colors.proOrange600 : tone === 'core' ? colors.tasklyBlue600 : colors.slate700;
  return (
    <View style={[styles.trustChip, tone === 'pro' ? styles.chipPro : tone === 'core' ? styles.chipCore : styles.chipNeutral]}>
      <Ionicons color={color} name={icon} size={14} />
      <AppText color={color} variant="small">
        {label}
      </AppText>
    </View>
  );
}

