import { useFocusEffect } from '@react-navigation/native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { FormField, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderProRequestDetailResponse, ProviderProResponsePayload } from '@/src/lib/api/domain';
import {
  acceptMockProviderProSiteVisit,
  declineMockProviderProSiteVisit,
  getMockProviderProRequestDetailResponse,
  proposeMockProviderProSiteVisitTime,
  submitOrUpdateMockProviderProResponse,
} from '@/src/lib/api/mockApi';
import {
  acceptProviderProSiteVisit,
  declineProviderProSiteVisit,
  getProviderProRequestDetail,
  proposeProviderProSiteVisitTime,
  submitOrUpdateProviderProResponse,
} from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { hasApprovedProMode } from '@/src/lib/auth/workspaceAccess';
import { t, type TranslationKey } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ResponseFormValues = {
  assumptions: string;
  availability: string;
  customerPreparationNotes: string;
  earliestStartDate: string;
  excludedItems: string[];
  excludedNotes: string;
  estimateConfidence: string;
  estimatedDuration: string;
  includedItems: string[];
  includedNotes: string;
  materialsIncluded: string;
  responseType: string;
  roughQuoteMax: string;
  roughQuoteMin: string;
  shortMessage: string;
  siteVisitPolicy: string;
};

type ResponseFormErrors = Partial<Record<keyof ResponseFormValues | 'form', string>>;

type ProviderSiteVisitActionMode = 'accept' | 'decline' | 'propose' | null;

type ProviderSiteVisitFormValues = {
  message: string;
  proposedDate: string;
  proposedTimeWindow: string;
  reason: string;
};

type ProviderSiteVisitFormErrors = Partial<Record<keyof ProviderSiteVisitFormValues | 'form', string>>;

const emptyFormValues: ResponseFormValues = {
  assumptions: '',
  availability: 'NEXT_WEEK',
  customerPreparationNotes: '',
  earliestStartDate: '',
  excludedItems: [],
  excludedNotes: '',
  estimateConfidence: 'ROUGH_ESTIMATE',
  estimatedDuration: '',
  includedItems: [],
  includedNotes: '',
  materialsIncluded: 'LABOR_ONLY',
  responseType: 'CAN_HANDLE',
  roughQuoteMax: '',
  roughQuoteMin: '',
  shortMessage: '',
  siteVisitPolicy: 'DEPENDS',
};

type ResponseOption = { labelKey: TranslationKey; value: string };

const responseTypeOptions: ResponseOption[] = [
  { value: 'CAN_HANDLE', labelKey: 'proResponseTypeCanHandle' },
  { value: 'NEEDS_SITE_VISIT', labelKey: 'proResponseTypeNeedsSiteVisit' },
  { value: 'NEEDS_MORE_DETAILS', labelKey: 'proResponseTypeNeedsMoreDetails' },
  { value: 'CAN_HANDLE_PART', labelKey: 'proResponseTypeCanHandlePart' },
  { value: 'SUITABLE_FOR_TEAM', labelKey: 'proResponseTypeSuitableForTeam' },
];

const materialsOptions: ResponseOption[] = [
  { value: 'LABOR_ONLY', labelKey: 'proMaterialsLaborOnly' },
  { value: 'LABOR_AND_MATERIALS', labelKey: 'proMaterialsLaborAndMaterials' },
  { value: 'PARTIAL_MATERIALS', labelKey: 'proMaterialsPartialMaterials' },
  { value: 'MATERIALS_NOT_INCLUDED', labelKey: 'proMaterialsNotIncluded' },
  { value: 'NEEDS_CONFIRMATION', labelKey: 'proMaterialsNeedsConfirmation' },
];

const estimateConfidenceOptions: ResponseOption[] = [
  { value: 'ROUGH_ESTIMATE', labelKey: 'proEstimateRough' },
  { value: 'FAIR_FROM_DETAILS', labelKey: 'proEstimateFairFromDetails' },
  { value: 'REQUIRES_SITE_VISIT', labelKey: 'proEstimateRequiresSiteVisit' },
];

const siteVisitPolicyOptions: ResponseOption[] = [
  { value: 'NOT_NEEDED', labelKey: 'proSiteVisitNotNeeded' },
  { value: 'FREE_SITE_VISIT', labelKey: 'proSiteVisitFree' },
  { value: 'PAID_SITE_VISIT', labelKey: 'proSiteVisitPaid' },
  { value: 'REQUIRED_BEFORE_FINAL_QUOTE', labelKey: 'proSiteVisitRequiredBeforeFinalQuote' },
  { value: 'DEPENDS', labelKey: 'proSiteVisitDepends' },
];

const availabilityOptions: ResponseOption[] = [
  { value: 'THIS_WEEK', labelKey: 'proAvailabilityThisWeek' },
  { value: 'NEXT_WEEK', labelKey: 'proAvailabilityNextWeek' },
  { value: 'TWO_TO_THREE_WEEKS', labelKey: 'proAvailabilityTwoToThreeWeeks' },
  { value: 'THIS_MONTH', labelKey: 'proAvailabilityThisMonth' },
  { value: 'DEPENDS_ON_PROJECT', labelKey: 'proAvailabilityDependsOnProject' },
  { value: 'EVENINGS_WEEKENDS', labelKey: 'proAvailabilityEveningsWeekends' },
];

const includedItemOptions: ResponseOption[] = [
  { value: 'LABOR', labelKey: 'proIncludedLabor' },
  { value: 'TOOLS', labelKey: 'proIncludedTools' },
  { value: 'MEASUREMENTS', labelKey: 'proIncludedMeasurements' },
  { value: 'SITE_VISIT', labelKey: 'proIncludedSiteVisit' },
  { value: 'CLEANUP', labelKey: 'proIncludedCleanup' },
  { value: 'TRANSPORT', labelKey: 'proIncludedTransport' },
  { value: 'MATERIALS', labelKey: 'proIncludedMaterials' },
  { value: 'WASTE_REMOVAL', labelKey: 'proIncludedWasteRemoval' },
  { value: 'CONSULTATION', labelKey: 'proIncludedConsultation' },
  { value: 'WARRANTY', labelKey: 'proIncludedWarranty' },
];

const excludedItemOptions: ResponseOption[] = [
  { value: 'MATERIALS', labelKey: 'proExcludedMaterials' },
  { value: 'DEMOLITION', labelKey: 'proExcludedDemolition' },
  { value: 'WASTE_REMOVAL', labelKey: 'proExcludedWasteRemoval' },
  { value: 'PARKING_ACCESS_COSTS', labelKey: 'proExcludedParkingAccessCosts' },
  { value: 'HIDDEN_PLUMBING_ELECTRICAL', labelKey: 'proExcludedHiddenPlumbingElectrical' },
  { value: 'FINAL_MEASUREMENTS', labelKey: 'proExcludedFinalMeasurements' },
  { value: 'PERMITS', labelKey: 'proExcludedPermits' },
  { value: 'EXTRA_REPAIRS_DISCOVERED', labelKey: 'proExcludedExtraRepairsDiscovered' },
];

const emptySiteVisitFormValues: ProviderSiteVisitFormValues = {
  message: '',
  proposedDate: '',
  proposedTimeWindow: '',
  reason: '',
};

export default function ProviderProRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proRequestId?: string; respond?: string }>();
  const proRequestId = String(params.proRequestId || 'demo-provider-pro');
  const openRespondFromRoute = String(params.respond || '') === '1';
  const { getValidAccessToken, session, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProRequestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ResponseFormValues>(emptyFormValues);
  const [formErrors, setFormErrors] = useState<ResponseFormErrors>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseNotice, setResponseNotice] = useState<string | null>(null);
  const [isUpdatingSiteVisit, setIsUpdatingSiteVisit] = useState(false);
  const [siteVisitActionMode, setSiteVisitActionMode] = useState<ProviderSiteVisitActionMode>(null);
  const [siteVisitErrors, setSiteVisitErrors] = useState<ProviderSiteVisitFormErrors>({});
  const [siteVisitValues, setSiteVisitValues] = useState<ProviderSiteVisitFormValues>(emptySiteVisitFormValues);
  const [siteVisitNotice, setSiteVisitNotice] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);
    setResponseNotice(null);

    if (status === 'demo') {
      setData(getMockProviderProRequestDetailResponse(proRequestId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredProviderProRequestDetail'));
      return;
    }

    if (!hasApprovedProMode(session)) {
      setData(null);
      setStateLabel(t('tasklyPro'));
      setMessage(t('proAccessNeedsApprovalBody'));
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel(t('loginRequired'));
      setMessage(t('loginRequiredProviderProRequestDetail'));
      setIsLoading(false);
      return;
    }

    const result = await getProviderProRequestDetail(proRequestId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? t('notFound') : result.status === 401 || result.status === 403 ? t('loginRequired') : t('backendUnavailable'));
    setMessage(result.status === 404 ? t('providerProRequestNotFound') : t('couldNotLoadProviderProRequest'));
  }, [getValidAccessToken, proRequestId, session, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const request = data?.proRequest;
  const canOpenRouteResponseForm = Boolean(
    request?.proResponseCapabilities?.canOpenProResponseForm &&
      (request.proResponseCapabilities.canSubmitResponse || request.proResponseCapabilities.canEditResponse),
  );

  const openResponseForm = useCallback(() => {
    if (!request) return;
    setFormErrors({});
    setResponseNotice(null);
    setFormValues(getInitialResponseFormValues(request));
    setIsFormOpen(true);
  }, [request]);

  const closeResponseForm = useCallback(() => {
    setFormErrors({});
    setIsFormOpen(false);
  }, []);

  const openSiteVisitAction = useCallback((mode: Exclude<ProviderSiteVisitActionMode, null>) => {
    setSiteVisitActionMode(mode);
    setSiteVisitErrors({});
    setSiteVisitNotice(null);
    setSiteVisitValues(emptySiteVisitFormValues);
  }, []);

  const closeSiteVisitAction = useCallback(() => {
    setSiteVisitActionMode(null);
    setSiteVisitErrors({});
  }, []);

  const updateSiteVisitValue = useCallback(<Key extends keyof ProviderSiteVisitFormValues>(
    key: Key,
    value: ProviderSiteVisitFormValues[Key],
  ) => {
    setSiteVisitValues((current) => ({ ...current, [key]: value }));
    setSiteVisitErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }, []);

  const updateFormValue = useCallback(<Key extends keyof ResponseFormValues,>(key: Key, value: ResponseFormValues[Key]) => {
    setFormValues((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }, []);

  const submitResponse = useCallback(async () => {
    const validation = validateResponseForm(formValues);
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }

    setFormErrors({});
    setResponseNotice(null);
    setIsSubmittingResponse(true);
    const payload = toResponsePayload(formValues);

    if (status === 'demo') {
      setData(submitOrUpdateMockProviderProResponse(proRequestId, payload));
      setIsSubmittingResponse(false);
      setIsFormOpen(false);
      setResponseNotice(request?.myResponse ? t('responseUpdated') : t('responseSubmitted'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsSubmittingResponse(false);
      setFormErrors({ form: t('loginRequired') });
      return;
    }

    const result = await submitOrUpdateProviderProResponse(proRequestId, payload, authToken);
    setIsSubmittingResponse(false);

    if (result.ok) {
      setData(result.data);
      setIsFormOpen(false);
      setResponseNotice(request?.myResponse ? t('responseUpdated') : t('responseSubmitted'));
      return;
    }

    setFormErrors(getResponseErrorMessages(result.error.details, result.error.message));
  }, [formValues, getValidAccessToken, proRequestId, request?.myResponse, status]);

  const submitSiteVisitAction = useCallback(async () => {
    if (!siteVisitActionMode || !request) return;
    const invite = request.siteVisitInvites?.find((item) => item.status === 'invited' || item.status === 'alternate_time_proposed');
    if (!invite) return;

    const validation = validateProviderSiteVisitForm(siteVisitActionMode, siteVisitValues);
    if (Object.keys(validation).length > 0) {
      setSiteVisitErrors(validation);
      return;
    }

    setSiteVisitErrors({});
    setSiteVisitNotice(null);
    setIsUpdatingSiteVisit(true);

    if (status === 'demo') {
      setData(
        siteVisitActionMode === 'accept'
          ? acceptMockProviderProSiteVisit(proRequestId)
          : siteVisitActionMode === 'decline'
            ? declineMockProviderProSiteVisit(proRequestId)
            : proposeMockProviderProSiteVisitTime(proRequestId),
      );
      setIsUpdatingSiteVisit(false);
      setSiteVisitActionMode(null);
      setSiteVisitNotice(
        siteVisitActionMode === 'accept'
          ? t('siteVisitAccepted')
          : siteVisitActionMode === 'decline'
            ? t('siteVisitDeclined')
            : t('anotherTimeProposed'),
      );
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsUpdatingSiteVisit(false);
      setSiteVisitErrors({ form: t('loginRequired') });
      return;
    }

    const result =
      siteVisitActionMode === 'accept'
        ? await acceptProviderProSiteVisit(proRequestId, invite.id, { message: siteVisitValues.message.trim() }, authToken)
        : siteVisitActionMode === 'decline'
          ? await declineProviderProSiteVisit(
              proRequestId,
              invite.id,
              { message: siteVisitValues.message.trim(), reason: siteVisitValues.reason.trim() },
              authToken,
            )
          : await proposeProviderProSiteVisitTime(
              proRequestId,
              invite.id,
              {
                message: siteVisitValues.message.trim(),
                proposedDate: siteVisitValues.proposedDate.trim() || null,
                proposedTimeWindow: siteVisitValues.proposedTimeWindow.trim(),
              },
              authToken,
            );
    setIsUpdatingSiteVisit(false);

    if (result.ok) {
      setData(result.data);
      setSiteVisitActionMode(null);
      setSiteVisitNotice(
        siteVisitActionMode === 'accept'
          ? t('siteVisitAccepted')
          : siteVisitActionMode === 'decline'
            ? t('siteVisitDeclined')
            : t('anotherTimeProposed'),
      );
      return;
    }

    setSiteVisitErrors(getProviderSiteVisitErrorMessages(result.error.details, result.error.message));
  }, [getValidAccessToken, proRequestId, request, siteVisitActionMode, siteVisitValues, status]);

  const openProChat = useCallback(() => {
    const threadId = request?.proChat?.messageThreadId || request?.messageThreadId;
    if (!threadId || !request?.proChat?.capabilities.canRead) return;
    router.push(`/provider/messages/${encodeURIComponent(threadId)}` as Href);
  }, [request?.messageThreadId, request?.proChat, router]);

  useEffect(() => {
    if (!openRespondFromRoute || !request || isFormOpen || !canOpenRouteResponseForm) return;
    openResponseForm();
  }, [canOpenRouteResponseForm, isFormOpen, openRespondFromRoute, openResponseForm, request]);

  const canUsePro = status === 'demo' || hasApprovedProMode(session);

  if (!canUsePro && status !== 'loading') {
    return (
      <Screen>
        <View style={styles.header}>
          <ModeBadge mode="providerPro" />
          <AppButton onPress={() => router.push('/provider/start' as Href)} variant="ghost">{t('back')}</AppButton>
        </View>
        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label={t('tasklyPro')} tone="pro" />
          <AppText variant="sectionTitle">{t('proAccessNeedsApprovalTitle')}</AppText>
          <AppText color={colors.slate700}>{t('proAccessNeedsApprovalBody')}</AppText>
          <AppButton onPress={() => router.push('/provider/pro-upsell' as Href)} tone="pro">
            {t('applyForTasklyPro')}
          </AppButton>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="providerPro" />
        <AppButton onPress={() => router.back()} variant="ghost">{t('back')}</AppButton>
      </View>

      {isLoading ? <StateCard label={t('loading')} message={t('loadingProviderProDetail')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || t('notice')} tone="warning" />
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
            <View style={styles.badgeRow}>
              <StatusBadge label={t('tasklyProRequest')} tone="pro" />
              <StatusBadge label={request.statusLabel} tone="pro" />
              {request.photoCountLabel ? <StatusBadge label={request.photoCountLabel} tone="neutral" /> : null}
            </View>
            <AppText variant="screenTitle">{request.title}</AppText>
            <AppText color={colors.slate700}>{request.categoryLabel} - {request.cityLabel}</AppText>
            <View style={styles.heroActions}>
              {canOpenRouteResponseForm ? (
                <AppButton onPress={openResponseForm} style={styles.heroAction} tone="pro">
                  {request.proResponseCapabilities?.canEditResponse ? t('editResponse') : t('respondToRequest')}
                </AppButton>
              ) : null}
              {request.proChat?.capabilities.canRead ? (
                <AppButton onPress={openProChat} style={styles.heroAction} tone="pro" variant="outline">
                  {t('openProMessages')}
                </AppButton>
              ) : null}
            </View>
          </AppCard>

          <AppCard backgroundColor={colors.white}>
            <View style={styles.sectionHeading}>
              <AppText variant="sectionTitle">{t('requestOverview')}</AppText>
              <StatusBadge label={request.eligibility.reasonLabel} tone={request.eligibility.isEligibleToRespond ? 'success' : 'warning'} />
            </View>
            <View style={styles.infoGrid}>
              <Info label={t('category')} value={request.categoryLabel} />
              <Info label={t('city')} value={request.cityLabel} />
              <Info label={t('budget')} value={request.budgetLabel} />
              <Info label={t('timeline')} value={request.timelineLabel} />
              <Info label={t('created')} value={formatDateLabel(request.createdAt)} />
              <Info label={t('photos')} value={request.photoCountLabel || t('noPhotosAttached')} />
            </View>
          </AppCard>

          <AppCard backgroundColor={colors.white}>
            <AppText variant="sectionTitle">{t('projectDetails')}</AppText>
            <AppText color={colors.slate700} style={styles.descriptionText}>
              {request.description}
            </AppText>
          </AppCard>

          <AppCard backgroundColor={colors.white}>
            <View style={styles.sectionHeading}>
              <AppText variant="sectionTitle">{t('customerPrivacyContactState')}</AppText>
              {request.protectedDetailsLabel ? <StatusBadge label={localizeProviderProLabel(request.protectedDetailsLabel)} tone="neutral" /> : null}
            </View>
            {request.customerUnlockStatusLabel ? (
              <Info label={t('customerAccess')} value={localizeProviderProLabel(request.customerUnlockStatusLabel)} />
            ) : null}
            {request.selectedProStateLabel ? (
              <Info label={t('selectedPro')} value={localizeProviderProLabel(request.selectedProStateLabel)} />
            ) : null}
            {request.siteVisitStatusLabel ? (
              <Info label={t('siteVisit')} value={localizeProviderProLabel(request.siteVisitStatusLabel)} />
            ) : null}
            {request.chatAvailabilityLabel ? (
              <Info label={t('proChat')} value={localizeProviderProLabel(request.chatAvailabilityLabel)} />
            ) : null}
            {request.addressVisibilityState ? (
              <>
                <Info label={t('address')} value={request.addressVisibilityState.stateLabel} />
                <AppText color={colors.slate700}>{request.addressVisibilityState.helperText}</AppText>
                {request.addressVisibilityState.addressLabel ? (
                  <Info label={t('address')} value={request.addressVisibilityState.addressLabel} />
                ) : null}
                {request.addressVisibilityState.accessNotesLabel ? (
                  <Info label={t('accessNotes')} value={request.addressVisibilityState.accessNotesLabel} />
                ) : null}
              </>
            ) : (
              <AppText color={colors.slate700}>{t('protectedDetailsHidden')}</AppText>
            )}
            {request.contactVisibilityState ? (
              <>
                <Info label={t('sharedDetails')} value={request.contactVisibilityState.stateLabel} />
                <AppText color={colors.slate700}>{request.contactVisibilityState.helperText}</AppText>
              </>
            ) : null}
            <AppText color={colors.slate500} variant="small">{t('contactDetailsSharedWhenAllowed')}</AppText>
          </AppCard>

          {responseNotice ? (
            <AppCard accentColor={colors.success600} backgroundColor={colors.success50}>
              <StatusBadge label={responseNotice} tone="success" />
              <AppText color={colors.slate700}>{t('customerLimitedPreviewBeforeUnlock')}</AppText>
            </AppCard>
          ) : null}

          <ProResponseCapabilityCard onOpenForm={openResponseForm} request={request} />

          {isFormOpen ? (
            <ProResponseForm
              errors={formErrors}
              isEditing={Boolean(request.proResponseCapabilities?.canEditResponse)}
              isSubmitting={isSubmittingResponse}
              onCancel={closeResponseForm}
              onChange={updateFormValue}
              onSubmit={submitResponse}
              values={formValues}
            />
          ) : null}

          <Images imageCount={request.imageCount ?? request.images.length} images={request.images} />

          <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <View style={styles.sectionHeading}>
              <AppText variant="sectionTitle">{t('yourResponse')}</AppText>
              {request.myResponse ? (
                <StatusBadge label={t('responseSent')} tone="success" />
              ) : (
                <StatusBadge label={t('waitingForYourResponse')} tone="warning" />
              )}
            </View>
            {request.myResponse ? (
              <>
                <View style={styles.badgeRow}>
                  <StatusBadge label={request.myResponse.statusLabel} tone="success" />
                  {request.responseVisibilityLabel ? <StatusBadge label={request.responseVisibilityLabel} tone="neutral" /> : null}
                </View>
                {request.myResponse.shortMessagePreview ? (
                  <AppText color={colors.slate700}>{request.myResponse.shortMessagePreview}</AppText>
                ) : null}
                <Info label={t('roughQuote')} value={request.myResponse.roughQuoteLabel} />
                {request.myResponse.materialsIncluded ? (
                  <Info label={t('materialsIncluded')} value={request.myResponse.materialsIncluded} />
                ) : null}
                {request.myResponse.siteVisitPolicy ? (
                  <Info label={t('siteVisit')} value={request.myResponse.siteVisitPolicy} />
                ) : null}
                <Info label={t('submitted')} value={new Date(request.myResponse.submittedAt).toLocaleDateString()} />
                {request.myResponse.visibilityLabel ? (
                  <AppText color={colors.slate700}>{request.myResponse.visibilityLabel}</AppText>
                ) : null}
                {canOpenRouteResponseForm ? (
                  <AppButton onPress={openResponseForm} tone="pro" variant="outline">
                    {t('editResponse')}
                  </AppButton>
                ) : null}
                {request.proChat?.capabilities.canRead && (request.proChat.messageThreadId || request.messageThreadId) ? (
                  <AppButton onPress={openProChat} tone="pro" variant="outline">
                    {t('openProChat')}
                  </AppButton>
                ) : null}
              </>
            ) : (
              <>
                <AppText color={colors.slate700}>{t('noProResponseSubmitted')}</AppText>
                {canOpenRouteResponseForm ? (
                  <AppButton onPress={openResponseForm} tone="pro">
                    {t('respondToRequest')}
                  </AppButton>
                ) : null}
              </>
            )}
          </AppCard>

          {siteVisitNotice ? (
            <AppCard accentColor={colors.success600} backgroundColor={colors.success50}>
              <StatusBadge label={siteVisitNotice} tone="success" />
              <AppText color={colors.slate700}>{t('siteVisitOnlyNotFinalAgreement')}</AppText>
            </AppCard>
          ) : null}

          <SiteVisitStateCard onOpenAction={openSiteVisitAction} request={request} />

          {siteVisitActionMode ? (
            <ProviderSiteVisitActionForm
              errors={siteVisitErrors}
              isSubmitting={isUpdatingSiteVisit}
              mode={siteVisitActionMode}
              onCancel={closeSiteVisitAction}
              onChange={updateSiteVisitValue}
              onSubmit={submitSiteVisitAction}
              values={siteVisitValues}
            />
          ) : null}

          <NextActions actions={request.nextActions} />
        </>
      ) : null}
    </Screen>
  );
}

function ProResponseCapabilityCard({
  onOpenForm,
  request,
}: {
  onOpenForm: () => void;
  request: NonNullable<ProviderProRequestDetailResponse['proRequest']>;
}) {
  const state = request.proResponseState;
  const capabilities = request.proResponseCapabilities || state?.capabilities;

  if (!state && !capabilities) return null;

  const canSubmitOrEdit = Boolean(capabilities?.canSubmitResponse || capabilities?.canEditResponse);
  const canOpenForm = Boolean(capabilities?.canOpenProResponseForm && canSubmitOrEdit);
  const ctaLabel = capabilities?.canEditResponse ? t('updateResponse') : t('submitResponse');

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('proResponse')} tone="pro" />
        {state?.badgeLabel ? <StatusBadge label={state.badgeLabel} tone={getProResponseBadgeTone(state.status)} /> : null}
      </View>
      <AppText variant="sectionTitle">{t('responseStatus')}</AppText>
      {state?.helperText ? <AppText color={colors.slate700}>{state.helperText}</AppText> : null}
      {request.proResponseBlockedReason ? (
        <AppText color={colors.warning600}>{request.proResponseBlockedReason}</AppText>
      ) : null}
      <AppText color={colors.slate700}>{t('customerLimitedPreviewBeforeUnlock')}</AppText>
      {canOpenForm ? (
        <View style={styles.stack}>
          <AppButton onPress={onOpenForm} tone="pro" variant="outline">
            {ctaLabel}
          </AppButton>
          <AppText color={colors.slate500} variant="small">
            {t('fullComparisonUnlockedByCustomer')}
          </AppText>
        </View>
      ) : null}
    </AppCard>
  );
}

function SiteVisitStateCard({
  onOpenAction,
  request,
}: {
  onOpenAction: (mode: Exclude<ProviderSiteVisitActionMode, null>) => void;
  request: NonNullable<ProviderProRequestDetailResponse['proRequest']>;
}) {
  const state = request.siteVisitState;
  const invites = request.siteVisitInvites || [];
  if (!state || (!invites.length && state.status === 'none')) return null;

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

      {invites.map((invite) => (
        <View key={invite.id} style={styles.siteVisitInvite}>
          <StatusBadge label={invite.statusLabel} tone={getSiteVisitTone(invite.status)} />
          {invite.preferredDate ? <Info label={t('preferredDate')} value={invite.preferredDate} /> : null}
          {invite.preferredTimeWindow ? <Info label={t('timeWindow')} value={invite.preferredTimeWindow} /> : null}
          {invite.messagePreview ? <Info label={t('shortMessage')} value={invite.messagePreview} /> : null}
          {invite.accessNotesPreview ? <Info label={t('accessNotes')} value={invite.accessNotesPreview} /> : null}
        </View>
      ))}

      {contactState ? (
        <Info
          label={t('sharedDetails')}
          value={contactState.state === 'shared_for_site_visit' || contactState.state === 'shared_for_selected_pro' ? t('contactDetailsSharedForSiteVisit') : t('contactDetailsHidden')}
        />
      ) : null}
      {addressState ? (
        <Info
          label={t('siteVisit')}
          value={
            addressState.state === 'shared_for_site_visit' || addressState.state === 'shared_for_selected_pro'
              ? addressState.addressLabel || t('addressSharedForSiteVisit')
              : addressState.state === 'city_only'
                ? t('cityAreaOnly')
                : t('addressHidden')
          }
        />
      ) : null}
      {allowedFields.length ? <Info label={t('allowedContactFields')} value={allowedFields.join(', ')} /> : null}
      {request.siteVisitNextActions?.canAcceptSiteVisit ? (
        <AppButton onPress={() => onOpenAction('accept')} tone="pro" variant="outline">{t('acceptSiteVisit')}</AppButton>
      ) : null}
      {request.siteVisitNextActions?.canDeclineSiteVisit ? (
        <AppButton onPress={() => onOpenAction('decline')} tone="neutral" variant="outline">{t('declineSiteVisit')}</AppButton>
      ) : null}
      {request.siteVisitNextActions?.canProposeSiteVisitTime ? (
        <AppButton onPress={() => onOpenAction('propose')} tone="pro" variant="outline">{t('proposeAnotherTime')}</AppButton>
      ) : null}
      <AppText color={colors.slate500} variant="caption">{t('contactDetailsSharedWhenAllowed')}</AppText>
      <AppText color={colors.slate500} variant="caption">{t('independentProsResponsible')}</AppText>
    </AppCard>
  );
}

function ProviderSiteVisitActionForm({
  errors,
  isSubmitting,
  mode,
  onCancel,
  onChange,
  onSubmit,
  values,
}: {
  errors: ProviderSiteVisitFormErrors;
  isSubmitting: boolean;
  mode: Exclude<ProviderSiteVisitActionMode, null>;
  onCancel: () => void;
  onChange: <Key extends keyof ProviderSiteVisitFormValues>(key: Key, value: ProviderSiteVisitFormValues[Key]) => void;
  onSubmit: () => void;
  values: ProviderSiteVisitFormValues;
}) {
  const title =
    mode === 'accept'
      ? t('acceptSiteVisit')
      : mode === 'decline'
        ? t('declineSiteVisit')
        : t('proposeAnotherTime');

  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={t('siteVisitRequest')} tone="pro" />
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText color={colors.slate700}>{t('siteVisitOnlyNotFinalAgreement')}</AppText>
      {errors.form ? <AppText color={colors.danger600}>{errors.form}</AppText> : null}
      {mode === 'decline' ? (
        <FormField
          errorText={errors.reason}
          label={t('reason')}
          multiline
          onChangeText={(value) => onChange('reason', value)}
          value={values.reason}
        />
      ) : null}
      {mode === 'propose' ? (
        <>
          <FormField
            errorText={errors.proposedDate}
            label={t('preferredDate')}
            onChangeText={(value) => onChange('proposedDate', value)}
            placeholder={t('datePlaceholder')}
            value={values.proposedDate}
          />
          <FormField
            errorText={errors.proposedTimeWindow}
            label={t('timeWindow')}
            onChangeText={(value) => onChange('proposedTimeWindow', value)}
            placeholder={t('preferredTime')}
            value={values.proposedTimeWindow}
          />
        </>
      ) : null}
      <FormField
        errorText={errors.message}
        label={t('messageToCustomer')}
        multiline
        onChangeText={(value) => onChange('message', value)}
        value={values.message}
      />
      <View style={styles.stack}>
        <AppButton loading={isSubmitting} onPress={onSubmit} tone="pro">{title}</AppButton>
        <AppButton disabled={isSubmitting} onPress={onCancel} tone="neutral" variant="ghost">{t('cancel')}</AppButton>
      </View>
    </AppCard>
  );
}

function ProResponseForm({
  errors,
  isEditing,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  values,
}: {
  errors: ResponseFormErrors;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <Key extends keyof ResponseFormValues>(key: Key, value: ResponseFormValues[Key]) => void;
  onSubmit: () => void;
  values: ResponseFormValues;
}) {
  return (
    <AppCard accentColor={colors.proOrange600}>
      <StatusBadge label={isEditing ? t('updateResponse') : t('respondToProRequest')} tone="pro" />
      <AppText variant="sectionTitle">{t('yourResponse')}</AppText>
      {errors.form ? <AppText color={colors.danger600}>{errors.form}</AppText> : null}

      <OptionGroup
        errorText={errors.responseType}
        label={t('responseType')}
        onSelect={(value) => onChange('responseType', value)}
        options={responseTypeOptions}
        value={values.responseType}
      />

      <FormField
        errorText={errors.shortMessage}
        helperText={t('pleaseRemoveContactDetails')}
        label={t('shortMessage')}
        multiline
        onChangeText={(value) => onChange('shortMessage', value)}
        placeholder={t('shortMessage')}
        value={values.shortMessage}
      />

      <AppCard backgroundColor={colors.proOrange50}>
        <AppText variant="bodyStrong">{t('roughQuote')}</AppText>
        <AppText color={colors.slate500} variant="small">{t('roughQuoteRequiredExceptSiteVisit')}</AppText>
        <View style={styles.twoColumn}>
          <FormField
            errorText={errors.roughQuoteMin}
            keyboardType="decimal-pad"
            label={t('minimumQuote')}
            onChangeText={(value) => onChange('roughQuoteMin', value)}
            placeholder={t('quoteAmountPlaceholder')}
            value={values.roughQuoteMin}
          />
          <FormField
            errorText={errors.roughQuoteMax}
            keyboardType="decimal-pad"
            label={t('maximumQuote')}
            onChangeText={(value) => onChange('roughQuoteMax', value)}
            placeholder={t('quoteAmountPlaceholder')}
            value={values.roughQuoteMax}
          />
        </View>
      </AppCard>

      <OptionGroup
        errorText={errors.materialsIncluded}
        label={t('materialsIncluded')}
        onSelect={(value) => onChange('materialsIncluded', value)}
        options={materialsOptions}
        value={values.materialsIncluded}
      />

      <OptionGroup
        errorText={errors.estimateConfidence}
        label={t('estimateConfidence')}
        onSelect={(value) => onChange('estimateConfidence', value)}
        options={estimateConfidenceOptions}
        value={values.estimateConfidence}
      />

      <OptionGroup
        errorText={errors.siteVisitPolicy}
        label={t('siteVisitPolicy')}
        onSelect={(value) => onChange('siteVisitPolicy', value)}
        options={siteVisitPolicyOptions}
        value={values.siteVisitPolicy}
      />

      <OptionGroup
        errorText={errors.availability}
        label={t('availability')}
        onSelect={(value) => onChange('availability', value)}
        options={availabilityOptions}
        value={values.availability}
      />

      <FormField
        label={t('estimatedDuration')}
        onChangeText={(value) => onChange('estimatedDuration', value)}
        value={values.estimatedDuration}
      />

      <CheckboxGroup
        errorText={errors.includedItems}
        label={t('includedItems')}
        onToggle={(value) => onChange('includedItems', toggleString(values.includedItems, value))}
        options={includedItemOptions}
        values={values.includedItems}
      />

      <CheckboxGroup
        errorText={errors.excludedItems}
        label={t('excludedItems')}
        onToggle={(value) => onChange('excludedItems', toggleString(values.excludedItems, value))}
        options={excludedItemOptions}
        values={values.excludedItems}
      />

      <FormField
        label={t('includedNotes')}
        multiline
        onChangeText={(value) => onChange('includedNotes', value)}
        value={values.includedNotes}
      />
      <FormField
        label={t('excludedNotes')}
        multiline
        onChangeText={(value) => onChange('excludedNotes', value)}
        value={values.excludedNotes}
      />
      <FormField
        label={t('earliestStartDate')}
        onChangeText={(value) => onChange('earliestStartDate', value)}
        value={values.earliestStartDate}
      />
      <FormField
        label={t('customerPreparation')}
        multiline
        onChangeText={(value) => onChange('customerPreparationNotes', value)}
        value={values.customerPreparationNotes}
      />
      <FormField
        label={t('assumptions')}
        multiline
        onChangeText={(value) => onChange('assumptions', value)}
        value={values.assumptions}
      />

      <View style={styles.stack}>
        <AppButton loading={isSubmitting} onPress={onSubmit} tone="pro">
          {isEditing ? t('updateResponse') : t('saveResponse')}
        </AppButton>
        <AppButton disabled={isSubmitting} onPress={onCancel} tone="neutral" variant="ghost">
          {t('cancel')}
        </AppButton>
      </View>
    </AppCard>
  );
}

function OptionGroup({
  errorText,
  label,
  onSelect,
  options,
  value,
}: {
  errorText?: string;
  label: string;
  onSelect: (value: string) => void;
  options: ResponseOption[];
  value: string;
}) {
  return (
    <AppCard backgroundColor={colors.proOrange50}>
      <AppText variant="bodyStrong">{label}</AppText>
      {errorText ? <AppText color={colors.danger600}>{errorText}</AppText> : null}
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[styles.optionPill, selected ? styles.optionPillSelected : null]}>
              <AppText color={selected ? colors.white : colors.slate700} variant="small">
                {t(option.labelKey)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

function CheckboxGroup({
  errorText,
  label,
  onToggle,
  options,
  values,
}: {
  errorText?: string;
  label: string;
  onToggle: (value: string) => void;
  options: ResponseOption[];
  values: string[];
}) {
  return (
    <AppCard backgroundColor={colors.proOrange50}>
      <AppText variant="bodyStrong">{label}</AppText>
      {errorText ? <AppText color={colors.danger600}>{errorText}</AppText> : null}
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => onToggle(option.value)}
              style={[styles.optionPill, selected ? styles.optionPillSelected : null]}>
              <AppText color={selected ? colors.white : colors.slate700} variant="small">
                {t(option.labelKey)}
              </AppText>
            </Pressable>
          );
        })}
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

function toggleString(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{value}</AppText>
    </View>
  );
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return t('notSpecified');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return t('notSpecified');
  return parsed.toLocaleDateString();
}

function getInitialResponseFormValues(request: NonNullable<ProviderProRequestDetailResponse['proRequest']>): ResponseFormValues {
  const defaults = request.responseEditDefaults;
  return {
    assumptions: defaults?.assumptions || '',
    availability: defaults?.availability || 'NEXT_WEEK',
    customerPreparationNotes: defaults?.customerPreparationNotes || '',
    earliestStartDate: defaults?.earliestStartDate || '',
    excludedItems: defaults?.excludedItems || [],
    excludedNotes: defaults?.excludedNotes || '',
    estimateConfidence: defaults?.estimateConfidence || 'ROUGH_ESTIMATE',
    estimatedDuration: defaults?.estimatedDuration || '',
    includedItems: defaults?.includedItems || [],
    includedNotes: defaults?.includedNotes || '',
    materialsIncluded: defaults?.materialsIncluded || 'LABOR_ONLY',
    responseType: defaults?.responseType || 'CAN_HANDLE',
    roughQuoteMax: defaults?.roughQuoteMax ? String(defaults.roughQuoteMax) : '',
    roughQuoteMin: defaults?.roughQuoteMin ? String(defaults.roughQuoteMin) : '',
    shortMessage: defaults?.shortMessage || '',
    siteVisitPolicy: defaults?.siteVisitPolicy || 'DEPENDS',
  };
}

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : Number.NaN;
}

function hasObviousContactDetails(values: ResponseFormValues) {
  const merged = [
    ...Object.values(values).filter((value): value is string => typeof value === 'string'),
    ...values.includedItems,
    ...values.excludedItems,
  ].join('\n');

  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(merged) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(merged) ||
    /(https?:\/\/|www\.|telegram|viber|whatsapp|facebook|instagram|@\w{2,})/i.test(merged);
}

function validateResponseForm(values: ResponseFormValues): ResponseFormErrors {
  const errors: ResponseFormErrors = {};
  const min = toNumberOrNull(values.roughQuoteMin);
  const max = toNumberOrNull(values.roughQuoteMax);
  const needsPriceRange = values.responseType !== 'NEEDS_SITE_VISIT' && values.responseType !== 'NEEDS_MORE_DETAILS';
  const hasPartialPrice = (min === null) !== (max === null);

  if (!responseTypeOptions.some((option) => option.value === values.responseType)) errors.responseType = t('invalidSelection');
  if (!materialsOptions.some((option) => option.value === values.materialsIncluded)) errors.materialsIncluded = t('invalidSelection');
  if (!estimateConfidenceOptions.some((option) => option.value === values.estimateConfidence)) errors.estimateConfidence = t('invalidSelection');
  if (!siteVisitPolicyOptions.some((option) => option.value === values.siteVisitPolicy)) errors.siteVisitPolicy = t('invalidSelection');
  if (!availabilityOptions.some((option) => option.value === values.availability)) errors.availability = t('invalidSelection');
  if (Number.isNaN(min)) {
    errors.roughQuoteMin = t('quoteRangeInvalid');
  }
  if (Number.isNaN(max)) {
    errors.roughQuoteMax = t('quoteRangeInvalid');
  }
  if (hasPartialPrice) {
    errors.roughQuoteMin = errors.roughQuoteMin || t('quoteRangeBothRequired');
    errors.roughQuoteMax = errors.roughQuoteMax || t('quoteRangeBothRequired');
  }
  if (needsPriceRange && min === null && max === null) {
    errors.roughQuoteMin = t('quoteRangeRequired');
    errors.roughQuoteMax = t('quoteRangeRequired');
  }
  if (min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && max < min) {
    errors.roughQuoteMax = t('quoteRangeInvalid');
  }
  if (hasObviousContactDetails(values)) {
    errors.form = t('pleaseRemoveContactDetails');
  }

  return errors;
}

function toResponsePayload(values: ResponseFormValues): ProviderProResponsePayload {
  const min = toNumberOrNull(values.roughQuoteMin);
  const max = toNumberOrNull(values.roughQuoteMax);

  return {
    assumptions: values.assumptions.trim(),
    availability: values.availability.trim(),
    customerPreparationNotes: values.customerPreparationNotes.trim(),
    earliestStartDate: values.earliestStartDate.trim() || null,
    excludedItems: values.excludedItems,
    excludedNotes: values.excludedNotes.trim(),
    estimateConfidence: values.estimateConfidence,
    estimatedDuration: values.estimatedDuration.trim(),
    includedItems: values.includedItems,
    includedNotes: values.includedNotes.trim(),
    materialsIncluded: values.materialsIncluded,
    responseType: values.responseType,
    roughQuoteMax: Number.isNaN(max) ? null : max,
    roughQuoteMin: Number.isNaN(min) ? null : min,
    shortMessage: values.shortMessage.trim(),
    siteVisitPolicy: values.siteVisitPolicy.trim(),
  };
}

function getResponseErrorMessages(details: unknown, fallbackMessage: string): ResponseFormErrors {
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      return Object.entries(fieldErrors).reduce<ResponseFormErrors>((acc, [key, value]) => {
        acc[key as keyof ResponseFormValues] = String(value);
        return acc;
      }, {});
    }
  }

  return { form: fallbackMessage };
}

function validateProviderSiteVisitForm(
  mode: Exclude<ProviderSiteVisitActionMode, null>,
  values: ProviderSiteVisitFormValues,
): ProviderSiteVisitFormErrors {
  const errors: ProviderSiteVisitFormErrors = {};
  if (mode === 'propose' && !values.proposedTimeWindow.trim()) {
    errors.proposedTimeWindow = t('proposedTimeRequired');
  }
  if (mode === 'propose' && values.proposedDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(values.proposedDate.trim())) {
    errors.proposedDate = t('preferredDateRequired');
  }
  if (hasObviousProviderSiteVisitContactDetails(values)) {
    errors.form = t('pleaseRemoveContactDetails');
  }
  return errors;
}

function hasObviousProviderSiteVisitContactDetails(values: ProviderSiteVisitFormValues) {
  const merged = Object.values(values).join('\n');
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(merged) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(merged) ||
    /(https?:\/\/|www\.|telegram|viber|whatsapp|facebook|instagram|@\w{2,})/i.test(merged);
}

function getProviderSiteVisitErrorMessages(details: unknown, fallbackMessage: string): ProviderSiteVisitFormErrors {
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      return Object.entries(fieldErrors).reduce<ProviderSiteVisitFormErrors>((acc, [key, value]) => {
        acc[key as keyof ProviderSiteVisitFormValues] = String(value);
        return acc;
      }, {});
    }
  }
  return { form: fallbackMessage || t('couldNotUpdateSiteVisit') };
}

function Images({ imageCount, images }: { imageCount: number; images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) {
    return (
      <AppCard backgroundColor={colors.white}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">{t('photos')}</AppText>
          <StatusBadge label={t('noPhotosAttached')} tone="neutral" />
        </View>
        <AppText color={colors.slate700}>{t('noPhotosAttached')}</AppText>
      </AppCard>
    );
  }

  return (
    <AppCard backgroundColor={colors.white}>
      <View style={styles.sectionHeading}>
        <AppText variant="sectionTitle">{t('photos')}</AppText>
        <StatusBadge label={t('photosAttachedCount').replace('{count}', String(imageCount || images.length))} tone="pro" />
      </View>
      <View style={styles.imageGrid}>
        {images.map((image) => <Image key={image.id} accessibilityLabel={image.alt} source={{ uri: image.url }} style={styles.image} />)}
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
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  descriptionText: { lineHeight: 22 },
  header: { gap: spacing.sm },
  heroAction: { flex: 1 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  sectionHeading: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionPill: {
    backgroundColor: colors.white,
    borderColor: colors.proAmber500,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionPillSelected: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  siteVisitInvite: {
    backgroundColor: colors.white,
    borderColor: colors.proAmber500,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  stack: { gap: spacing.sm },
  twoColumn: { gap: spacing.md },
});

function getProResponseBadgeTone(status?: string) {
  if (status === 'can_submit' || status === 'can_edit') return 'success';
  if (status === 'response_hidden' || status === 'profile_under_review') return 'warning';
  if (status === 'submitted_locked') return 'pro';
  return 'neutral';
}

function getSiteVisitTone(status?: string) {
  if (status === 'accepted' || status === 'completed' || status === 'invite_available') return 'success';
  if (status === 'invited' || status === 'alternate_time_proposed') return 'pro';
  if (status === 'declined' || status === 'cancelled' || status === 'blocked') return 'warning';
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
