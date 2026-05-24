import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerProRequests } from '@/src/lib/api/customer';
import { CustomerProRequestsResponse } from '@/src/lib/api/domain';
import { getMockCustomerProRequestsResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerProRequestsScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerProRequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        ? 'Login is required to load your Pro requests.'
        : 'Could not load your Pro requests.',
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
        <ModeBadge mode="customer" />
        <StatusBadge label="Customer Pro" tone="pro" />
        <AppText variant="screenTitle">{t('myProRequests')}</AppText>
        <AppText color={colors.slate700}>
          Start larger professional projects from the Customer Workspace and compare Pro responses only when the backend allows it.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label="Loading" tone="pro" />
          <AppText variant="sectionTitle">Loading Pro requests</AppText>
          <AppText color={colors.slate700}>Fetching your read-only Pro request list from Taskly.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Pro requests need a real session' : 'Could not refresh Pro requests'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry the request or continue in demo mode while the backend is unavailable.'}
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
                <StatusBadge label={`${request.responsesCount} responses`} tone={request.isUnlocked ? 'success' : 'warning'} />
              </View>
              <AppText variant="sectionTitle">{request.title}</AppText>
              <AppText color={colors.slate700}>
                {request.categoryLabel} - {request.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>
                {request.timelineLabel} - {request.unlockStatusLabel}
              </AppText>
              <AppButton
                onPress={() => router.push(`/customer/pro-requests/${request.id}` as Href)}
                tone="pro"
                variant="outline">
                View details
              </AppButton>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          actionLabel={t('postProRequest')}
          accent="pro"
          body={data.emptyState.description}
          onActionPress={() => router.push('/customer/post-pro-request' as Href)}
          title={data.emptyState.title}
        />
      ) : null}

      <AssistantGuideCard
        body="Provider contact details stay hidden until the allowed unlock/contact flow."
        title={t('unlockAndComparePros')}
        tone="pro"
      />
    </Screen>
  );
}
