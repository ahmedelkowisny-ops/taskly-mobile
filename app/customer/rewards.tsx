import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { CustomerTopBar } from '@/src/components/taskly';
import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import type { CustomerRewardLedgerItem, CustomerRewardRedemptionItem, CustomerRewardsAction, CustomerRewardsResponse } from '@/src/lib/api/domain';
import { getCustomerRewards, submitCustomerRewardsAction } from '@/src/lib/api/rewards';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

const demoRewards: CustomerRewardsResponse = {
  availablePoints: 740,
  availableProAccessCredits: 1,
  cashRedemptionAmountCents: 2500,
  cashRedemptionCurrency: 'EUR',
  cashRedemptionPointsRequired: 2500,
  lifetimeEarnedPoints: 1230,
  pendingPoints: 250,
  proUnlockPointsCost: 490,
  progressToCashPayout: 30,
  redeemedPoints: 490,
  referralCode: 'TLY-DEMO54',
  referralLink: 'https://tasklyco.com/register?ref=TLY-DEMO54',
  referralStats: { qualified: 2, registered: 3 },
  recentLedgerEntries: [],
  recentRedemptions: [],
};

export default function CustomerRewardsScreen() {
  useI18n();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerRewardsResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<CustomerRewardsAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRewards = useCallback(async () => {
    setError(null);
    if (status === 'demo') {
      setData(demoRewards);
      return;
    }
    if (status !== 'authenticated') {
      setData(null);
      setError(t('loginRequired'));
      return;
    }

    setIsLoading(true);
    const token = await getValidAccessToken();
    const result = token ? await getCustomerRewards(token) : null;
    setIsLoading(false);

    if (result?.ok) {
      setData(result.data);
    } else {
      setData(null);
      setError(token ? t('couldNotLoadRewards') : t('loginRequired'));
    }
  }, [getValidAccessToken, status]);

  useFocusEffect(useCallback(() => {
    void loadRewards();
  }, [loadRewards]));

  async function handleCopy() {
    if (!data?.referralLink) return;
    setError(null);
    try {
      await Clipboard.setStringAsync(data.referralLink);
      setMessage(t('referralLinkCopied'));
    } catch {
      setError(t('couldNotCopyReferralLink'));
    }
  }

  async function handleShare() {
    if (!data?.referralLink) return;
    setError(null);
    try {
      await Share.share({ message: `${t('referralShareMessage')} ${data.referralLink}` });
    } catch {
      setError(t('couldNotShareReferralLink'));
    }
  }

  async function handleAction(action: CustomerRewardsAction) {
    if (!data) return;
    setError(null);
    setMessage(null);

    if (status === 'demo') {
      setMessage(t('rewardsDemoAction'));
      return;
    }

    const token = await getValidAccessToken();
    if (!token) {
      setError(t('loginRequired'));
      return;
    }

    setPendingAction(action);
    const result = await submitCustomerRewardsAction(action, token);
    setPendingAction(null);

    if (result.ok) {
      setData(result.data.rewards);
      setMessage(action === 'redeem_pro_unlock' ? t('freeProUnlockAdded') : t('cashRewardRequested'));
      return;
    }

    setError(result.error.code === 'NOT_ENOUGH_POINTS' ? t('notEnoughRewardPoints') : t('couldNotCompleteRewardsAction'));
  }

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <AppCard accentColor={colors.proOrange500} style={styles.hero}>
        <StatusBadge label="Taskly Rewards" tone="pro" />
        <AppText variant="screenTitle">{t('rewards')}</AppText>
        <AppText color={colors.slate700}>{t('customerRewardsSubtitle')}</AppText>
      </AppCard>

      {isLoading ? <StateCard label={t('loading')} body={t('rewards')} /> : null}
      {error ? (
        <AppCard accentColor={colors.warning600} style={styles.card}>
          <AppText color={colors.danger600}>{error}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadRewards} variant="outline">{t('retry')}</AppButton>
            {status !== 'authenticated' ? <AppButton onPress={useDemoSession} variant="outline">{t('continueDemoMode')}</AppButton> : null}
          </View>
        </AppCard>
      ) : null}
      {message ? <AppCard accentColor={colors.success600}><AppText color={colors.success600}>{message}</AppText></AppCard> : null}

      {data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard label={t('availableRewards')} value={formatPoints(data.availablePoints)} />
            <StatCard label={t('pendingRewardPoints')} value={formatPoints(data.pendingPoints)} />
            <StatCard label={t('lifetimeEarnedPoints')} value={formatPoints(data.lifetimeEarnedPoints)} />
            <StatCard label={t('redeemedRewardPoints')} value={formatPoints(data.redeemedPoints)} />
          </View>

          <AppCard accentColor={colors.tasklyBlue600} style={styles.card}>
            <AppText variant="cardTitle">{t('yourReferralLink')}</AppText>
            <AppText color={colors.slate700}>{t('referralRewardsHelper')}</AppText>
            <InfoBox label={t('referralCode')} value={data.referralCode} />
            <InfoBox label={t('referralLink')} value={data.referralLink} />
            <View style={styles.actions}>
              <AppButton onPress={handleCopy} style={styles.actionButton} variant="outline">{t('copyReferralLink')}</AppButton>
              <AppButton onPress={handleShare} style={styles.actionButton}>{t('shareInvite')}</AppButton>
            </View>
          </AppCard>

          <AppCard accentColor={colors.proOrange500} style={[styles.card, styles.proCard]}>
            <StatusBadge label={t('freeProUnlockCredits')} tone="pro" />
            <AppText style={styles.creditValue}>{data.availableProAccessCredits}</AppText>
            <AppText color={colors.slate700}>{t('freeProUnlockCreditsHelper')}</AppText>
            <AppText color={colors.slate700}>{`${formatPoints(data.proUnlockPointsCost)} ${t('rewardPoints')} = ${t('oneFreeProUnlock')}`}</AppText>
            <AppButton
              disabled={data.availablePoints < data.proUnlockPointsCost || pendingAction !== null}
              loading={pendingAction === 'redeem_pro_unlock'}
              onPress={() => handleAction('redeem_pro_unlock')}
              tone="pro">
              {t('redeemFreeProUnlock')}
            </AppButton>
          </AppCard>

          <AppCard style={styles.card}>
            <AppText variant="cardTitle">{t('cashRewardProgress')}</AppText>
            <AppText color={colors.slate700}>{t('cashRewardManualReview')}</AppText>
            <AppText variant="sectionTitle">{`${formatPoints(data.availablePoints)} / ${formatPoints(data.cashRedemptionPointsRequired)} ${t('rewardPoints')}`}</AppText>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, data.progressToCashPayout)}%` }]} /></View>
            <AppButton
              disabled={data.availablePoints < data.cashRedemptionPointsRequired || pendingAction !== null}
              loading={pendingAction === 'request_cash_redemption'}
              onPress={() => handleAction('request_cash_redemption')}
              variant="outline">
              {t('requestCashReward')}
            </AppButton>
          </AppCard>

          <AppCard style={styles.card}>
            <AppText variant="cardTitle">{t('referralStats')}</AppText>
            <View style={styles.actions}>
              <StatCard label={t('registeredReferrals')} value={data.referralStats.registered} />
              <StatCard label={t('qualifiedReferrals')} value={data.referralStats.qualified} />
            </View>
          </AppCard>

          <HistoryCard entries={data.recentLedgerEntries} />
          <RedemptionsCard entries={data.recentRedemptions} />

          <AppText color={colors.slate500} variant="small">{t('rewardsRulesNote')}</AppText>
        </>
      ) : null}

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function StateCard({ body, label }: { body: string; label: string }) {
  return <AppCard style={styles.card}><StatusBadge label={label} tone="core" /><AppText color={colors.slate700}>{body}</AppText></AppCard>;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return <View style={styles.statCard}><AppText color={colors.proOrangeText} variant="small">{label}</AppText><AppText variant="sectionTitle">{value}</AppText></View>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoBox}><AppText color={colors.tasklyBlue700} variant="small">{label}</AppText><AppText style={styles.breakText}>{value}</AppText></View>;
}

function HistoryCard({ entries }: { entries: CustomerRewardLedgerItem[] }) {
  return <AppCard style={styles.card}><AppText variant="cardTitle">{t('rewardHistory')}</AppText>{entries.length ? entries.map((entry) => <HistoryRow key={entry.id} label={getRewardReasonLabel(entry.reason)} meta={`${formatDate(entry.createdAt)} · ${formatReason(entry.status)}`} points={`${entry.direction === 'REDEEMED' ? '-' : '+'}${formatPoints(entry.points)}`} />) : <AppText color={colors.slate700}>{t('noRewardActivity')}</AppText>}</AppCard>;
}

function RedemptionsCard({ entries }: { entries: CustomerRewardRedemptionItem[] }) {
  return <AppCard style={styles.card}><AppText variant="cardTitle">{t('recentRedemptions')}</AppText>{entries.length ? entries.map((entry) => <HistoryRow key={entry.id} label={formatReason(entry.type)} meta={`${formatDate(entry.createdAt)} · ${formatReason(entry.status)}`} points={`-${formatPoints(entry.pointsCost)}`} />) : <AppText color={colors.slate700}>{t('noRewardRedemptions')}</AppText>}</AppCard>;
}

function HistoryRow({ label, meta, points }: { label: string; meta: string; points: string }) {
  return <View style={styles.historyRow}><View style={styles.historyText}><AppText variant="bodyStrong">{label}</AppText><AppText color={colors.slate500} variant="small">{meta}</AppText></View><AppText color={colors.proOrangeText} variant="bodyStrong">{points}</AppText></View>;
}

function formatReason(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRewardReasonLabel(reason: string) {
  if (reason === 'CUSTOMER_FIRST_CORE_TASK_COMPLETED') return t('rewardReasonFirstTaskCompleted');
  if (reason === 'CUSTOMER_FIRST_PRO_UNLOCK_PAID') return t('rewardReasonFirstProUnlock');
  if (reason === 'TASKER_FIRST_CORE_TASK_COMPLETED') return t('rewardReasonReferredTaskerFirstTask');
  if (reason === 'PRO_FIRST_VALID_RESPONSE_SUBMITTED') return t('rewardReasonReferredProFirstResponse');
  if (reason === 'FREE_PRO_UNLOCK') return t('freeProUnlockCredits');
  if (reason === 'CASH_25_EUR_REQUEST') return t('cashRewardProgress');
  return t('rewardActivity');
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatPoints(value: number) {
  return new Intl.NumberFormat().format(value);
}

const styles = StyleSheet.create({
  actionButton: { flex: 1, minWidth: 130 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  breakText: { flexShrink: 1 },
  card: { backgroundColor: colors.white, borderColor: colors.border, gap: spacing.md, ...designTokens.shadows.card },
  content: { backgroundColor: '#F4F7FA', gap: spacing.lg, paddingBottom: spacing.xxxl + 96, paddingTop: spacing.lg },
  creditValue: { color: colors.proOrange500, fontSize: 48, fontWeight: '900', lineHeight: 56 },
  hero: { backgroundColor: colors.white, borderColor: colors.proOrangeBorder, gap: spacing.sm },
  historyRow: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', padding: spacing.md },
  historyText: { flex: 1, gap: spacing.xs },
  infoBox: { backgroundColor: colors.white, borderColor: colors.tasklyBlueBorder, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  proCard: { backgroundColor: colors.proOrange50, borderColor: colors.proOrangeBorder },
  progressFill: { backgroundColor: colors.proOrange500, borderRadius: radius.pill, height: '100%' },
  progressTrack: { backgroundColor: colors.proOrangeBorder, borderRadius: radius.pill, height: 12, overflow: 'hidden' },
  statCard: { backgroundColor: colors.white, borderColor: colors.proOrangeBorder, borderRadius: radius.lg, borderWidth: 1, flex: 1, gap: spacing.xs, minWidth: 140, padding: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
