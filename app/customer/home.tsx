import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, EmptyStateCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerHomeSummary } from '@/src/lib/api/customer';
import { CustomerHomeResponse } from '@/src/lib/api/domain';
import { getMockCustomerHomeResponse, getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, session: authSession, status } = useAuth();
  const session = authSession ?? getMockUserSession();
  const [homeData, setHomeData] = useState<CustomerHomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadHome = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setHomeData(getMockCustomerHomeResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setHomeData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setHomeData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const result = await getCustomerHomeSummary(authToken);

    if (result.ok) {
      setHomeData(result.data);
      setIsLoading(false);
      return;
    }

    setHomeData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? t('signInToLoadCustomerArea')
        : t('couldNotLoadCustomerArea'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const summary = homeData?.summary;
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

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText variant="cardTitle">{t('loadingCustomerArea')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="cardTitle">
            {isUnauthorized ? t('signInToViewCustomerActivity') : t('couldNotRefreshCustomerActivity')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.buttonRow}>
            <AppButton onPress={loadHome} variant="outline">
              {t('retry')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

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

      {summary ? (
        <View style={styles.summaryCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="cardTitle">{t('customerSummaryTitle')}</AppText>
          </View>
          <View style={styles.metricsGrid}>
            <Metric label={t('openShort')} value={summary.openTasksCount} />
            <Metric label={t('activeShort')} value={summary.activeTasksCount} />
            <Metric label={t('waitingApproval')} value={summary.pendingCompletionCount} />
            <Metric label={t('proResponsesShort')} value={summary.proResponsesAvailableCount} accent="pro" />
          </View>
        </View>
      ) : null}

      {homeData?.highlights.length ? (
        <View style={styles.activitySection}>
          <AppText variant="sectionTitle">{t('upcomingActivity')}</AppText>
          {homeData.highlights.map((highlight) => (
            <View
              key={highlight.id}
              style={[
                styles.activityCard,
                highlight.accent === 'pro' ? styles.activityCardPro : null,
                highlight.accent === 'warning' ? styles.activityCardWarning : null,
              ]}>
              <StatusBadge
                label={highlight.statusLabel}
                tone={highlight.accent === 'pro' ? 'pro' : highlight.accent === 'warning' ? 'warning' : 'core'}
              />
              <AppText variant="cardTitle">{highlight.title}</AppText>
              <AppText color={colors.slate700}>{highlight.description}</AppText>
            </View>
          ))}
        </View>
      ) : (
        <EmptyStateCard
          body={t('noUpcomingActivityBody')}
          title={t('noUpcomingActivity')}
        />
      )}

      <View style={styles.trustCard}>
        <AppText variant="cardTitle">{t('customerHomeTrustTitle')}</AppText>
        <View style={styles.trustChips}>
          <TrustChip icon="shield-checkmark-outline" label={t('paymentProtectedChip')} tone="core" />
          <TrustChip icon="ribbon-outline" label={t('approvedProsChip')} tone="pro" />
          <TrustChip icon="help-circle-outline" label={t('supportWhenNeededChip')} tone="neutral" />
        </View>
      </View>

      <AppText color={colors.slate500} style={{ fontSize: 11, textAlign: 'center' }}>
        Build check: QA fixes active
      </AppText>

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
  activityCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 1,
  },
  activityCardPro: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F3D6AF',
  },
  activityCardWarning: {
    backgroundColor: '#FFFBF2',
    borderColor: '#F8D8A7',
  },
  activitySection: {
    gap: spacing.md,
  },
  buttonRow: {
    gap: spacing.sm,
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
    gap: spacing.sm,
  },
  greetingBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  greetingTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.md,
  },
  metricPro: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F3D6AF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  screen: {
    backgroundColor: '#F7F9FB',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 2,
  },
  trustCard: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
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
      <AppButton onPress={onPress} tone={isPro ? 'pro' : 'core'}>
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

function Metric({ accent = 'core', label, value }: { accent?: 'core' | 'pro'; label: string; value: number }) {
  return (
    <View style={[styles.metric, accent === 'pro' ? styles.metricPro : null]}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText variant="sectionTitle">{value}</AppText>
    </View>
  );
}
