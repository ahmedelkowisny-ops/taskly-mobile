import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { EmptyStateCard, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import type { CustomerRewardLedgerItem, CustomerRewardRedemptionItem, CustomerRewardsResponse } from '@/src/lib/api/domain';
import { getProviderRewards } from '@/src/lib/api/rewards';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderRewardsScreen() {
  useI18n();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerRewardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRewards = useCallback(async () => {
    setErrorMessage(null);
    setMessage(null);

    if (status === 'demo') {
      setData(null);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setErrorMessage(t('loginRequired'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();
    const result = authToken ? await getProviderRewards(authToken) : null;
    setIsLoading(false);

    if (result?.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setErrorMessage(authToken ? t('couldNotLoadRewards') : t('loginRequired'));
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadRewards();
    }, [loadRewards]),
  );

  async function handleCopyReferralLink() {
    if (!data?.referralLink) return;

    setErrorMessage(null);
    setMessage(null);

    try {
      await Clipboard.setStringAsync(data.referralLink);
      setMessage(t('referralLinkCopied'));
    } catch {
      setErrorMessage(t('couldNotCopyReferralLink'));
    }
  }

  async function handleShareReferralLink() {
    if (!data?.referralLink) return;

    setErrorMessage(null);
    setMessage(null);

    try {
      await Share.share({ message: `${t('referralShareMessage')} ${data.referralLink}` });
    } catch {
      setErrorMessage(t('couldNotShareReferralLink'));
    }
  }

  const hasRewardData = Boolean(
    data &&
      (data.availablePoints > 0 ||
        data.pendingPoints > 0 ||
        data.lifetimeEarnedPoints > 0 ||
        data.redeemedPoints > 0 ||
        data.availableProAccessCredits > 0 ||
        data.recentLedgerEntries.length > 0 ||
        data.recentRedemptions.length > 0),
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <AppCard accentColor={colors.tasklyBlue600} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Ionicons color={colors.tasklyBlue600} name="gift-outline" size={22} />
          </View>
          <View style={styles.headerText}>
            <StatusBadge label="Taskly Rewards" tone="core" />
            <AppText variant="screenTitle">{t('rewards')}</AppText>
            <AppText color={colors.slate700}>{t('rewardsIntro')}</AppText>
          </View>
        </View>
      </AppCard>

      {isLoading ? <StateCard label={t('loading')} body={t('rewards')} /> : null}

      {errorMessage ? (
        <AppCard accentColor={colors.warning600} backgroundColor={colors.white} style={styles.card}>
          <StatusBadge label={status === 'authenticated' ? t('backendUnavailable') : t('loginRequired')} tone="warning" />
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadRewards} variant="outline">
              {t('retry')}
            </AppButton>
            {status !== 'authenticated' ? (
              <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
                {t('continueDemoMode')}
              </AppButton>
            ) : null}
          </View>
        </AppCard>
      ) : null}

      {message ? (
        <AppCard accentColor={colors.success600} backgroundColor={colors.white} style={styles.card}>
          <AppText color={colors.success600} variant="bodyStrong">{message}</AppText>
        </AppCard>
      ) : null}

      {data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard accent="success" label={t('availableRewards')} value={formatPoints(data.availablePoints)} />
            <StatCard label={t('pendingRewardPoints')} value={formatPoints(data.pendingPoints)} />
            <StatCard accent="success" label={t('lifetimeEarnedPoints')} value={formatPoints(data.lifetimeEarnedPoints)} />
            <StatCard label={t('redeemedRewardPoints')} value={formatPoints(data.redeemedPoints)} />
          </View>

          <AppCard accentColor={colors.tasklyBlue600} backgroundColor={colors.white} style={styles.card}>
            <AppText variant="cardTitle">{t('yourReferralLink')}</AppText>
            <AppText color={colors.slate700}>{t('referralRewardsHelper')}</AppText>
            {data.referralCode ? <InfoBox label={t('referralCode')} value={data.referralCode} /> : null}
            {data.referralLink ? <InfoBox label={t('referralLink')} value={data.referralLink} /> : null}
            {data.referralLink ? (
              <View style={styles.actions}>
                <AppButton onPress={handleCopyReferralLink} style={styles.actionButton} variant="outline">
                  {t('copyReferralLink')}
                </AppButton>
                <AppButton onPress={handleShareReferralLink} style={styles.actionButton}>
                  {t('shareInvite')}
                </AppButton>
              </View>
            ) : null}
          </AppCard>

          {data.availableProAccessCredits > 0 ? (
            <AppCard accentColor={colors.proOrange500} backgroundColor={colors.proOrange50} style={styles.card}>
              <StatusBadge label={t('freeProUnlockCredits')} tone="pro" />
              <AppText style={styles.creditValue}>{data.availableProAccessCredits}</AppText>
              <AppText color={colors.slate700}>{t('freeProUnlockCreditsHelper')}</AppText>
            </AppCard>
          ) : null}

          <AppCard backgroundColor={colors.white} style={styles.card}>
            <AppText variant="cardTitle">{t('referralStats')}</AppText>
            <View style={styles.actions}>
              <StatCard label={t('registeredReferrals')} value={data.referralStats.registered} />
              <StatCard accent="success" label={t('qualifiedReferrals')} value={data.referralStats.qualified} />
            </View>
          </AppCard>

          <HistoryCard entries={data.recentLedgerEntries} />
          <RedemptionsCard entries={data.recentRedemptions} />

          {!hasRewardData ? (
            <EmptyStateCard
              body={t('providerRewardsEmptyBody')}
              icon="gift-outline"
              title={t('noRewardsYet')}
            />
          ) : null}

          <AppText color={colors.slate500} variant="small">{t('rewardsRulesNote')}</AppText>
        </>
      ) : null}

      {!isLoading && !errorMessage && !data ? (
        <EmptyStateCard
          body={status === 'demo' ? t('providerRewardsDemoBody') : t('providerRewardsEmptyBody')}
          icon="gift-outline"
          title={t('noRewardsYet')}
        />
      ) : null}
    </Screen>
  );
}

function StateCard({ body, label }: { body: string; label: string }) {
  return (
    <AppCard backgroundColor={colors.white} style={styles.card}>
      <StatusBadge label={label} tone="core" />
      <AppText color={colors.slate700}>{body}</AppText>
    </AppCard>
  );
}

function StatCard({
  accent = 'blue',
  label,
  value,
}: {
  accent?: 'blue' | 'success';
  label: string;
  value: number | string;
}) {
  const color = accent === 'success' ? colors.success600 : colors.tasklyBlue700;
  const backgroundColor = accent === 'success' ? colors.success50 : colors.tasklyBlue50;
  const borderColor = accent === 'success' ? '#BBF7D0' : colors.tasklyBlueBorder;

  return (
    <View style={[styles.statCard, { backgroundColor, borderColor }]}>
      <AppText color={color} variant="small">{label}</AppText>
      <AppText color={colors.navy900} variant="sectionTitle">{value}</AppText>
    </View>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <AppText color={colors.tasklyBlue700} variant="small">{label}</AppText>
      <AppText style={styles.breakText}>{value}</AppText>
    </View>
  );
}

function HistoryCard({ entries }: { entries: CustomerRewardLedgerItem[] }) {
  return (
    <AppCard backgroundColor={colors.white} style={styles.card}>
      <AppText variant="cardTitle">{t('rewardHistory')}</AppText>
      {entries.length ? (
        <View style={styles.historyList}>
          {entries.map((entry) => (
            <HistoryRow
              key={entry.id}
              accent={getRewardAccent(entry)}
              label={getRewardReasonLabel(entry.reason)}
              meta={`${formatDate(entry.createdAt)} - ${formatReason(entry.status)}`}
              points={`${entry.direction === 'REDEEMED' ? '-' : '+'}${formatPoints(entry.points)}`}
            />
          ))}
        </View>
      ) : (
        <AppText color={colors.slate700}>{t('noRewardActivity')}</AppText>
      )}
    </AppCard>
  );
}

function RedemptionsCard({ entries }: { entries: CustomerRewardRedemptionItem[] }) {
  return (
    <AppCard backgroundColor={colors.white} style={styles.card}>
      <AppText variant="cardTitle">{t('recentRedemptions')}</AppText>
      {entries.length ? (
        <View style={styles.historyList}>
          {entries.map((entry) => (
            <HistoryRow
              key={entry.id}
              accent={entry.type.includes('PRO') ? 'pro' : 'blue'}
              label={formatReason(entry.type)}
              meta={`${formatDate(entry.createdAt)} - ${formatReason(entry.status)}`}
              points={`-${formatPoints(entry.pointsCost)}`}
            />
          ))}
        </View>
      ) : (
        <AppText color={colors.slate700}>{t('noRewardRedemptions')}</AppText>
      )}
    </AppCard>
  );
}

function HistoryRow({
  accent,
  label,
  meta,
  points,
}: {
  accent: 'blue' | 'pro' | 'success';
  label: string;
  meta: string;
  points: string;
}) {
  const color =
    accent === 'pro'
      ? colors.proOrangeTextDark
      : accent === 'success'
        ? colors.success600
        : colors.tasklyBlue700;

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyText}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText color={colors.slate500} variant="small">{meta}</AppText>
      </View>
      <AppText color={color} variant="bodyStrong">{points}</AppText>
    </View>
  );
}

function getRewardAccent(entry: CustomerRewardLedgerItem): 'blue' | 'pro' | 'success' {
  if (entry.reason.includes('PRO') || entry.sourceType.includes('PRO')) return 'pro';
  if (entry.direction === 'EARNED' || entry.direction === 'ADJUSTED') return 'success';
  return 'blue';
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
  actionButton: {
    flex: 1,
    minWidth: 130,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  breakText: {
    flexShrink: 1,
  },
  card: {
    ...designTokens.shadows.card,
    borderColor: colors.border,
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl + 96,
    paddingTop: spacing.lg,
  },
  creditValue: {
    color: colors.proOrange500,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
  },
  emptyBody: {
    lineHeight: 21,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  historyText: {
    flex: 1,
    gap: spacing.xs,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  infoBox: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  statCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minWidth: 140,
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
