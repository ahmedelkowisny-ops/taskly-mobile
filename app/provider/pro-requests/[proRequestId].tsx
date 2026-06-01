import { useFocusEffect } from '@react-navigation/native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

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
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ResponseFormValues = {
  assumptions: string;
  availability: string;
  customerPreparationNotes: string;
  earliestStartDate: string;
  excludedNotes: string;
  includedNotes: string;
  materialsIncluded: boolean | null;
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
  availability: '',
  customerPreparationNotes: '',
  earliestStartDate: '',
  excludedNotes: '',
  includedNotes: '',
  materialsIncluded: null,
  roughQuoteMax: '',
  roughQuoteMin: '',
  shortMessage: '',
  siteVisitPolicy: '',
};

const emptySiteVisitFormValues: ProviderSiteVisitFormValues = {
  message: '',
  proposedDate: '',
  proposedTimeWindow: '',
  reason: '',
};

export default function ProviderProRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proRequestId?: string }>();
  const proRequestId = String(params.proRequestId || 'demo-provider-pro');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
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
      setStateLabel('Login required');
      setMessage('Login is required to load this provider Taskly Pro project.');
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this provider Taskly Pro project.');
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
    setMessage(result.status === 404 ? 'This Taskly Pro project was not found or is not available to this provider account.' : 'Could not load this Taskly Pro project.');
  }, [getValidAccessToken, proRequestId, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const request = data?.proRequest;

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

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="providerPro" />
        <AppButton onPress={() => router.back()} variant="ghost">Back</AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message={t('loadingProviderProDetail')} /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} tone="pro" variant="outline">Retry</AppButton>
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
            <StatusBadge label={request.eligibility.reasonLabel} tone={request.eligibility.isEligibleToRespond ? 'success' : 'warning'} />
            <Info label={t('budget')} value={request.budgetLabel} />
            <Info label={t('timeline')} value={request.timelineLabel} />
            <Info label={t('created')} value={new Date(request.createdAt).toLocaleDateString()} />
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

          <Images images={request.images} />

          <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <AppText variant="sectionTitle">{t('proResponse')}</AppText>
            {request.myResponse ? (
              <>
                <StatusBadge label={request.myResponse.statusLabel} tone="success" />
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
                {request.proChat?.capabilities.canRead && (request.proChat.messageThreadId || request.messageThreadId) ? (
                  <AppButton onPress={openProChat} tone="pro" variant="outline">
                    {t('openProChat')}
                  </AppButton>
                ) : null}
              </>
            ) : (
              <AppText color={colors.slate700}>{t('noProResponseSubmitted')}</AppText>
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
            placeholder="2026-06-15"
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
        <View style={styles.twoColumn}>
          <FormField
            errorText={errors.roughQuoteMin}
            keyboardType="decimal-pad"
            label={t('minimumQuote')}
            onChangeText={(value) => onChange('roughQuoteMin', value)}
            placeholder="EUR"
            value={values.roughQuoteMin}
          />
          <FormField
            errorText={errors.roughQuoteMax}
            keyboardType="decimal-pad"
            label={t('maximumQuote')}
            onChangeText={(value) => onChange('roughQuoteMax', value)}
            placeholder="EUR"
            value={values.roughQuoteMax}
          />
        </View>
      </AppCard>

      <AppCard backgroundColor={colors.proOrange50}>
        <AppText variant="bodyStrong">{t('materialsIncluded')}</AppText>
        <View style={styles.segmentRow}>
          <AppButton
            onPress={() => onChange('materialsIncluded', true)}
            tone="pro"
            variant={values.materialsIncluded === true ? 'filled' : 'outline'}>
            {t('yes')}
          </AppButton>
          <AppButton
            onPress={() => onChange('materialsIncluded', false)}
            tone="pro"
            variant={values.materialsIncluded === false ? 'filled' : 'outline'}>
            {t('no')}
          </AppButton>
          <AppButton
            onPress={() => onChange('materialsIncluded', null)}
            tone="neutral"
            variant={values.materialsIncluded === null ? 'filled' : 'outline'}>
            {t('toBeConfirmed')}
          </AppButton>
        </View>
      </AppCard>

      <FormField
        label={t('whatIsIncluded')}
        multiline
        onChangeText={(value) => onChange('includedNotes', value)}
        value={values.includedNotes}
      />
      <FormField
        label={t('whatIsNotIncluded')}
        multiline
        onChangeText={(value) => onChange('excludedNotes', value)}
        value={values.excludedNotes}
      />
      <FormField
        label={t('availability')}
        onChangeText={(value) => onChange('availability', value)}
        placeholder="NEXT_WEEK"
        value={values.availability}
      />
      <FormField
        label={t('earliestStartDate')}
        onChangeText={(value) => onChange('earliestStartDate', value)}
        placeholder="2026-06-01"
        value={values.earliestStartDate}
      />
      <FormField
        label={t('siteVisitPolicy')}
        onChangeText={(value) => onChange('siteVisitPolicy', value)}
        placeholder="DEPENDS"
        value={values.siteVisitPolicy}
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

function getInitialResponseFormValues(request: NonNullable<ProviderProRequestDetailResponse['proRequest']>): ResponseFormValues {
  const defaults = request.responseEditDefaults;
  return {
    assumptions: defaults?.assumptions || '',
    availability: defaults?.availability || '',
    customerPreparationNotes: defaults?.customerPreparationNotes || '',
    earliestStartDate: defaults?.earliestStartDate || '',
    excludedNotes: defaults?.excludedNotes || '',
    includedNotes: defaults?.includedNotes || '',
    materialsIncluded: defaults?.materialsIncluded
      ? defaults.materialsIncluded === 'LABOR_AND_MATERIALS' || defaults.materialsIncluded === 'PARTIAL_MATERIALS'
      : null,
    roughQuoteMax: defaults?.roughQuoteMax ? String(defaults.roughQuoteMax) : '',
    roughQuoteMin: defaults?.roughQuoteMin ? String(defaults.roughQuoteMin) : '',
    shortMessage: defaults?.shortMessage || '',
    siteVisitPolicy: defaults?.siteVisitPolicy || '',
  };
}

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : Number.NaN;
}

function hasObviousContactDetails(values: ResponseFormValues) {
  const merged = Object.values(values)
    .filter((value) => typeof value === 'string')
    .join('\n');

  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(merged) ||
    /(?:\+?\d[\d\s().-]{6,}\d)/.test(merged) ||
    /(https?:\/\/|www\.|telegram|viber|whatsapp|facebook|instagram|@\w{2,})/i.test(merged);
}

function validateResponseForm(values: ResponseFormValues): ResponseFormErrors {
  const errors: ResponseFormErrors = {};
  const min = toNumberOrNull(values.roughQuoteMin);
  const max = toNumberOrNull(values.roughQuoteMax);

  if (!values.shortMessage.trim()) {
    errors.shortMessage = t('shortMessageRequired');
  }
  if (Number.isNaN(min)) {
    errors.roughQuoteMin = t('quoteRangeInvalid');
  }
  if (Number.isNaN(max)) {
    errors.roughQuoteMax = t('quoteRangeInvalid');
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
    currency: 'EUR',
    customerPreparationNotes: values.customerPreparationNotes.trim(),
    earliestStartDate: values.earliestStartDate.trim() || null,
    excludedNotes: values.excludedNotes.trim(),
    includedNotes: values.includedNotes.trim(),
    materialsIncluded: values.materialsIncluded,
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

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <AppText variant="sectionTitle">{t('images')}</AppText>
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
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
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
