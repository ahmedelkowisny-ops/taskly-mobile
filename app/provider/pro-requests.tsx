import { useFocusEffect } from '@react-navigation/native';
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
        ? 'Login or Provider Workspace access is required.'
        : 'Could not load Pro request previews.',
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
          Approved Pros see requests based on approved categories and cities inside the Provider Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label="Loading" tone="pro" />
          <AppText variant="sectionTitle">Loading Pro request previews</AppText>
          <AppText color={colors.slate700}>Fetching read-only Pro matches from the backend.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Pro requests need Provider access' : 'Could not refresh Pro requests'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry or continue in demo mode while the backend is unavailable.'}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadProRequests} tone="pro" variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              Continue in demo mode
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
                <StatusBadge label={request.responseStatusLabel} tone={request.isEligibleToRespond ? 'warning' : 'neutral'} />
              </View>
              <AppText variant="sectionTitle">{request.title}</AppText>
              <AppText color={colors.slate700}>
                {request.categoryLabel} - {request.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>{request.timelineLabel}</AppText>
              <AppButton tone="pro" variant="outline">
                {request.nextAction.label}
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
        <StatusBadge label="Pro only" tone="pro" />
        <AppText color={colors.slate700}>
          Keep contact details inside Taskly until the allowed unlock/contact flow.
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body="Pro work uses approved categories and cities inside the Provider Workspace. It does not require Stripe verification for a Pro-only flow."
        title="Pro request guidance"
        tone="pro"
      />
    </Screen>
  );
}
