import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Href, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, EmptyStateCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerPaymentsUnlocks } from '@/src/lib/api/customer';
import type { CustomerPaymentsUnlocksItem, CustomerPaymentsUnlocksResponse } from '@/src/lib/api/domain';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerPaymentsUnlocksScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, status } = useAuth();
  const [data, setData] = useState<CustomerPaymentsUnlocksResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setMessage(null);

    if (status === 'demo') {
      setData({
        emptyState: {
          description: t('paymentsUnlocksEmptyBody'),
          title: t('paymentsUnlocksEmptyTitle'),
        },
        items: [],
        summary: { proAccessCount: 0, taskPaymentCount: 0, totalCount: 0 },
      });
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setMessage(t('realPaymentsRequireLogin'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setData(null);
      setMessage(t('realPaymentsRequireLogin'));
      setIsLoading(false);
      return;
    }

    const result = await getCustomerPaymentsUnlocks(authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setMessage(t('couldNotLoadPaymentsUnlocks'));
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadPayments();
    }, [loadPayments]),
  );

  const items = data?.items ?? [];

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <StatusBadge label={t('paymentProtected')} tone="neutral" />
        <AppText variant="screenTitle">{t('paymentsUnlocks')}</AppText>
        <AppText color={colors.slate700}>{t('paymentsUnlocksIntro')}</AppText>
      </View>

      {data ? (
        <View style={styles.summaryGrid}>
          <SummaryPill label={t('paymentsTotal')} value={data.summary.totalCount} tone="neutral" />
          <SummaryPill label={t('taskPaymentsCount')} value={data.summary.taskPaymentCount} tone="core" />
          <SummaryPill label={t('proAccessCount')} value={data.summary.proAccessCount} tone="pro" />
        </View>
      ) : null}

      {isLoading ? <StateCard label={t('loading')} message={t('paymentsUnlocks')} tone="core" /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('couldNotLoadPaymentsUnlocks')} tone="warning" />
          <AppText color={colors.slate700}>{message}</AppText>
          <AppButton onPress={loadPayments} variant="outline">
            {t('retry')}
          </AppButton>
        </AppCard>
      ) : null}

      {!isLoading && !message && items.length === 0 ? (
        <EmptyStateCard
          body={data?.emptyState.description ?? t('paymentsUnlocksEmptyBody')}
          title={data?.emptyState.title ?? t('paymentsUnlocksEmptyTitle')}
        />
      ) : null}

      {items.map((item) => (
        <PaymentUnlockCard
          item={item}
          key={`${item.kind}-${item.id}`}
          onPress={() => router.push(item.detailRoute as Href)}
        />
      ))}

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function SummaryPill({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'core' | 'neutral' | 'pro';
  value: number;
}) {
  const isPro = tone === 'pro';
  const isCore = tone === 'core';
  return (
    <View style={[styles.summaryPill, isPro ? styles.summaryPillPro : isCore ? styles.summaryPillCore : null]}>
      <AppText color={isPro ? colors.proOrangeText : isCore ? colors.tasklyBlue700 : colors.slate700} variant="caption">
        {label}
      </AppText>
      <AppText color={colors.navy900} variant="cardTitle">
        {String(value)}
      </AppText>
    </View>
  );
}

function StateCard({ label, message, tone }: { label: string; message: string; tone: 'core' | 'warning' }) {
  return (
    <AppCard accentColor={tone === 'warning' ? colors.warning600 : colors.tasklyBlue600}>
      <StatusBadge label={label} tone={tone} />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function PaymentUnlockCard({ item, onPress }: { item: CustomerPaymentsUnlocksItem; onPress: () => void }) {
  const isPro = item.kind === 'pro_access';
  const accent = isPro ? colors.proOrange500 : colors.tasklyBlue600;
  const tint = isPro ? colors.proOrange50 : colors.tasklyBlue50;
  const icon = isPro ? 'sparkles-outline' : 'receipt-outline';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <AppCard accentColor={accent}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: tint, borderColor: isPro ? colors.proOrangeBorder : colors.tasklyBlueBorder }]}>
            <Ionicons color={isPro ? colors.proOrangeText : colors.tasklyBlue700} name={icon} size={18} />
          </View>
          <View style={styles.cardTitleBlock}>
            <StatusBadge label={isPro ? t('proAccessUnlock') : t('taskPayment')} tone={isPro ? 'pro' : 'core'} />
            <AppText variant="cardTitle">{item.title}</AppText>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <MetaItem label={t('paymentStatus')} value={item.statusLabel} />
          <MetaItem label={t('paymentRecord')} value={item.amountLabel} />
          <MetaItem label={t('paymentDate')} value={formatDate(item.updatedAt || item.createdAt)} />
          {item.refundStatusLabel ? <MetaItem label={t('refundStatus')} value={item.refundStatusLabel} /> : null}
        </View>

        <View style={styles.openRow}>
          <AppText color={isPro ? colors.proOrangeText : colors.tasklyBlue700} variant="small">
            {t('openRelatedItem')}
          </AppText>
          <Ionicons color={isPro ? colors.proOrangeText : colors.tasklyBlue700} name="chevron-forward" size={16} />
        </View>
      </AppCard>
    </Pressable>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <AppText color={colors.slate500} variant="caption">
        {label}
      </AppText>
      <AppText color={colors.navy900} style={styles.metaValue}>
        {value}
      </AppText>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  cardTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  metaGrid: {
    gap: spacing.sm,
  },
  metaItem: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  openRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  pressed: {
    opacity: 0.88,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryPill: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  summaryPillCore: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  summaryPillPro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
});
