import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LanguageToggle, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getProviderDashboard } from '@/src/lib/api/provider';
import { ProviderDashboardResponse } from '@/src/lib/api/domain';
import { getMockProviderDashboardResponse } from '@/src/lib/api/mockApi';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderDashboardScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, session: authSession, status, useDemoSession } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const [data, setData] = useState<ProviderDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const summary = data?.summary;
  const displayName = summary?.displayName ?? authSession?.user.displayName ?? mockAuth.currentSession.displayName;
  const coreStatusLabel = (summary?.coreTaskerStatus ?? coreTaskerStatus) === 'approved' ? t('available') : t('providerProfileReviewing');
  const proStatusLabel = (summary?.proStatus ?? proStatus) === 'approved' ? t('available') : t('proProfileReview');

  const loadDashboard = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderDashboardResponse());
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

    const result = await getProviderDashboard(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? t('loginOrProviderAccessRequired')
        : t('couldNotRefreshProRequests'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <StatusBadge label={t('providerArea')} tone="neutral" />
        <LanguageToggle />
      </View>

      <View style={styles.header}>
        <AppText style={styles.screenTitle} variant="screenTitle">
          {t('providerArea')}
        </AppText>
        <AppText color={colors.slate700}>
          {t('welcomeName').replace('{name}', displayName)}. {t('providerStartBody')}
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label={t('loading')} tone="neutral" />
          <AppText variant="sectionTitle">{t('loadingProviderProDetail')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('loginOrProviderAccessRequired') : t('couldNotRefreshProRequests')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDashboard} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {summary ? (
        <AppCard accentColor={colors.navy900}>
          <AppText variant="sectionTitle">{t('providerReadyTitle')}</AppText>
          <View style={styles.metricsGrid}>
            <Metric label={t('available')} value={summary.availableCoreTasksCount} />
            <Metric label={t('activeShort')} value={summary.activeCoreTasksCount + summary.reservedCoreTasksCount} />
            <Metric label={t('tabPro')} value={summary.matchingProRequestsCount} />
            <Metric label={t('proResponsesShort')} value={summary.submittedProResponsesCount} />
          </View>
        </AppCard>
      ) : null}

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600} style={styles.panel}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">{t('coreTasks')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyTaskerBody')}</AppText>
          <StatusBadge label={coreStatusLabel} tone="core" />
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50} style={styles.panel}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('proRequests')}</AppText>
          <AppText color={colors.slate700}>{t('tasklyProProviderBody')}</AppText>
          <StatusBadge label={proStatusLabel} tone="pro" />
        </AppCard>
      </View>

      {data?.cards.length ? (
        <View style={styles.grid}>
          {data.cards.map((card) => (
            <AppCard
              key={card.id}
              accentColor={card.accent === 'pro' ? colors.proOrange600 : card.accent === 'warning' ? colors.warning600 : colors.tasklyBlue600}
              backgroundColor={card.accent === 'pro' ? colors.proOrange50 : colors.white}>
              <StatusBadge label={card.statusLabel} tone={card.accent === 'pro' ? 'pro' : card.accent === 'warning' ? 'warning' : 'core'} />
              <AppText variant="sectionTitle">{card.title}</AppText>
              <AppText color={colors.slate700}>{card.description}</AppText>
            </AppCard>
          ))}
        </View>
      ) : null}

      <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
        {t('startProviderWorkspace')}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  panel: {
    minHeight: 142,
  },
  screenTitle: {
    fontSize: 26,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText variant="sectionTitle">{value}</AppText>
    </View>
  );
}
