import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { createCustomerProAccessCheckout, getCustomerProRequestDetail } from '@/src/lib/api/customer';
import { CustomerProRequestDetailResponse, CustomerUnlockedProComparisonResponse } from '@/src/lib/api/domain';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockCustomerProRequestDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerProRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proRequestId?: string }>();
  const proRequestId = String(params.proRequestId || 'demo-pro-request');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerProRequestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingProAccessPayment, setIsStartingProAccessPayment] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [proAccessPaymentError, setProAccessPaymentError] = useState<string | null>(null);
  const [proAccessPaymentMessage, setProAccessPaymentMessage] = useState<string | null>(null);
  const [showProAccessConfirm, setShowProAccessConfirm] = useState(false);
  const [stateLabel, setStateLabel] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);

    if (status === 'demo') {
      setData(getMockCustomerProRequestDetailResponse(proRequestId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredProRequestDetail'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredProRequestDetail'));
      setIsLoading(false);
      return;
    }

    const result = await getCustomerProRequestDetail(proRequestId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? t('notFound') : result.status === 401 || result.status === 403 ? t('loginRequired') : t('backendUnavailable'));
    setMessage(result.status === 404 ? t('proRequestNotFound') : t('couldNotLoadProRequestDetail'));
  }, [getValidAccessToken, proRequestId, status]);

  const refreshAccessStatus = useCallback(async () => {
    setProAccessPaymentError(null);
    if (status === 'demo') {
      setData(getMockCustomerProRequestDetailResponse('demo-pro-unlocked'));
      setProAccessPaymentMessage(t('demoProAccessUnlocked'));
      return;
    }
    setProAccessPaymentMessage(t('paymentBeingConfirmed'));
    await loadDetail();
  }, [loadDetail, status]);

  const openProAccessConfirm = useCallback(() => {
    setProAccessPaymentError(null);
    setProAccessPaymentMessage(null);
    setShowProAccessConfirm(true);
  }, []);

  const startProAccessCheckout = useCallback(async () => {
    setProAccessPaymentError(null);
    setProAccessPaymentMessage(null);

    if (status === 'demo') {
      setData(getMockCustomerProRequestDetailResponse('demo-pro-unlocked'));
      setShowProAccessConfirm(false);
      setProAccessPaymentMessage(t('demoProAccessUnlocked'));
      return;
    }

    if (status !== 'authenticated') {
      setProAccessPaymentError(t('loginRequiredProRequestDetail'));
      return;
    }

    setIsStartingProAccessPayment(true);

    try {
      const authToken = await getValidAccessToken();
      if (!authToken) {
        setProAccessPaymentError(t('loginRequiredProRequestDetail'));
        return;
      }

      const result = await createCustomerProAccessCheckout(proRequestId, authToken);

      if (!result.ok) {
        setProAccessPaymentError(result.error.message || t('couldNotStartPayment'));
        return;
      }

      setData(result.data);
      setShowProAccessConfirm(false);

      if (result.data.alreadyUnlocked || result.data.proRequest.isUnlocked) {
        setProAccessPaymentMessage(t('accessUnlocked'));
        return;
      }

      if (!result.data.checkoutUrl) {
        setProAccessPaymentError(t('couldNotStartPayment'));
        return;
      }

      await WebBrowser.openBrowserAsync(result.data.checkoutUrl);
      setProAccessPaymentMessage(t('paymentBeingConfirmed'));
      await loadDetail();
    } catch {
      setProAccessPaymentError(t('couldNotStartPayment'));
    } finally {
      setIsStartingProAccessPayment(false);
    }
  }, [getValidAccessToken, loadDetail, proRequestId, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const request = data?.proRequest;

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppButton onPress={() => router.back()} variant="ghost">{t('back')}</AppButton>
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('loadingProRequestDetail')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} tone="pro" variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {request ? (
        <>
          <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <StatusBadge label={request.statusLabel} tone="pro" />
            <AppText variant="screenTitle">{request.title}</AppText>
            <AppText color={colors.slate700}>{request.description}</AppText>
            <AppText color={colors.slate700}>{request.categoryLabel} - {request.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={request.unlockStatusLabel} tone={request.isUnlocked ? 'success' : 'warning'} />
            <Info label={t('budget')} value={request.budgetLabel} />
            <Info label={t('timeline')} value={request.timelineLabel} />
            <Info label={t('responsesReceived')} value={String(request.responsesCount)} />
          </AppCard>

          <ProAccessCard
            isStartingPayment={isStartingProAccessPayment}
            onRefreshAccessStatus={refreshAccessStatus}
            onStartPayment={openProAccessConfirm}
            request={request}
          />

          {showProAccessConfirm ? (
            <ProAccessPaymentConfirmCard
              isStartingPayment={isStartingProAccessPayment}
              onCancel={() => setShowProAccessConfirm(false)}
              onConfirm={startProAccessCheckout}
              request={request}
            />
          ) : null}

          {proAccessPaymentMessage ? (
            <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
              <StatusBadge label={t('proAccessPayment')} tone="pro" />
              <AppText color={colors.slate700}>{proAccessPaymentMessage}</AppText>
              <AppButton onPress={refreshAccessStatus} tone="pro" variant="outline">{t('refreshAccessStatus')}</AppButton>
            </AppCard>
          ) : null}

          {proAccessPaymentError ? (
            <AppCard accentColor={colors.warning600}>
              <StatusBadge label={t('couldNotStartPayment')} tone="warning" />
              <AppText color={colors.slate700}>{proAccessPaymentError}</AppText>
              <AppButton onPress={openProAccessConfirm} tone="pro" variant="outline">{t('retry')}</AppButton>
            </AppCard>
          ) : null}

          <Images images={request.images} />

          <UnlockedComparisonSection request={request} />

          {!request.unlockedComparison?.canViewFullComparison ? (
            <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <AppText variant="sectionTitle">{t('proResponses')}</AppText>
            {request.responsePreviews.length ? request.responsePreviews.map((response) => (
              <View key={response.id} style={styles.response}>
                <StatusBadge label={response.statusLabel} tone={response.isLocked ? 'warning' : 'success'} />
                <AppText variant="bodyStrong">{response.proDisplayName}</AppText>
                <AppText color={colors.slate700}>{response.headline}</AppText>
                <AppText color={colors.slate700}>{response.roughQuoteLabel}</AppText>
              </View>
            )) : <AppText color={colors.slate700}>{t('noResponsesYet')}</AppText>}
            </AppCard>
          ) : null}

          <NextActions actions={request.nextActions} />
        </>
      ) : null}
    </Screen>
  );
}

function UnlockedComparisonSection({ request }: { request: CustomerProRequestDetailResponse['proRequest'] }) {
  const comparison = request.unlockedComparison;
  if (!comparison?.canViewFullComparison) return null;

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('proAccessUnlocked')} tone="success" />
        <StatusBadge label={comparison.comparisonLabel || t('fullComparison')} tone="pro" />
      </View>
      <AppText variant="sectionTitle">{t('compareApprovedPros')}</AppText>
      <AppText color={colors.slate700}>{comparison.helperText || t('comparisonChoiceHelper')}</AppText>
      {comparison.responses.length ? (
        <View style={styles.stack}>
          {comparison.responses.map((response) => (
            <ComparisonResponseCard key={response.responseId} response={response} />
          ))}
        </View>
      ) : (
        <AppText color={colors.slate700}>{comparison.emptyStateLabel || t('noVisibleProResponsesYet')}</AppText>
      )}
      <AppText color={colors.slate700}>{t('contactDetailsSharedWhenAllowed')}</AppText>
    </AppCard>
  );
}

function ComparisonResponseCard({ response }: { response: CustomerUnlockedProComparisonResponse }) {
  const profileImageUrl = response.profileImageUrl ? resolveApiMediaUrl(response.profileImageUrl) : null;
  const notes = [
    { label: t('whatIsIncluded'), value: response.includedNotes },
    { label: t('whatIsNotIncluded'), value: response.excludedNotes },
    { label: t('assumptions'), value: response.assumptions },
    { label: t('customerPreparation'), value: response.customerPreparationNotes },
  ].filter((item) => Boolean(item.value));

  return (
    <View style={styles.comparisonCard}>
      <View style={styles.profileRow}>
        {profileImageUrl ? (
          <Image
            accessibilityLabel={response.displayName}
            source={{ uri: profileImageUrl }}
            style={styles.profileImage}
          />
        ) : null}
        <View style={styles.profileText}>
          <AppText variant="bodyStrong">{response.displayName}</AppText>
          {response.tradeName ? <AppText color={colors.slate500}>{response.tradeName}</AppText> : null}
          <View style={styles.badgeRow}>
            <StatusBadge label={response.profileVerifiedLabel || t('reviewedByTaskly')} tone="success" />
            <StatusBadge label={response.independentProLabel || t('independentPro')} tone="pro" />
          </View>
        </View>
      </View>

      {response.profileSummary ? <AppText color={colors.slate700}>{response.profileSummary}</AppText> : null}
      {response.shortMessage ? <AppText color={colors.slate700}>{response.shortMessage}</AppText> : null}

      <View style={styles.infoGrid}>
        <Info label={t('roughQuote')} value={response.roughQuoteLabel} />
        <Info label={t('materialsIncluded')} value={response.materialsIncluded || t('toBeConfirmed')} />
        <Info label={t('siteVisit')} value={response.siteVisitPolicy || t('toBeConfirmed')} />
        <Info label={t('availability')} value={response.availability || t('toBeConfirmed')} />
        <Info label={t('earliestStart')} value={response.earliestStartDate || t('toBeConfirmed')} />
        <Info label={t('portfolio')} value={`${response.portfolioCount}`} />
      </View>

      {response.yearsExperienceLabel || response.categoryLabel || response.cityLabel ? (
        <AppText color={colors.slate500} variant="caption">
          {[response.yearsExperienceLabel, response.categoryLabel, response.cityLabel].filter(Boolean).join(' - ')}
        </AppText>
      ) : null}

      {notes.map((item) => (
        <View key={item.label} style={styles.noteBlock}>
          <AppText color={colors.slate500} variant="small">{item.label}</AppText>
          <AppText color={colors.slate700}>{String(item.value)}</AppText>
        </View>
      ))}

      <AppText color={colors.slate500} variant="caption">
        {response.contactPolicyLabel || t('contactDetailsSharedWhenAllowed')}
      </AppText>
    </View>
  );
}

function ProAccessCard({
  isStartingPayment,
  onRefreshAccessStatus,
  onStartPayment,
  request,
}: {
  isStartingPayment: boolean;
  onRefreshAccessStatus: () => void;
  onStartPayment: () => void;
  request: CustomerProRequestDetailResponse['proRequest'];
}) {
  const state = request.proAccessState;
  const nextActions = request.proAccessNextActions;
  const statusLabel = state?.statusLabel || request.unlockStatusLabel;
  const isUnlocked = Boolean(request.isUnlocked || nextActions?.canViewUnlockedResponses);
  const canStartPayment = Boolean(
    !isUnlocked &&
    nextActions?.canUnlockProResponses &&
    (nextActions.canPrepareProAccessPayment || nextActions.canRetryProAccessPayment),
  );

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('proAccess')} tone="pro" />
        <StatusBadge label={statusLabel} tone={isUnlocked ? 'success' : nextActions?.canUnlockProResponses ? 'pro' : 'warning'} />
      </View>
      <AppText variant="sectionTitle">{t('unlockAndComparePros')}</AppText>
      <AppText color={colors.slate700}>{t('postingIsFree')}</AppText>
      <AppText color={colors.slate700}>{request.proAccessSummary || state?.helperText || t('unlockAvailableAfterProResponses')}</AppText>
      <Info label={t('proAccessFee')} value={request.proAccessFeeLabel || request.proAccessPaymentState?.amountLabel || t('toBeConfirmed')} />
      <Info label={t('responsesReceived')} value={String(request.visiblePreviewResponseCount ?? request.responsesCount)} />
      <Info label={t('approvedPros')} value={String(request.meaningfulResponseCount ?? state?.meaningfulResponsesCount ?? 0)} />
      <Info label={t('comparisonState')} value={request.comparisonState?.statusLabel || (isUnlocked ? t('fullComparisonAvailable') : t('limitedPreviewsBeforeUnlock'))} />
      {request.proAccessBlockedReason ? (
        <AppText color={colors.warning600}>{request.proAccessBlockedReason}</AppText>
      ) : null}
      {canStartPayment ? (
        <AppButton loading={isStartingPayment} onPress={onStartPayment} tone="pro">
          {t('unlockAndComparePros')}
        </AppButton>
      ) : nextActions?.canUnlockProResponses ? (
        <AppText color={colors.slate700}>{t('paymentNotReadyYet')}</AppText>
      ) : null}
      <AppButton onPress={onRefreshAccessStatus} tone="pro" variant="outline">{t('refreshAccessStatus')}</AppButton>
      {isUnlocked ? (
        <AppText color={colors.slate700}>{request.unlockedResponseSummary || t('fullComparisonAvailable')}</AppText>
      ) : (
        <AppText color={colors.slate700}>{t('proAccessPaymentNotProject')}</AppText>
      )}
    </AppCard>
  );
}

function ProAccessPaymentConfirmCard({
  isStartingPayment,
  onCancel,
  onConfirm,
  request,
}: {
  isStartingPayment: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  request: CustomerProRequestDetailResponse['proRequest'];
}) {
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={t('secureCheckout')} tone="pro" />
      <AppText variant="sectionTitle">{t('proAccessPayment')}</AppText>
      <AppText color={colors.slate700}>{t('postingWasFree')}</AppText>
      <AppText color={colors.slate700}>{t('prosHaveResponded')}</AppText>
      <Info label={t('proAccessFee')} value={request.proAccessFeeLabel || request.proAccessPaymentState?.amountLabel || t('toBeConfirmed')} />
      <AppText color={colors.slate700}>{t('proAccessPaymentNotProject')}</AppText>
      <AppText color={colors.slate700}>{t('independentProsResponsible')}</AppText>
      <AppText color={colors.slate700}>{t('returnToTasklyAfterPayment')}</AppText>
      <View style={styles.stack}>
        <AppButton loading={isStartingPayment} onPress={onConfirm} tone="pro">{t('continueToSecurePayment')}</AppButton>
        <AppButton disabled={isStartingPayment} onPress={onCancel} tone="neutral" variant="outline">{t('cancel')}</AppButton>
      </View>
    </AppCard>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={label} tone="pro" />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{value}</AppText>
    </View>
  );
}

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <AppText variant="sectionTitle">{t('images')}</AppText>
      <View style={styles.imageGrid}>
        {images.map((image) => (
          <Image
            key={image.id}
            accessibilityLabel={image.alt}
            source={{ uri: resolveApiMediaUrl(image.url) }}
            style={styles.image}
          />
        ))}
      </View>
    </AppCard>
  );
}

function NextActions({ actions }: { actions: { label: string; type: string }[] }) {
  return (
    <AppCard>
      <AppText variant="sectionTitle">{t('nextSteps')}</AppText>
      {actions.map((action) => (
        <AppButton key={action.type} disabled tone="pro" variant="outline">{action.label}</AppButton>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  comparisonCard: {
    backgroundColor: colors.white,
    borderColor: colors.proAmber500,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  noteBlock: { gap: spacing.xs },
  profileImage: { backgroundColor: colors.proOrange50, borderRadius: 8, height: 56, width: 56 },
  profileRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  profileText: { flex: 1, gap: spacing.xs },
  response: { gap: spacing.xs },
  stack: { gap: spacing.sm },
});
