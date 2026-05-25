import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderProRequestsResponse } from '@/src/lib/api/domain';
import { getMockProviderProRequestsResponse } from '@/src/lib/api/mockApi';
import { getProviderProRequests } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderProRequestsScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProRequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadProRequests = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderProRequestsResponse());
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

    const result = await getProviderProRequests(authToken);

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
        : t('couldNotLoadProRequestPreviews'),
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProRequests();
    }, [loadProRequests]),
  );

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerPro" />
        <AppText variant="screenTitle">{t('proRequests')}</AppText>
        <AppText color={colors.slate700}>
          {t('providerProRequestsIntro')}
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label={t('loading')} tone="pro" />
          <AppText variant="sectionTitle">{t('loadingProRequestPreviews')}</AppText>
          <AppText color={colors.slate700}>{t('fetchingProMatches')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('proRequestsNeedProviderAccess') : t('couldNotRefreshProRequests')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={{ gap: spacing.sm }}>
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
        <View style={{ gap: spacing.md }}>
          {data.proRequests.map((request) => (
            <AppCard key={request.id} accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <StatusBadge label={request.statusLabel} tone="pro" />
                <StatusBadge
                  label={request.proResponseState?.badgeLabel || request.responseStatusLabel}
                  tone={getProResponseBadgeTone(request.proResponseState?.status)}
                />
              </View>
              <AppText variant="sectionTitle">{request.title}</AppText>
              <AppText color={colors.slate700}>
                {request.categoryLabel} - {request.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>{request.timelineLabel}</AppText>
              {request.proResponseState?.helperText ? (
                <AppText color={colors.slate700}>{request.proResponseState.helperText}</AppText>
              ) : null}
              <AppButton
                onPress={() => router.push(`/provider/pro-requests/${request.id}` as Href)}
                tone="pro"
                variant="outline">
                {t('viewDetails')}
              </AppButton>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          accent="pro"
          body={data.emptyState.description}
          title={data.emptyState.title}
        />
      ) : null}

      <AppCard accentColor={colors.proAmber500}>
        <StatusBadge label={t('proOnly')} tone="pro" />
        <AppText color={colors.slate700}>
          {t('keepContactDetailsInsideTaskly')}
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body={t('proRequestGuidanceBody')}
        title={t('proRequestGuidanceTitle')}
        tone="pro"
      />
    </Screen>
  );
}

function getProResponseBadgeTone(status?: string) {
  if (status === 'can_submit' || status === 'can_edit') return 'success';
  if (status === 'response_hidden' || status === 'profile_under_review') return 'warning';
  if (status === 'submitted_locked') return 'pro';
  return 'neutral';
}
