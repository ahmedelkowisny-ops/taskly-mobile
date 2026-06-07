import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerProRequests } from '@/src/lib/api/customer';
import { CustomerProRequestsResponse } from '@/src/lib/api/domain';
import { getMockCustomerProRequestsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerProRequestsScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerProRequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadProRequests = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockCustomerProRequestsResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const result = await getCustomerProRequests(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? t('loginRequiredProRequests')
        : t('couldNotLoadYourProRequests'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProRequests();
    }, [loadProRequests]),
  );

  return (
    <Screen contentStyle={styles.screenContent}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.proHero}>
        <View style={styles.badgeRow}>
          <StatusBadge label={t('tasklyPro')} tone="pro" />
          <StatusBadge label={t('approvedProsChip')} tone="neutral" />
        </View>
        <AppText style={styles.heroTitle}>{t('myProRequests')}</AppText>
        <AppText color={colors.slate700} style={styles.heroSubtitle}>{t('customerProIntro')}</AppText>
      </View>

      {data && !data.proRequests.length && !isLoading && !errorMessage && !isUnauthorized ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/customer/post-pro-request' as Href)}
          style={({ pressed }) => [styles.ctaButton, pressed ? { opacity: 0.88 } : null]}>
          <Ionicons color="white" name="ribbon-outline" size={18} />
          <AppText color="white" variant="bodyStrong">{t('postProRequest')}</AppText>
        </Pressable>
      ) : null}

      {data?.proRequests.length ? <ProRequestMetrics requests={data.proRequests} /> : null}

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50} style={[styles.stateCard, styles.proStateCard]}>
          <StatusBadge label={t('loading')} tone="pro" />
          <AppText variant="cardTitle">{t('loadingProRequests')}</AppText>
          <AppText color={colors.slate700}>{t('fetchingCustomerProRequests')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600} style={[styles.stateCard, styles.errorCard]}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="cardTitle">
            {isUnauthorized ? t('proRequestsNeedRealSession') : t('couldNotRefreshProRequests')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadProRequests} tone="pro" variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {data?.proRequests.length ? (
        <View style={styles.cardList}>
          {data.proRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.badgeRow}>
                <StatusBadge label={request.statusLabel} tone="pro" />
                <StatusBadge
                  label={request.proAccessState?.statusLabel || request.unlockStatusLabel}
                  tone={getProAccessBadgeTone(request.proAccessState?.status, request.isUnlocked)}
                />
                {getProAccessSupportBadgeLabel(request) ? (
                  <StatusBadge
                    label={getProAccessSupportBadgeLabel(request) || t('supportReview')}
                    tone={getProAccessSupportBadgeTone(request)}
                  />
                ) : null}
              </View>
              <AppText style={styles.cardTitle}>{request.title}</AppText>
              <View style={styles.metaGrid}>
                <ProMeta label={t('category')} value={request.categoryLabel} />
                <ProMeta label={t('city')} value={request.cityLabel} />
                <ProMeta label={t('timeline')} value={request.timelineLabel} />
                <ProMeta
                  label={t('responsesReceived')}
                  value={request.responsePreviewSummary || `${request.responsesCount} ${t('responsesReceived')}`}
                />
              </View>
              <View style={styles.accessLine}>
                <AppText color={colors.proOrangeTextDark} variant="small">
                  {request.proAccessSummary || request.unlockStatusLabel}
                </AppText>
              </View>
              <AppButton
                onPress={() => router.push(`/customer/pro-requests/${request.id}` as Href)}
                tone="pro"
                variant="outline">
                {t('viewDetails')}
              </AppButton>
            </View>
          ))}
        </View>
      ) : data && !isLoading ? (
        <AppCard backgroundColor={colors.proOrange50} style={styles.emptyCard}>
          <AppText style={styles.cardTitle}>{data.emptyState.title}</AppText>
          <AppText color={colors.slate700}>{t('proEmptyStateBody')}</AppText>
        </AppCard>
      ) : null}

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function ProRequestMetrics({ requests }: { requests: CustomerProRequestsResponse['proRequests'] }) {
  const activeCount = requests.filter((request) => !['closed', 'cancelled', 'archived'].includes(request.status)).length;
  const responseCount = requests.reduce((total, request) => total + request.responsesCount, 0);
  const unlockedCount = requests.filter((request) => request.isUnlocked).length;

  return (
    <View style={styles.metricsGrid}>
      <MetricCard label={t('openShort')} value={String(requests.length)} />
      <MetricCard label={t('activeShort')} value={String(activeCount)} />
      <MetricCard label={t('proResponsesShort')} value={String(responseCount)} />
      <MetricCard label={t('accessUnlocked')} value={String(unlockedCount)} />
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <AppText color={colors.proOrangeText} variant="small">{label}</AppText>
      <AppText style={styles.metricValue}>{value}</AppText>
    </View>
  );
}

function ProMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{value}</AppText>
    </View>
  );
}

function getProAccessBadgeTone(status?: string, isUnlocked?: boolean) {
  if (isUnlocked || status === 'unlocked' || status === 'credited') return 'success';
  if (status === 'available' || status === 'payment_failed') return 'pro';
  if (status === 'payment_pending' || status === 'not_available' || status === 'request_closed') return 'warning';
  return 'neutral';
}

function getProAccessSupportBadgeLabel(request: CustomerProRequestsResponse['proRequests'][number]) {
  const refundStatus = request.proAccessRefundState?.status;
  const supportStatus = request.proAccessSupportState?.status;
  const paymentStatus = request.proAccessPaymentState?.status;

  if (refundStatus === 'refunded') return t('refunded');
  if (refundStatus === 'credited') return t('credited');
  if (supportStatus === 'under_review' || supportStatus === 'submitted' || refundStatus === 'under_review' || refundStatus === 'requested') {
    return t('refundReview');
  }
  if (paymentStatus === 'failed') return t('paymentFailed');
  return null;
}

function getProAccessSupportBadgeTone(request: CustomerProRequestsResponse['proRequests'][number]) {
  const refundStatus = request.proAccessRefundState?.status;
  const supportStatus = request.proAccessSupportState?.status;
  const paymentStatus = request.proAccessPaymentState?.status;

  if (refundStatus === 'refunded' || refundStatus === 'credited' || supportStatus === 'resolved') return 'success';
  if (supportStatus === 'under_review' || supportStatus === 'submitted' || refundStatus === 'under_review' || refundStatus === 'requested') return 'pro';
  if (paymentStatus === 'failed') return 'warning';
  return 'neutral';
}

const styles = StyleSheet.create({
  accessLine: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonStack: {
    gap: spacing.md,
  },
  cardList: {
    gap: spacing.lg,
  },
  cardTitle: {
    color: colors.navy900,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: colors.proAmber500,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.proAmber500,
    elevation: 5,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
  },
  emptyCard: {
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaItem: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: '46%',
    padding: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minWidth: '45%',
    padding: spacing.md,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  metricValue: {
    color: colors.proOrangeTextDark,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  proHero: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 4,
  },
  proStateCard: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  screenContent: {
    backgroundColor: colors.slate50,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + 96,
  },
  stateCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
});
