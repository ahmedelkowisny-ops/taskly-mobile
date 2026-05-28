import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { FormField } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  cancelCustomerProSiteVisitInvite,
  createCustomerProAccessCheckout,
  createCustomerProSiteVisitInvite,
  getCustomerProRequestDetail,
  requestCustomerProAccessSupport,
} from '@/src/lib/api/customer';
import { CustomerProAccessSupportRequestPayload, CustomerProRequestDetailResponse, CustomerUnlockedProComparisonResponse, ProAccessSupportIssueType } from '@/src/lib/api/domain';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import {
  cancelMockCustomerProSiteVisitInvite,
  createMockCustomerProSiteVisitInvite,
  getMockCustomerProRequestDetailResponse,
  requestMockCustomerProAccessSupport,
} from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type CustomerSiteVisitFormValues = {
  accessNotes: string;
  message: string;
  preferredDate: string;
  preferredTimeWindow: string;
};

type CustomerSiteVisitFormErrors = Partial<Record<keyof CustomerSiteVisitFormValues | 'form', string>>;
type CustomerProAccessSupportFormValues = {
  details: string;
  issueType: ProAccessSupportIssueType;
  reason: string;
};

type CustomerProAccessSupportFormErrors = Partial<Record<keyof CustomerProAccessSupportFormValues | 'form', string>>;

const emptyCustomerSiteVisitForm: CustomerSiteVisitFormValues = {
  accessNotes: '',
  message: '',
  preferredDate: '',
  preferredTimeWindow: '',
};

const proAccessSupportIssueOptions: { labelKey: Parameters<typeof t>[0]; value: ProAccessSupportIssueType }[] = [
  { labelKey: 'noUsefulResponses', value: 'no_useful_responses' },
  { labelKey: 'responseQualityIssue', value: 'response_quality_issue' },
  { labelKey: 'proCancelledOrNoShow', value: 'pro_cancelled_or_no_show' },
  { labelKey: 'paymentProblem', value: 'payment_problem' },
  { labelKey: 'accidentalPayment', value: 'accidental_payment' },
  { labelKey: 'other', value: 'other' },
];

const emptyProAccessSupportForm: CustomerProAccessSupportFormValues = {
  details: '',
  issueType: 'other',
  reason: '',
};

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
  const [showProAccessSupportForm, setShowProAccessSupportForm] = useState(false);
  const [proAccessSupportError, setProAccessSupportError] = useState<string | null>(null);
  const [proAccessSupportFormErrors, setProAccessSupportFormErrors] = useState<CustomerProAccessSupportFormErrors>({});
  const [proAccessSupportFormValues, setProAccessSupportFormValues] = useState<CustomerProAccessSupportFormValues>(emptyProAccessSupportForm);
  const [proAccessSupportNotice, setProAccessSupportNotice] = useState<string | null>(null);
  const [isSubmittingProAccessSupport, setIsSubmittingProAccessSupport] = useState(false);
  const [siteVisitActionError, setSiteVisitActionError] = useState<string | null>(null);
  const [siteVisitFormErrors, setSiteVisitFormErrors] = useState<CustomerSiteVisitFormErrors>({});
  const [siteVisitFormResponse, setSiteVisitFormResponse] = useState<CustomerUnlockedProComparisonResponse | null>(null);
  const [siteVisitFormValues, setSiteVisitFormValues] = useState<CustomerSiteVisitFormValues>(emptyCustomerSiteVisitForm);
  const [siteVisitNotice, setSiteVisitNotice] = useState<string | null>(null);
  const [isUpdatingSiteVisit, setIsUpdatingSiteVisit] = useState(false);
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

  const openProAccessSupportForm = useCallback(() => {
    setProAccessSupportError(null);
    setProAccessSupportNotice(null);
    setProAccessSupportFormErrors({});
    setProAccessSupportFormValues({
      ...emptyProAccessSupportForm,
      issueType: data?.proRequest.proAccessPaymentState?.status === 'failed' ? 'payment_problem' : 'other',
    });
    setShowProAccessSupportForm(true);
  }, [data?.proRequest.proAccessPaymentState?.status]);

  const closeProAccessSupportForm = useCallback(() => {
    setShowProAccessSupportForm(false);
    setProAccessSupportFormErrors({});
  }, []);

  const updateProAccessSupportFormValue = useCallback(<Key extends keyof CustomerProAccessSupportFormValues>(
    key: Key,
    value: CustomerProAccessSupportFormValues[Key],
  ) => {
    setProAccessSupportFormValues((current) => ({ ...current, [key]: value }));
    setProAccessSupportFormErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }, []);

  const submitProAccessSupportRequest = useCallback(async () => {
    const errors = validateProAccessSupportForm(proAccessSupportFormValues);
    if (Object.keys(errors).length > 0) {
      setProAccessSupportFormErrors(errors);
      return;
    }

    const payload: CustomerProAccessSupportRequestPayload = {
      details: proAccessSupportFormValues.details.trim(),
      issueType: proAccessSupportFormValues.issueType,
      reason: proAccessSupportFormValues.reason.trim(),
    };

    setIsSubmittingProAccessSupport(true);
    setProAccessSupportError(null);
    setProAccessSupportNotice(null);

    if (status === 'demo') {
      setData(requestMockCustomerProAccessSupport(proRequestId, payload));
      setIsSubmittingProAccessSupport(false);
      setShowProAccessSupportForm(false);
      setProAccessSupportNotice(t('requestSubmitted'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsSubmittingProAccessSupport(false);
      setProAccessSupportFormErrors({ form: t('loginRequired') });
      return;
    }

    const result = await requestCustomerProAccessSupport(proRequestId, payload, authToken);
    setIsSubmittingProAccessSupport(false);

    if (result.ok) {
      setData(result.data);
      setShowProAccessSupportForm(false);
      setProAccessSupportNotice(result.data.message || t('requestSubmitted'));
      return;
    }

    setProAccessSupportFormErrors(getProAccessSupportErrorMessages(result.error.details, result.error.message));
    setProAccessSupportError(result.error.message || t('couldNotSubmitRequest'));
  }, [getValidAccessToken, proAccessSupportFormValues, proRequestId, status]);

  const openSiteVisitInvite = useCallback((response: CustomerUnlockedProComparisonResponse) => {
    setSiteVisitActionError(null);
    setSiteVisitNotice(null);
    setSiteVisitFormErrors({});
    setSiteVisitFormResponse(response);
    setSiteVisitFormValues(emptyCustomerSiteVisitForm);
  }, []);

  const closeSiteVisitInvite = useCallback(() => {
    setSiteVisitFormResponse(null);
    setSiteVisitFormErrors({});
  }, []);

  const updateSiteVisitFormValue = useCallback(<Key extends keyof CustomerSiteVisitFormValues>(
    key: Key,
    value: CustomerSiteVisitFormValues[Key],
  ) => {
    setSiteVisitFormValues((current) => ({ ...current, [key]: value }));
    setSiteVisitFormErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }, []);

  const submitSiteVisitInvite = useCallback(async () => {
    if (!siteVisitFormResponse) return;
    const errors = validateCustomerSiteVisitForm(siteVisitFormValues);
    if (Object.keys(errors).length > 0) {
      setSiteVisitFormErrors(errors);
      return;
    }

    setSiteVisitActionError(null);
    setSiteVisitNotice(null);
    setIsUpdatingSiteVisit(true);

    if (status === 'demo') {
      setData(createMockCustomerProSiteVisitInvite(proRequestId, siteVisitFormResponse.responseId));
      setIsUpdatingSiteVisit(false);
      setSiteVisitFormResponse(null);
      setSiteVisitNotice(t('siteVisitInviteSent'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsUpdatingSiteVisit(false);
      setSiteVisitFormErrors({ form: t('loginRequired') });
      return;
    }

    const result = await createCustomerProSiteVisitInvite(
      proRequestId,
      {
        accessNotes: siteVisitFormValues.accessNotes.trim(),
        addressConfirmation: true,
        message: siteVisitFormValues.message.trim(),
        preferredDate: siteVisitFormValues.preferredDate.trim() || null,
        preferredTimeWindow: siteVisitFormValues.preferredTimeWindow.trim(),
        proResponseId: siteVisitFormResponse.responseId,
      },
      authToken,
    );
    setIsUpdatingSiteVisit(false);

    if (result.ok) {
      setData(result.data);
      setSiteVisitFormResponse(null);
      setSiteVisitNotice(t('siteVisitInviteSent'));
      return;
    }

    setSiteVisitFormErrors(getCustomerSiteVisitErrorMessages(result.error.details, result.error.message));
  }, [getValidAccessToken, proRequestId, siteVisitFormResponse, siteVisitFormValues, status]);

  const cancelSiteVisitInvite = useCallback(async () => {
    const request = data?.proRequest;
    const invite = request?.siteVisitInvites?.find((item) => item.status === 'invited' || item.status === 'alternate_time_proposed');
    if (!invite) return;

    setSiteVisitActionError(null);
    setSiteVisitNotice(null);
    setIsUpdatingSiteVisit(true);

    if (status === 'demo') {
      setData(cancelMockCustomerProSiteVisitInvite(proRequestId));
      setIsUpdatingSiteVisit(false);
      setSiteVisitNotice(t('siteVisitCancelled'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsUpdatingSiteVisit(false);
      setSiteVisitActionError(t('loginRequired'));
      return;
    }

    const result = await cancelCustomerProSiteVisitInvite(proRequestId, invite.id, {}, authToken);
    setIsUpdatingSiteVisit(false);

    if (result.ok) {
      setData(result.data);
      setSiteVisitNotice(t('siteVisitCancelled'));
      return;
    }

    setSiteVisitActionError(result.error.message || t('couldNotUpdateSiteVisit'));
  }, [data?.proRequest, getValidAccessToken, proRequestId, status]);

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
        <AppButton onPress={() => router.back()} variant="ghost">{t('back')}</AppButton>
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('loadingProRequestDetail')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || t('currentStatus')} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} tone="pro" variant="outline">{t('retry')}</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
          </View>
        </AppCard>
      ) : null}

      {request ? (
        <>
          <ProDetailHero request={request} />

          <ProjectSummaryCard request={request} />

          <ProAccessCard
            isStartingPayment={isStartingProAccessPayment}
            onRefreshAccessStatus={refreshAccessStatus}
            onStartPayment={openProAccessConfirm}
            request={request}
          />

          <ProAccessSupportCard
            onOpenSupport={openProAccessSupportForm}
            request={request}
          />

          {showProAccessSupportForm ? (
            <ProAccessSupportRequestForm
              errors={proAccessSupportFormErrors}
              isSubmitting={isSubmittingProAccessSupport}
              onCancel={closeProAccessSupportForm}
              onChange={updateProAccessSupportFormValue}
              onSubmit={submitProAccessSupportRequest}
              values={proAccessSupportFormValues}
            />
          ) : null}

          {proAccessSupportNotice ? (
            <AppCard accentColor={colors.success600} backgroundColor={colors.success50}>
              <StatusBadge label={t('requestSubmitted')} tone="success" />
              <AppText color={colors.slate700}>{t('tasklyWillReviewProAccessRequest')}</AppText>
              <AppText color={colors.slate700}>{t('refundNotGuaranteed')}</AppText>
            </AppCard>
          ) : null}

          {proAccessSupportError && !showProAccessSupportForm ? (
            <AppCard accentColor={colors.warning600}>
              <StatusBadge label={t('couldNotSubmitRequest')} tone="warning" />
              <AppText color={colors.slate700}>{proAccessSupportError}</AppText>
            </AppCard>
          ) : null}

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

          <UnlockedComparisonSection onInviteForSiteVisit={openSiteVisitInvite} request={request} />

          {siteVisitFormResponse ? (
            <CustomerSiteVisitInviteForm
              errors={siteVisitFormErrors}
              isSubmitting={isUpdatingSiteVisit}
              onCancel={closeSiteVisitInvite}
              onChange={updateSiteVisitFormValue}
              onSubmit={submitSiteVisitInvite}
              response={siteVisitFormResponse}
              values={siteVisitFormValues}
            />
          ) : null}

          {siteVisitNotice ? (
            <AppCard accentColor={colors.success600} backgroundColor={colors.success50}>
              <StatusBadge label={siteVisitNotice} tone="success" />
              <AppText color={colors.slate700}>{t('siteVisitOnlyNotFinalAgreement')}</AppText>
            </AppCard>
          ) : null}

          {siteVisitActionError ? (
            <AppCard accentColor={colors.warning600}>
              <StatusBadge label={t('couldNotUpdateSiteVisit')} tone="warning" />
              <AppText color={colors.slate700}>{siteVisitActionError}</AppText>
            </AppCard>
          ) : null}

          <SiteVisitStateCard isUpdating={isUpdatingSiteVisit} onCancelInvite={cancelSiteVisitInvite} request={request} />

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

function ProDetailHero({ request }: { request: CustomerProRequestDetailResponse['proRequest'] }) {
  return (
    <View style={styles.proHero}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('tasklyPro')} tone="pro" />
        <StatusBadge label={request.statusLabel} tone="pro" />
        <StatusBadge label={request.unlockStatusLabel} tone={request.isUnlocked ? 'success' : 'warning'} />
      </View>
      <AppText style={styles.heroTitle}>{request.title}</AppText>
      <AppText color={colors.slate700}>{request.description}</AppText>
      <View style={styles.heroChipRow}>
        <View style={styles.heroChip}>
          <AppText color={colors.proOrangeTextDark} variant="small">{request.categoryLabel}</AppText>
        </View>
        <View style={styles.heroChip}>
          <AppText color={colors.proOrangeTextDark} variant="small">{request.cityLabel}</AppText>
        </View>
        <View style={styles.heroChip}>
          <AppText color={colors.proOrangeTextDark} variant="small">{request.budgetLabel}</AppText>
        </View>
      </View>
    </View>
  );
}

function ProjectSummaryCard({ request }: { request: CustomerProRequestDetailResponse['proRequest'] }) {
  const locationValue = request.addressVisibilityState?.stateLabel || request.cityLabel;
  const photoValue = request.images.length ? String(request.images.length) : t('noPhotosAdded');

  return (
    <AppCard>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('projectSummary')} tone="pro" />
        <StatusBadge label={request.proAccessState?.statusLabel || request.unlockStatusLabel} tone={request.isUnlocked ? 'success' : 'pro'} />
      </View>
      <View style={styles.infoGrid}>
        <Info label={t('category')} value={request.categoryLabel} />
        <Info label={t('locationPrivacy')} value={locationValue} />
        <Info label={t('budget')} value={request.budgetLabel} />
        <Info label={t('timeline')} value={request.timelineLabel} />
        <Info label={t('responsesReceived')} value={String(request.responsesCount)} />
        <Info label={t('photos')} value={photoValue} />
      </View>
    </AppCard>
  );
}

function UnlockedComparisonSection({
  onInviteForSiteVisit,
  request,
}: {
  onInviteForSiteVisit: (response: CustomerUnlockedProComparisonResponse) => void;
  request: CustomerProRequestDetailResponse['proRequest'];
}) {
  const comparison = request.unlockedComparison;
  if (!comparison?.canViewFullComparison) return null;
  const canInvite = Boolean(request.siteVisitNextActions?.canInviteForSiteVisit);

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
            <ComparisonResponseCard
              canInviteForSiteVisit={canInvite}
              key={response.responseId}
              onInviteForSiteVisit={onInviteForSiteVisit}
              response={response}
            />
          ))}
        </View>
      ) : (
        <AppText color={colors.slate700}>{comparison.emptyStateLabel || t('noVisibleProResponsesYet')}</AppText>
      )}
      <AppText color={colors.slate700}>{t('contactDetailsSharedWhenAllowed')}</AppText>
    </AppCard>
  );
}

function ComparisonResponseCard({
  canInviteForSiteVisit,
  onInviteForSiteVisit,
  response,
}: {
  canInviteForSiteVisit: boolean;
  onInviteForSiteVisit: (response: CustomerUnlockedProComparisonResponse) => void;
  response: CustomerUnlockedProComparisonResponse;
}) {
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
      {canInviteForSiteVisit ? (
        <AppButton onPress={() => onInviteForSiteVisit(response)} tone="pro" variant="outline">
          {t('inviteForSiteVisit')}
        </AppButton>
      ) : null}
    </View>
  );
}

function CustomerSiteVisitInviteForm({
  errors,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  response,
  values,
}: {
  errors: CustomerSiteVisitFormErrors;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <Key extends keyof CustomerSiteVisitFormValues>(key: Key, value: CustomerSiteVisitFormValues[Key]) => void;
  onSubmit: () => void;
  response: CustomerUnlockedProComparisonResponse;
  values: CustomerSiteVisitFormValues;
}) {
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={t('inviteForSiteVisit')} tone="pro" />
      <AppText variant="sectionTitle">{response.displayName}</AppText>
      <AppText color={colors.slate700}>{t('siteVisitOnlyNotFinalAgreement')}</AppText>
      <AppText color={colors.slate700}>{t('contactDetailsSharedWhenAllowed')}</AppText>
      {errors.form ? <AppText color={colors.danger600}>{errors.form}</AppText> : null}
      <FormField
        errorText={errors.preferredDate}
        label={t('preferredDate')}
        onChangeText={(value) => onChange('preferredDate', value)}
        placeholder="2026-06-15"
        value={values.preferredDate}
      />
      <FormField
        errorText={errors.preferredTimeWindow}
        label={t('timeWindow')}
        onChangeText={(value) => onChange('preferredTimeWindow', value)}
        placeholder={t('preferredTime')}
        value={values.preferredTimeWindow}
      />
      <FormField
        errorText={errors.message}
        label={t('messageToPro')}
        multiline
        onChangeText={(value) => onChange('message', value)}
        value={values.message}
      />
      <FormField
        errorText={errors.accessNotes}
        label={t('accessNotes')}
        multiline
        onChangeText={(value) => onChange('accessNotes', value)}
        value={values.accessNotes}
      />
      <View style={styles.stack}>
        <AppButton loading={isSubmitting} onPress={onSubmit} tone="pro">{t('sendSiteVisitInvite')}</AppButton>
        <AppButton disabled={isSubmitting} onPress={onCancel} tone="neutral" variant="ghost">{t('cancel')}</AppButton>
      </View>
    </AppCard>
  );
}

function SiteVisitStateCard({
  isUpdating,
  onCancelInvite,
  request,
}: {
  isUpdating: boolean;
  onCancelInvite: () => void;
  request: CustomerProRequestDetailResponse['proRequest'];
}) {
  const state = request.siteVisitState;
  if (!state || (!request.isUnlocked && !request.siteVisitInvites?.length)) return null;

  const invites = request.siteVisitInvites || [];
  const contactState = request.contactVisibilityState;
  const addressState = request.addressVisibilityState;
  const allowedFields = request.allowedContactFields || contactState?.allowedContactFields || [];

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('siteVisit')} tone="pro" />
        <StatusBadge label={state.statusLabel} tone={getSiteVisitTone(state.status)} />
      </View>
      <AppText variant="sectionTitle">{t('siteVisitInvitations')}</AppText>
      <AppText color={colors.slate700}>{request.siteVisitSummary || state.helperText}</AppText>
      <AppText color={colors.slate700}>{t('siteVisitOnlyNotFinalAgreement')}</AppText>
      {request.siteVisitBlockedReason ? (
        <AppText color={colors.warning600}>{request.siteVisitBlockedReason}</AppText>
      ) : null}

      {invites.length ? (
        <View style={styles.stack}>
          {invites.map((invite) => (
            <View key={invite.id} style={styles.siteVisitInvite}>
              <StatusBadge label={invite.statusLabel} tone={getSiteVisitTone(invite.status)} />
              <Info label={t('approvedPros')} value={invite.proDisplayName} />
              {invite.preferredDate ? <Info label={t('preferredDate')} value={invite.preferredDate} /> : null}
              {invite.preferredTimeWindow ? <Info label={t('timeWindow')} value={invite.preferredTimeWindow} /> : null}
              {invite.messagePreview ? <Info label={t('shortMessage')} value={invite.messagePreview} /> : null}
              {invite.accessNotesPreview ? <Info label={t('accessNotes')} value={invite.accessNotesPreview} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <AppText color={colors.slate700}>{t('noSiteVisitInvitesYet')}</AppText>
      )}

      {contactState ? (
        <Info
          label={t('sharedDetails')}
          value={contactState.state === 'shared_for_site_visit' ? t('contactDetailsSharedForSiteVisit') : t('contactDetailsHidden')}
        />
      ) : null}
      {addressState ? (
        <Info
          label={t('siteVisit')}
          value={
            addressState.state === 'shared_for_site_visit'
              ? t('addressSharedForSiteVisit')
              : addressState.state === 'area_only'
                ? t('cityAreaOnly')
                : t('addressHidden')
          }
        />
      ) : null}
      {allowedFields.length ? (
        <Info label={t('allowedContactFields')} value={allowedFields.join(', ')} />
      ) : null}
      {request.siteVisitNextActions?.canCancelSiteVisitInvite ? (
        <AppButton loading={isUpdating} onPress={onCancelInvite} tone="neutral" variant="outline">
          {t('cancelSiteVisitInvite')}
        </AppButton>
      ) : null}
      <AppText color={colors.slate500} variant="caption">{t('contactDetailsSharedWhenAllowed')}</AppText>
      <AppText color={colors.slate500} variant="caption">{t('independentProsResponsible')}</AppText>
    </AppCard>
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

function ProAccessSupportCard({
  onOpenSupport,
  request,
}: {
  onOpenSupport: () => void;
  request: CustomerProRequestDetailResponse['proRequest'];
}) {
  const supportState = request.proAccessSupportState;
  const refundState = request.proAccessRefundState;
  const paymentStatus = request.proAccessPaymentState?.status;
  const supportActions = request.proAccessSupportNextActions || request.proAccessNextActions;
  const canOpenSupport = Boolean(supportActions?.canOpenProAccessSupport || supportActions?.canRequestProAccessRefund);
  const shouldShow = Boolean(
    supportState &&
      refundState &&
      (request.isUnlocked ||
        paymentStatus === 'paid' ||
        paymentStatus === 'failed' ||
        refundState.status === 'refunded' ||
        refundState.status === 'credited' ||
        refundState.status === 'requested' ||
        refundState.status === 'under_review' ||
        refundState.status === 'request_available' ||
        supportState.status === 'support_available' ||
        supportState.status === 'refund_review_available' ||
        supportState.status === 'submitted' ||
        supportState.status === 'under_review' ||
        supportState.status === 'resolved'),
  );

  if (!shouldShow || !supportState || !refundState) return null;

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('proAccessSupport')} tone="pro" />
        <StatusBadge label={getProAccessSupportStatusLabel(supportState.statusLabel, refundState.status)} tone={getProAccessSupportTone(supportState.status, refundState.status, paymentStatus)} />
      </View>
      <AppText variant="sectionTitle">{t('proAccessRefundSupportReview')}</AppText>
      <Info label={t('supportStatus')} value={supportState.statusLabel || t('noProAccessSupportReview')} />
      <Info label={t('refundStatus')} value={refundState.statusLabel || t('refundReview')} />
      {request.proAccessRefundSummary ? (
        <AppText color={colors.slate700}>{request.proAccessRefundSummary}</AppText>
      ) : (
        <AppText color={colors.slate700}>{supportState.helperText}</AppText>
      )}
      {refundState.outcomeLabel ? <Info label={t('refundStatus')} value={refundState.outcomeLabel} /> : null}
      {request.proAccessRefundResolvedAt ? <Info label={t('created')} value={request.proAccessRefundResolvedAt} /> : null}
      {request.proAccessRefundSubmittedAt ? <Info label={t('submitted')} value={request.proAccessRefundSubmittedAt} /> : null}
      {request.proAccessRefundBlockedReason ? (
        <AppText color={colors.warning600}>{request.proAccessRefundBlockedReason}</AppText>
      ) : null}
      <AppText color={colors.slate700}>{t('proAccessUnlocksComparisonNotWork')}</AppText>
      <AppText color={colors.slate700}>{t('refundNotGuaranteed')}</AppText>
      {canOpenSupport ? (
        <AppButton onPress={onOpenSupport} tone="pro" variant="outline">
          {supportActions?.canRequestProAccessRefund ? t('requestRefundReview') : t('requestProAccessSupport')}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

function ProAccessSupportRequestForm({
  errors,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  values,
}: {
  errors: CustomerProAccessSupportFormErrors;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <Key extends keyof CustomerProAccessSupportFormValues>(key: Key, value: CustomerProAccessSupportFormValues[Key]) => void;
  onSubmit: () => void;
  values: CustomerProAccessSupportFormValues;
}) {
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={t('requestReview')} tone="pro" />
      <AppText variant="sectionTitle">{t('tellUsWhatHappened')}</AppText>
      <AppText color={colors.slate700}>{t('tasklyWillReviewProAccessRequest')}</AppText>
      <AppText color={colors.slate700}>{t('refundNotGuaranteed')}</AppText>
      <AppText color={colors.slate700}>{t('proAccessUnlocksComparisonNotWork')}</AppText>
      {errors.form ? <AppText color={colors.danger600}>{errors.form}</AppText> : null}
      <View style={styles.stack}>
        <AppText variant="bodyStrong">{t('whatIsTheIssue')}</AppText>
        <View style={styles.issueOptions}>
          {proAccessSupportIssueOptions.map((option) => {
            const selected = values.issueType === option.value;
            return (
              <AppButton
                key={option.value}
                onPress={() => onChange('issueType', option.value)}
                tone="pro"
                variant={selected ? 'filled' : 'outline'}>
                {t(option.labelKey)}
              </AppButton>
            );
          })}
        </View>
        {errors.issueType ? <AppText color={colors.danger600}>{errors.issueType}</AppText> : null}
      </View>
      <FormField
        errorText={errors.reason}
        helperText={t('supportReasonHelper')}
        label={t('reason')}
        multiline
        onChangeText={(value) => onChange('reason', value)}
        value={values.reason}
      />
      <FormField
        errorText={errors.details}
        helperText={t('detailsOptional')}
        label={t('supportDetails')}
        multiline
        onChangeText={(value) => onChange('details', value)}
        value={values.details}
      />
      <View style={styles.stack}>
        <AppButton loading={isSubmitting} onPress={onSubmit} tone="pro">{t('submitRequest')}</AppButton>
        <AppButton disabled={isSubmitting} onPress={onCancel} tone="neutral" variant="ghost">{t('cancel')}</AppButton>
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

function hasObviousContactDetails(values: CustomerSiteVisitFormValues) {
  const merged = Object.values(values).join('\n');
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(merged) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(merged) ||
    /(https?:\/\/|www\.|telegram|viber|whatsapp|facebook|instagram|@\w{2,})/i.test(merged);
}

function validateCustomerSiteVisitForm(values: CustomerSiteVisitFormValues): CustomerSiteVisitFormErrors {
  const errors: CustomerSiteVisitFormErrors = {};
  if (values.preferredDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(values.preferredDate.trim())) {
    errors.preferredDate = t('preferredDateRequired');
  }
  if (!values.preferredTimeWindow.trim()) {
    errors.preferredTimeWindow = t('proposedTimeRequired');
  }
  if (hasObviousContactDetails(values)) {
    errors.form = t('pleaseRemoveContactDetails');
  }
  return errors;
}

function hasObviousSupportContactDetails(values: CustomerProAccessSupportFormValues) {
  return hasObviousContactDetails({
    accessNotes: '',
    message: values.reason,
    preferredDate: '',
    preferredTimeWindow: values.details,
  });
}

function validateProAccessSupportForm(values: CustomerProAccessSupportFormValues): CustomerProAccessSupportFormErrors {
  const errors: CustomerProAccessSupportFormErrors = {};
  if (!values.reason.trim()) {
    errors.reason = t('reasonRequired');
  }
  if (values.reason.trim().length > 2000) {
    errors.reason = t('reasonTooLong');
  }
  if (values.details.trim().length > 6000) {
    errors.details = t('detailsTooLong');
  }
  if (hasObviousSupportContactDetails(values)) {
    errors.form = t('pleaseRemoveContactDetails');
  }
  return errors;
}

function getCustomerSiteVisitErrorMessages(details: unknown, fallbackMessage: string): CustomerSiteVisitFormErrors {
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      return Object.entries(fieldErrors).reduce<CustomerSiteVisitFormErrors>((acc, [key, value]) => {
        acc[key as keyof CustomerSiteVisitFormValues] = String(value);
        return acc;
      }, {});
    }
  }
  return { form: fallbackMessage || t('couldNotSendInvite') };
}

function getProAccessSupportErrorMessages(details: unknown, fallbackMessage: string): CustomerProAccessSupportFormErrors {
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      return Object.entries(fieldErrors).reduce<CustomerProAccessSupportFormErrors>((acc, [key, value]) => {
        acc[key as keyof CustomerProAccessSupportFormValues] = String(value);
        return acc;
      }, {});
    }
  }
  return { form: fallbackMessage || t('couldNotSubmitRequest') };
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  comparisonCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  heroChip: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  image: { aspectRatio: 1, borderRadius: radius.lg, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { gap: spacing.sm },
  infoRow: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  issueOptions: { gap: spacing.sm },
  noteBlock: { gap: spacing.xs },
  proHero: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.proOrange600,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  profileImage: { backgroundColor: colors.proOrange50, borderRadius: radius.lg, height: 56, width: 56 },
  profileRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  profileText: { flex: 1, gap: spacing.xs },
  response: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  siteVisitInvite: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  stack: { gap: spacing.sm },
});

function getSiteVisitTone(status?: string) {
  if (status === 'accepted' || status === 'completed' || status === 'invite_available') return 'success';
  if (status === 'invited' || status === 'alternate_time_proposed') return 'pro';
  if (status === 'declined' || status === 'cancelled' || status === 'blocked') return 'warning';
  return 'neutral';
}

function getProAccessSupportStatusLabel(statusLabel: string, refundStatus?: string) {
  if (refundStatus === 'refunded') return t('refunded');
  if (refundStatus === 'credited') return t('credited');
  return statusLabel;
}

function getProAccessSupportTone(supportStatus?: string, refundStatus?: string, paymentStatus?: string) {
  if (refundStatus === 'refunded' || refundStatus === 'credited' || supportStatus === 'resolved') return 'success';
  if (supportStatus === 'under_review' || supportStatus === 'submitted' || refundStatus === 'under_review' || refundStatus === 'requested') return 'pro';
  if (paymentStatus === 'failed' || supportStatus === 'not_available' || refundStatus === 'not_available') return 'warning';
  return 'neutral';
}
