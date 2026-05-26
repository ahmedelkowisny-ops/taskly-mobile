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
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <StatusBadge label={t('customerPro')} tone="pro" />
        <AppText variant="screenTitle">{t('myProRequests')}</AppText>
        <AppText color={colors.slate700}>
          {t('customerProIntro')}
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label={t('loading')} tone="pro" />
          <AppText variant="sectionTitle">{t('loadingProRequests')}</AppText>
          <AppText color={colors.slate700}>{t('fetchingCustomerProRequests')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('proRequestsNeedRealSession') : t('couldNotRefreshProRequests')}
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
              <AppText variant="sectionTitle">{request.title}</AppText>
              <AppText color={colors.slate700}>
                {request.categoryLabel} - {request.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>
                {request.timelineLabel} - {request.responsePreviewSummary || `${request.responsesCount} ${t('responsesReceived')}`}
              </AppText>
              <AppText color={colors.slate700}>
                {request.proAccessSummary || request.unlockStatusLabel}
              </AppText>
              <AppButton
                onPress={() => router.push(`/customer/pro-requests/${request.id}` as Href)}
                tone="pro"
                variant="outline">
                {t('viewDetails')}
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
        body={t('providerContactHiddenUntilUnlock')}
        title={t('unlockAndComparePros')}
        tone="pro"
      />
    </Screen>
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
