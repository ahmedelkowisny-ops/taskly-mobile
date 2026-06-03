import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, ModeBadge, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderProRequestsResponse } from '@/src/lib/api/domain';
import { getMockProviderProRequestsResponse } from '@/src/lib/api/mockApi';
import { getProviderProRequests } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { hasApprovedProMode } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderProRequestsScreen() {
  const router = useRouter();
  const { getValidAccessToken, session, status, useDemoSession } = useAuth();
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

    if (!hasApprovedProMode(session)) {
      setData(null);
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
  }, [getValidAccessToken, session, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProRequests();
    }, [loadProRequests]),
  );

  const canUsePro = status === 'demo' || hasApprovedProMode(session);

  if (!canUsePro && status !== 'loading') {
    return (
      <Screen>
        <ProviderTopBar />
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label={t('tasklyPro')} tone="pro" />
          <AppText variant="sectionTitle">{t('proAccessNeedsApprovalTitle')}</AppText>
          <AppText color={colors.slate700}>{t('proAccessNeedsApprovalBody')}</AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={() => router.push('/provider/pro-upsell' as Href)} tone="pro">
              {t('applyForTasklyPro')}
            </AppButton>
            <AppButton onPress={() => router.push('/provider/start' as Href)} tone="neutral" variant="outline">
              {t('reviewProviderSetup')}
            </AppButton>
          </View>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerPro" />
        <AppText variant="screenTitle">{t('matchingProRequests')}</AppText>
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
        <View style={styles.list}>
          {data.proRequests.map((request) => (
            <AppCard key={request.id} accentColor={colors.proOrange600} backgroundColor={colors.white}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <StatusBadge label={t('tasklyProRequest')} tone="pro" />
                  <StatusBadge label={request.statusLabel} tone="pro" />
                  <StatusBadge label={getResponseStatusLabel(request)} tone={getProResponseBadgeTone(request.proResponseState?.status)} />
                </View>
                <StatusBadge label={formatDateLabel(request.createdAt)} tone="neutral" />
              </View>

              <View style={styles.titleBlock}>
                <AppText variant="sectionTitle">{request.title}</AppText>
                <AppText color={colors.slate700}>{request.categoryLabel} - {request.cityLabel}</AppText>
              </View>

              <View style={styles.metaGrid}>
                <MetaPill label={t('timeline')} value={request.timelineLabel} />
                {request.budgetLabel ? <MetaPill label={t('budget')} value={request.budgetLabel} /> : null}
                <MetaPill label={t('photos')} value={request.photoCountLabel || t('noPhotosAttached')} />
                <MetaPill
                  label={t('siteVisit')}
                  value={request.siteVisitStatusLabel ? localizeProviderProLabel(request.siteVisitStatusLabel) : t('siteVisitUnavailable')}
                />
              </View>

              <View style={styles.statusPanel}>
                <View style={styles.badgeRow}>
                  {request.proResponseSummary ? (
                    <StatusBadge label={t('responseSent')} tone="success" />
                  ) : (
                    <StatusBadge label={t('waitingForYourResponse')} tone="warning" />
                  )}
                  {request.customerUnlockStatusLabel ? (
                    <StatusBadge label={localizeProviderProLabel(request.customerUnlockStatusLabel)} tone="neutral" />
                  ) : null}
                  {request.chatAvailabilityLabel && request.proChat?.capabilities.canRead ? (
                    <StatusBadge label={localizeProviderProLabel(request.chatAvailabilityLabel)} tone="pro" />
                  ) : null}
                </View>
                {request.proResponseSummary?.shortMessagePreview ? (
                  <AppText color={colors.slate700}>{request.proResponseSummary.shortMessagePreview}</AppText>
                ) : request.proResponseState?.helperText ? (
                  <AppText color={colors.slate700}>{request.proResponseState.helperText}</AppText>
                ) : null}
                {request.proResponseSummary?.roughQuoteLabel ? (
                  <AppText color={colors.proOrangeText} variant="bodyStrong">
                    {t('yourResponse')}: {request.proResponseSummary.roughQuoteLabel}
                  </AppText>
                ) : null}
                {request.proResponseSummary?.updatedAt ? (
                  <AppText color={colors.slate500} variant="small">
                    {t('responseUpdatedOn')}: {formatDateLabel(request.proResponseSummary.updatedAt)}
                  </AppText>
                ) : request.proResponseSummary?.submittedAt ? (
                  <AppText color={colors.slate500} variant="small">
                    {t('responseSubmittedOn')}: {formatDateLabel(request.proResponseSummary.submittedAt)}
                  </AppText>
                ) : null}
                {request.proResponseBlockedReason ? (
                  <AppText color={colors.warning600}>{request.proResponseBlockedReason}</AppText>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                {canOpenResponseCta(request) ? (
                  <AppButton
                    onPress={() => router.push(`/provider/pro-requests/${request.id}?respond=1` as Href)}
                    style={styles.actionButton}
                    tone="pro">
                    {request.proResponseCapabilities?.canEditResponse ? t('editResponse') : t('respond')}
                  </AppButton>
                ) : null}
                <AppButton
                  onPress={() => router.push(`/provider/pro-requests/${request.id}` as Href)}
                  style={styles.actionButton}
                  tone="pro"
                  variant={canOpenResponseCta(request) ? 'outline' : 'filled'}>
                  {t('viewDetails')}
                </AppButton>
              </View>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('noMatchingProRequestsTitle')}</AppText>
          <AppText color={colors.slate700}>{data.emptyState.description || t('noMatchingProRequestsBody')}</AppText>
        </AppCard>
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

type ProRequestCardModel = ProviderProRequestsResponse['proRequests'][number];

function canOpenResponseCta(request: ProRequestCardModel) {
  const capabilities = request.proResponseCapabilities || request.proResponseState?.capabilities;
  return Boolean(capabilities?.canOpenProResponseForm && (capabilities.canSubmitResponse || capabilities.canEditResponse));
}

function getResponseStatusLabel(request: ProRequestCardModel) {
  if (request.proResponseSummary) return t('responseSent');
  if (canOpenResponseCta(request)) return t('waitingForYourResponse');
  return request.proResponseState?.statusLabel || request.responseStatusLabel;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return t('notSpecified');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return t('notSpecified');
  return parsed.toLocaleDateString();
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.navy900} style={styles.metaValue} variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function getProResponseBadgeTone(status?: string) {
  if (status === 'can_submit' || status === 'can_edit') return 'success';
  if (status === 'response_hidden' || status === 'profile_under_review') return 'warning';
  if (status === 'submitted_locked') return 'pro';
  return 'neutral';
}

function localizeProviderProLabel(label: string) {
  switch (label) {
    case 'Customer unlocked comparison':
      return t('customerUnlockedComparison');
    case 'Customer has not unlocked yet':
      return t('customerHasNotUnlockedYet');
    case 'You are selected for this request':
      return t('youAreSelectedForThisRequest');
    case 'Not selected yet':
      return t('notSelectedYet');
    case 'Protected details available':
      return t('protectedDetailsAvailable');
    case 'Protected details hidden':
      return t('protectedDetailsHidden');
    case 'Address visible after selection':
      return t('addressVisibleAfterSelection');
    case 'Chat available':
      return t('chatAvailable');
    case 'Chat available after unlock':
      return t('chatAvailableAfterUnlock');
    case 'Site visit invited':
    case 'Invite received':
      return t('siteVisitInvited');
    case 'Site visit unavailable':
      return t('siteVisitUnavailable');
    default:
      return label;
  }
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  list: {
    gap: spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 74,
    padding: spacing.sm,
  },
  metaValue: {
    flexShrink: 1,
  },
  statusPanel: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  titleBlock: {
    gap: spacing.xs,
  },
});
