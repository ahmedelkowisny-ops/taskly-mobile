import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AssistantGuideCard, FormField, ModeBadge, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import type { ProviderProfileResponse, ProviderTaskerProfile } from '@/src/lib/api/domain';
import type { ApiError } from '@/src/lib/api/types';
import { getMockProviderProfileResponse } from '@/src/lib/api/mockApi';
import { getProviderProfile, getProviderTaskerProfile, updateProviderTaskerProfile } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCoreTaskerStatusLabel, getProStatusLabel } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type TaskerDraft = {
  bio: string;
  firstName: string;
  hasCar: boolean;
  hourlyRate: string;
  languagesText: string;
  lastName: string;
  phone: string;
  serviceArea: string;
  toolsText: string;
};

type TaskerFieldErrors = Partial<Record<keyof TaskerDraft, string>>;

const emptyTaskerDraft: TaskerDraft = {
  bio: '',
  firstName: '',
  hasCar: false,
  hourlyRate: '',
  languagesText: '',
  lastName: '',
  phone: '',
  serviceArea: '',
  toolsText: '',
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { getValidAccessToken, refreshSession, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProfileResponse | null>(null);
  const [taskerProfile, setTaskerProfile] = useState<ProviderTaskerProfile | null>(null);
  const [taskerDraft, setTaskerDraft] = useState<TaskerDraft>(emptyTaskerDraft);
  const [taskerFieldErrors, setTaskerFieldErrors] = useState<TaskerFieldErrors>({});
  const [isEditingTasker, setIsEditingTasker] = useState(false);
  const [isSavingTasker, setIsSavingTasker] = useState(false);
  const [taskerNotice, setTaskerNotice] = useState<string | null>(null);
  const [taskerErrorMessage, setTaskerErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const hasTaskerChanges = useMemo(() => {
    if (!taskerProfile) return false;
    const current = toTaskerDraft(taskerProfile);

    return (
      taskerDraft.firstName.trim() !== current.firstName ||
      taskerDraft.lastName.trim() !== current.lastName ||
      taskerDraft.phone.trim() !== current.phone ||
      taskerDraft.bio.trim() !== current.bio ||
      taskerDraft.hourlyRate.trim() !== current.hourlyRate ||
      taskerDraft.serviceArea.trim() !== current.serviceArea ||
      taskerDraft.hasCar !== current.hasCar ||
      normalizeListText(taskerDraft.languagesText) !== normalizeListText(current.languagesText) ||
      normalizeListText(taskerDraft.toolsText) !== normalizeListText(current.toolsText)
    );
  }, [taskerDraft, taskerProfile]);

  const loadProfile = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);
    setTaskerErrorMessage(null);

    if (status === 'demo') {
      setData(getMockProviderProfileResponse());
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      setIsEditingTasker(false);
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      setIsEditingTasker(false);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setTaskerProfile(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const [result, taskerResult] = await Promise.all([
      getProviderProfile(authToken),
      getProviderTaskerProfile(authToken),
    ]);

    if (result.ok) {
      setData(result.data);
    } else {
      setData(null);
      setIsUnauthorized(result.status === 401 || result.status === 403);
      setErrorMessage(
        result.status === 401 || result.status === 403
          ? t('providerProfileNeedsAccess')
          : t('couldNotLoadProviderProfile'),
      );
    }

    if (taskerResult.ok) {
      setTaskerProfile(taskerResult.data.profile);
      setTaskerDraft(toTaskerDraft(taskerResult.data.profile));
      setTaskerFieldErrors({});
    } else {
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      if (taskerResult.status !== 404) {
        setTaskerErrorMessage(
          taskerResult.status === 401 || taskerResult.status === 403
            ? t('providerProfileNeedsAccess')
            : t('couldNotLoadTaskerProfile'),
        );
      }
    }

    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const profile = data?.profile;

  function beginTaskerEdit() {
    if (!taskerProfile) return;
    setTaskerDraft(toTaskerDraft(taskerProfile));
    setTaskerFieldErrors({});
    setTaskerNotice(null);
    setTaskerErrorMessage(null);
    setIsEditingTasker(true);
  }

  function cancelTaskerEdit() {
    if (taskerProfile) {
      setTaskerDraft(toTaskerDraft(taskerProfile));
    }
    setTaskerFieldErrors({});
    setTaskerNotice(null);
    setTaskerErrorMessage(null);
    setIsEditingTasker(false);
  }

  async function handleSaveTasker() {
    const validation = validateTaskerDraft(taskerDraft);
    setTaskerFieldErrors(validation);
    setTaskerNotice(null);
    setTaskerErrorMessage(null);

    if (Object.keys(validation).length > 0 || !hasTaskerChanges) {
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setTaskerErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsSavingTasker(true);
    const result = await updateProviderTaskerProfile(
      {
        bio: taskerDraft.bio.trim(),
        firstName: taskerDraft.firstName.trim(),
        hasCar: taskerDraft.hasCar,
        hourlyRate: taskerDraft.hourlyRate.trim(),
        languagesSpoken: parseListText(taskerDraft.languagesText),
        lastName: taskerDraft.lastName.trim(),
        phone: taskerDraft.phone.trim(),
        serviceArea: taskerDraft.serviceArea.trim(),
        toolsEquipment: parseListText(taskerDraft.toolsText),
      },
      authToken,
    );
    setIsSavingTasker(false);

    if (!result.ok) {
      setTaskerFieldErrors(getTaskerFieldErrorsFromApiError(result.error));
      setTaskerErrorMessage(t('couldNotSaveTaskerProfile'));
      return;
    }

    setTaskerProfile(result.data.profile);
    setTaskerDraft(toTaskerDraft(result.data.profile));
    setTaskerFieldErrors({});
    setIsEditingTasker(false);
    setTaskerNotice(t('taskerProfileSaved'));
    await refreshSession();
    await loadProfile();
  }

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('profile')}</AppText>
        <AppText color={colors.slate700}>{t('providerProfileIntro')}</AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label="Loading" tone="neutral" />
          <AppText variant="sectionTitle">{t('loadingProviderProfile')}</AppText>
          <AppText color={colors.slate700}>{t('loadingProviderProfileBody')}</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? t('providerProfileNeedsAccessTitle') : t('couldNotRefreshProviderProfile')}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadProfile} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {profile ? (
        <AppCard>
          <StatusBadge label={status === 'demo' ? t('demoMode') : t('liveProfile')} tone={status === 'demo' ? 'neutral' : 'success'} />
          <AppText variant="sectionTitle">{profile.displayName}</AppText>
          <AppText color={colors.slate700}>{profile.profileStrengthLabel}</AppText>
          <AppText color={colors.slate700}>{profile.stripeStatusLabel}</AppText>
        </AppCard>
      ) : null}

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleBlock}>
            <ModeBadge mode="providerCore" />
            <AppText variant="sectionTitle">{t('tasklyTaskerProfile')}</AppText>
          </View>
          {!isEditingTasker && taskerProfile && status === 'authenticated' ? (
            <AppButton onPress={beginTaskerEdit} style={styles.headerButton} variant="outline">
              {t('edit')}
            </AppButton>
          ) : null}
        </View>
        <AppText color={colors.slate700}>
          {profile ? getCoreTaskerStatusLabel(profile.coreTaskerStatus) : t('taskerProfileEmptyHelper')}
        </AppText>
        {profile?.coreCities.length ? <AppText color={colors.slate500}>Cities: {profile.coreCities.join(', ')}</AppText> : null}
        {profile?.coreCategories.length ? <AppText color={colors.slate500}>Categories: {profile.coreCategories.join(', ')}</AppText> : null}

        {taskerErrorMessage ? <InlineMessage message={taskerErrorMessage} tone="error" /> : null}
        {taskerNotice ? <InlineMessage message={taskerNotice} tone="success" /> : null}
        {status === 'demo' ? <InlineMessage message={t('taskerProfileEditUnavailableDemo')} tone="neutral" /> : null}

        {taskerProfile ? (
          <View style={styles.form}>
            <FormField
              autoCapitalize="words"
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.firstName}
              label={t('firstNameLabel')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, firstName: value }))}
              value={taskerDraft.firstName}
            />
            <FormField
              autoCapitalize="words"
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.lastName}
              label={t('lastNameLabel')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, lastName: value }))}
              value={taskerDraft.lastName}
            />
            <FormField
              autoComplete="tel"
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.phone}
              keyboardType="phone-pad"
              label={t('phoneLabel')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, phone: value }))}
              value={taskerDraft.phone}
            />
            <FormField
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.bio}
              label={t('taskerBio')}
              multiline
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, bio: value }))}
              value={taskerDraft.bio}
            />
            <FormField
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.hourlyRate}
              keyboardType="decimal-pad"
              label={t('hourlyRate')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, hourlyRate: value }))}
              value={taskerDraft.hourlyRate}
            />
            <FormField
              editable={isEditingTasker && !isSavingTasker}
              errorText={taskerFieldErrors.serviceArea}
              label={t('serviceArea')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, serviceArea: value }))}
              value={taskerDraft.serviceArea}
            />
            <FormField
              editable={isEditingTasker && !isSavingTasker}
              helperText={t('commaSeparatedHelper')}
              label={t('languagesSpoken')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, languagesText: value }))}
              value={taskerDraft.languagesText}
            />
            <FormField
              editable={isEditingTasker && !isSavingTasker}
              helperText={t('commaSeparatedHelper')}
              label={t('toolsEquipment')}
              onChangeText={(value) => setTaskerDraft((current) => ({ ...current, toolsText: value }))}
              value={taskerDraft.toolsText}
            />
            <View style={styles.toggleBlock}>
              <AppText variant="bodyStrong">{t('hasCar')}</AppText>
              <View style={styles.toggleRow}>
                <ToggleChip disabled={!isEditingTasker || isSavingTasker} label={t('yes')} onPress={() => setTaskerDraft((current) => ({ ...current, hasCar: true }))} selected={taskerDraft.hasCar} />
                <ToggleChip disabled={!isEditingTasker || isSavingTasker} label={t('no')} onPress={() => setTaskerDraft((current) => ({ ...current, hasCar: false }))} selected={!taskerDraft.hasCar} />
              </View>
            </View>

            <InfoRow label={t('accountEmail')} value={taskerProfile.email || t('emailNotAvailable')} />
            <InfoRow label={t('taskerStatus')} value={taskerProfile.taskerStatus} />
            {taskerProfile.cityLabel ? <InfoRow label={t('city')} value={taskerProfile.cityLabel} /> : null}
            {taskerProfile.serviceCategories.length ? <InfoRow label={t('category')} value={taskerProfile.serviceCategories.join(', ')} /> : null}
            <AppText color={colors.slate500} variant="small">
              {t('taskerProfileReadonlyNote')}
            </AppText>

            {isEditingTasker ? (
              <View style={styles.actionRow}>
                <AppButton disabled={isSavingTasker} onPress={cancelTaskerEdit} style={styles.actionButton} tone="neutral" variant="outline">
                  {t('cancel')}
                </AppButton>
                {hasTaskerChanges ? (
                  <AppButton disabled={isSavingTasker} loading={isSavingTasker} onPress={handleSaveTasker} style={styles.actionButton}>
                    {isSavingTasker ? t('savingChanges') : t('saveChanges')}
                  </AppButton>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </AppCard>

      <AppCard accentColor={colors.proOrange600}>
        <ModeBadge mode="providerPro" />
        <AppText variant="sectionTitle">{t('proProfessionalProfile')}</AppText>
        <AppText color={colors.slate700}>
          {profile ? getProStatusLabel(profile.proStatus) : t('proProfileContactProtected')}
        </AppText>
        {profile?.proCities.length ? <AppText color={colors.slate500}>Cities: {profile.proCities.join(', ')}</AppText> : null}
        {profile?.proCategories.length ? (
          <View style={{ gap: spacing.xs }}>
            {profile.proCategories.map((category) => (
              <StatusBadge
                key={`${category.label}-${category.status}`}
                label={`${category.label}: ${category.status}`}
                tone={category.status === 'approved' ? 'success' : category.status === 'rejected' ? 'danger' : 'warning'}
              />
            ))}
          </View>
        ) : null}
        {profile ? <AppText color={colors.slate500}>Portfolio projects: {profile.portfolioProjectsCount}</AppText> : null}
      </AppCard>

      <AppCard>
        <StatusBadge label="Settings" tone="neutral" />
        <AppText variant="sectionTitle">{t('providerAccount')}</AppText>
        <AppText color={colors.slate700}>{t('providerAccountHelper')}</AppText>
        <AppButton onPress={() => router.push('/provider/account')} variant="outline">
          {t('openAccount')}
        </AppButton>
        <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
          {t('startProviderWorkspace')}
        </AppButton>
      </AppCard>

      <AssistantGuideCard
        body={t('providerProfileReadinessBody')}
        title={t('profileReadiness')}
        tone="pro"
      />

      <WorkspaceSwitchHint />
    </Screen>
  );
}

function toTaskerDraft(profile: ProviderTaskerProfile): TaskerDraft {
  return {
    bio: profile.bio,
    firstName: profile.firstName,
    hasCar: profile.hasCar,
    hourlyRate: profile.hourlyRate,
    languagesText: profile.languagesSpoken.join(', '),
    lastName: profile.lastName,
    phone: profile.phone,
    serviceArea: profile.serviceArea,
    toolsText: profile.toolsEquipment.join(', '),
  };
}

function parseListText(value: string) {
  const seen = new Set<string>();
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item.toLowerCase())) return false;
      seen.add(item.toLowerCase());
      return true;
    })
    .slice(0, 20);
}

function normalizeListText(value: string) {
  return parseListText(value).join(', ');
}

function validateTaskerDraft(draft: TaskerDraft): TaskerFieldErrors {
  const errors: TaskerFieldErrors = {};
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const phone = draft.phone.trim();
  const bio = draft.bio.trim();
  const serviceArea = draft.serviceArea.trim();
  const hourlyRate = draft.hourlyRate.trim();
  const hourlyRateNumber = hourlyRate ? Number(hourlyRate.replace(',', '.')) : null;

  if (!firstName) errors.firstName = t('profileFirstNameRequired');
  if (!lastName) errors.lastName = t('profileLastNameRequired');
  if (firstName.length > 100) errors.firstName = t('profileNameTooLong');
  if (lastName.length > 100) errors.lastName = t('profileNameTooLong');
  if (phone.length > 20) errors.phone = t('profilePhoneTooLong');
  if (bio.length > 2000) errors.bio = t('taskerBioTooLong');
  if (serviceArea.length > 255) errors.serviceArea = t('serviceAreaTooLong');
  if (hourlyRate && (!Number.isFinite(hourlyRateNumber) || Number(hourlyRateNumber) < 0)) {
    errors.hourlyRate = t('hourlyRateInvalid');
  }

  return errors;
}

function getTaskerFieldErrorsFromApiError(error: ApiError): TaskerFieldErrors {
  const details = error.details;
  if (!details || typeof details !== 'object' || !('fields' in details)) {
    return {};
  }

  const fields = (details as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  const fieldErrors: TaskerFieldErrors = {};
  const record = fields as Record<string, unknown>;
  if (record.firstName) fieldErrors.firstName = t('profileFirstNameRequired');
  if (record.lastName) fieldErrors.lastName = t('profileLastNameRequired');
  if (record.phone) fieldErrors.phone = t('profilePhoneTooLong');
  if (record.bio) fieldErrors.bio = t('taskerBioTooLong');
  if (record.serviceArea) fieldErrors.serviceArea = t('serviceAreaTooLong');
  if (record.hourlyRate) fieldErrors.hourlyRate = t('hourlyRateInvalid');

  return fieldErrors;
}

function ToggleChip({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleChip,
        selected ? styles.toggleChipSelected : null,
        { opacity: disabled ? 0.6 : pressed ? 0.82 : 1 },
      ]}>
      <AppText color={selected ? colors.tasklyBlue700 : colors.slate500} variant="bodyStrong">
        {label}
      </AppText>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText color={colors.navy900} style={styles.infoValue}>
        {value}
      </AppText>
    </View>
  );
}

function InlineMessage({ message, tone }: { message: string; tone: 'error' | 'neutral' | 'success' }) {
  return (
    <View style={[styles.inlineMessage, styles[`${tone}Message`]]}>
      <AppText
        color={tone === 'error' ? colors.warning600 : tone === 'success' ? colors.tasklyBlue700 : colors.slate500}
        variant="small">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorMessage: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  headerButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  inlineMessage: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  neutralMessage: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  successMessage: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  toggleBlock: {
    gap: spacing.xs,
  },
  toggleChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
