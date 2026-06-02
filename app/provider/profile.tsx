import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { FormField, ModeBadge, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import type {
  ProviderProPortfolioProject,
  ProviderProPortfolioImageType,
  ProviderProProfile,
  ProviderProfileResponse,
  ProviderTaskerProfile,
} from '@/src/lib/api/domain';
import type { ApiError } from '@/src/lib/api/types';
import { getMockProviderProfileResponse } from '@/src/lib/api/mockApi';
import {
  createProviderProPortfolioProject,
  deleteProviderProPortfolioProject,
  getProviderProPortfolio,
  getProviderProfile,
  getProviderProProfile,
  getProviderTaskerProfile,
  updateProviderProPortfolioProject,
  updateProviderProProfile,
  updateProviderTaskerProfile,
} from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCoreTaskerStatusLabel, getProStatusLabel, hasApprovedProMode } from '@/src/lib/auth/workspaceAccess';
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

type ProDraft = {
  bio: string;
  businessType: string;
  displayName: string;
  internalEmail: string;
  internalPhone: string;
  invoiceAvailable: boolean;
  languagesText: string;
  profileImageUrl: string;
  quotePreference: string;
  siteVisitPreference: string;
  teamSize: string;
  tradeName: string;
  warrantyNote: string;
  yearsExperience: string;
};

type ProProjectDraft = {
  approximateDuration: string;
  categoryName: string;
  cityName: string;
  customerPermissionConfirmed: boolean;
  description: string;
  imageType: ProviderProPortfolioImageType;
  imageUrlsText: string;
  optionalPriceRange: string;
  title: string;
};

type ProFieldErrors = Partial<Record<keyof ProDraft, string>>;
type ProProjectFieldErrors = Partial<Record<keyof ProProjectDraft, string>>;

const emptyProDraft: ProDraft = {
  bio: '',
  businessType: '',
  displayName: '',
  internalEmail: '',
  internalPhone: '',
  invoiceAvailable: false,
  languagesText: '',
  profileImageUrl: '',
  quotePreference: '',
  siteVisitPreference: '',
  teamSize: '',
  tradeName: '',
  warrantyNote: '',
  yearsExperience: '',
};

const emptyProProjectDraft: ProProjectDraft = {
  approximateDuration: '',
  categoryName: '',
  cityName: '',
  customerPermissionConfirmed: false,
  description: '',
  imageType: 'GENERAL',
  imageUrlsText: '',
  optionalPriceRange: '',
  title: '',
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { getValidAccessToken, refreshSession, session: authSession, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProfileResponse | null>(null);
  const [taskerProfile, setTaskerProfile] = useState<ProviderTaskerProfile | null>(null);
  const [taskerDraft, setTaskerDraft] = useState<TaskerDraft>(emptyTaskerDraft);
  const [taskerFieldErrors, setTaskerFieldErrors] = useState<TaskerFieldErrors>({});
  const [isEditingTasker, setIsEditingTasker] = useState(false);
  const [isSavingTasker, setIsSavingTasker] = useState(false);
  const [taskerNotice, setTaskerNotice] = useState<string | null>(null);
  const [taskerErrorMessage, setTaskerErrorMessage] = useState<string | null>(null);
  const [proProfile, setProProfile] = useState<ProviderProProfile | null>(null);
  const [proDraft, setProDraft] = useState<ProDraft>(emptyProDraft);
  const [proFieldErrors, setProFieldErrors] = useState<ProFieldErrors>({});
  const [isEditingPro, setIsEditingPro] = useState(false);
  const [isSavingPro, setIsSavingPro] = useState(false);
  const [proNotice, setProNotice] = useState<string | null>(null);
  const [proErrorMessage, setProErrorMessage] = useState<string | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<ProviderProPortfolioProject[]>([]);
  const [projectDraft, setProjectDraft] = useState<ProProjectDraft>(emptyProProjectDraft);
  const [projectFieldErrors, setProjectFieldErrors] = useState<ProProjectFieldErrors>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProjectId, setIsDeletingProjectId] = useState<string | null>(null);
  const [projectErrorMessage, setProjectErrorMessage] = useState<string | null>(null);
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
  const hasProChanges = useMemo(() => {
    if (!proProfile) return false;
    const current = toProDraft(proProfile);

    return (
      proDraft.displayName.trim() !== current.displayName ||
      proDraft.tradeName.trim() !== current.tradeName ||
      proDraft.bio.trim() !== current.bio ||
      proDraft.businessType.trim() !== current.businessType ||
      proDraft.yearsExperience.trim() !== current.yearsExperience ||
      proDraft.teamSize.trim() !== current.teamSize ||
      proDraft.invoiceAvailable !== current.invoiceAvailable ||
      proDraft.siteVisitPreference.trim() !== current.siteVisitPreference ||
      proDraft.quotePreference.trim() !== current.quotePreference ||
      proDraft.warrantyNote.trim() !== current.warrantyNote ||
      proDraft.internalPhone.trim() !== current.internalPhone ||
      proDraft.internalEmail.trim() !== current.internalEmail ||
      proDraft.profileImageUrl.trim() !== current.profileImageUrl ||
      normalizeListText(proDraft.languagesText) !== normalizeListText(current.languagesText)
    );
  }, [proDraft, proProfile]);

  const loadProfile = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);
    setTaskerErrorMessage(null);
    setProErrorMessage(null);
    setProjectErrorMessage(null);

    if (status === 'demo') {
      setData(getMockProviderProfileResponse());
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      setIsEditingTasker(false);
      setProProfile(null);
      setProDraft(emptyProDraft);
      setPortfolioProjects([]);
      setIsEditingPro(false);
      setIsProjectFormOpen(false);
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      setIsEditingTasker(false);
      setProProfile(null);
      setProDraft(emptyProDraft);
      setPortfolioProjects([]);
      setIsEditingPro(false);
      setIsProjectFormOpen(false);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setTaskerProfile(null);
      setProProfile(null);
      setPortfolioProjects([]);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const [result, taskerResult, proResult, portfolioResult] = await Promise.all([
      getProviderProfile(authToken),
      getProviderTaskerProfile(authToken),
      getProviderProProfile(authToken),
      getProviderProPortfolio(authToken),
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

    if (proResult.ok) {
      setProProfile(proResult.data.profile);
      setProDraft(toProDraft(proResult.data.profile));
      setProFieldErrors({});
    } else {
      setProProfile(null);
      setProDraft(emptyProDraft);
      if (proResult.status !== 404) {
        setProErrorMessage(
          proResult.status === 401 || proResult.status === 403
            ? t('providerProfileNeedsAccess')
            : t('couldNotLoadProProfile'),
        );
      }
    }

    if (portfolioResult.ok) {
      setPortfolioProjects(portfolioResult.data.projects);
      setProjectFieldErrors({});
    } else {
      setPortfolioProjects([]);
      if (portfolioResult.status !== 404) {
        setProjectErrorMessage(
          portfolioResult.status === 401 || portfolioResult.status === 403
            ? t('providerProfileNeedsAccess')
            : t('couldNotLoadProPortfolio'),
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
  const showProProfileTools = status === 'demo' || hasApprovedProMode(authSession) || profile?.proStatus === 'approved';
  const readinessItems = buildTaskerReadinessItems(taskerProfile, profile);

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

  function beginProEdit() {
    if (!proProfile) return;
    setProDraft(toProDraft(proProfile));
    setProFieldErrors({});
    setProNotice(null);
    setProErrorMessage(null);
    setIsEditingPro(true);
  }

  function cancelProEdit() {
    if (proProfile) {
      setProDraft(toProDraft(proProfile));
    }
    setProFieldErrors({});
    setProNotice(null);
    setProErrorMessage(null);
    setIsEditingPro(false);
  }

  async function handleSavePro() {
    const validation = validateProDraft(proDraft);
    setProFieldErrors(validation);
    setProNotice(null);
    setProErrorMessage(null);

    if (Object.keys(validation).length > 0 || !hasProChanges) {
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsSavingPro(true);
    const result = await updateProviderProProfile(
      {
        bio: proDraft.bio.trim(),
        businessType: proDraft.businessType.trim(),
        displayName: proDraft.displayName.trim(),
        internalEmail: proDraft.internalEmail.trim(),
        internalPhone: proDraft.internalPhone.trim(),
        invoiceAvailable: proDraft.invoiceAvailable,
        languages: parseListText(proDraft.languagesText),
        profileImageUrl: proDraft.profileImageUrl.trim(),
        quotePreference: proDraft.quotePreference.trim(),
        siteVisitPreference: proDraft.siteVisitPreference.trim(),
        teamSize: proDraft.teamSize.trim(),
        tradeName: proDraft.tradeName.trim(),
        warrantyNote: proDraft.warrantyNote.trim(),
        yearsExperience: proDraft.yearsExperience.trim(),
      },
      authToken,
    );
    setIsSavingPro(false);

    if (!result.ok) {
      setProFieldErrors(getProFieldErrorsFromApiError(result.error));
      setProErrorMessage(t('couldNotSaveProProfile'));
      return;
    }

    setProProfile(result.data.profile);
    setProDraft(toProDraft(result.data.profile));
    setProFieldErrors({});
    setIsEditingPro(false);
    setProNotice(t('proProfileSaved'));
    await loadProfile();
  }

  function beginCreateProject() {
    setEditingProjectId(null);
    setProjectDraft(emptyProProjectDraft);
    setProjectFieldErrors({});
    setProjectErrorMessage(null);
    setIsProjectFormOpen(true);
  }

  function beginEditProject(project: ProviderProPortfolioProject) {
    setEditingProjectId(project.id);
    setProjectDraft(toProjectDraft(project));
    setProjectFieldErrors({});
    setProjectErrorMessage(null);
    setIsProjectFormOpen(true);
  }

  function cancelProjectEdit() {
    setEditingProjectId(null);
    setProjectDraft(emptyProProjectDraft);
    setProjectFieldErrors({});
    setProjectErrorMessage(null);
    setIsProjectFormOpen(false);
  }

  async function handleSaveProject() {
    const validation = validateProjectDraft(projectDraft);
    setProjectFieldErrors(validation);
    setProjectErrorMessage(null);

    if (Object.keys(validation).length > 0) {
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProjectErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    const payload = {
      approximateDuration: projectDraft.approximateDuration.trim(),
      categoryName: projectDraft.categoryName.trim(),
      cityName: projectDraft.cityName.trim(),
      customerPermissionConfirmed: projectDraft.customerPermissionConfirmed,
      description: projectDraft.description.trim(),
      imageType: projectDraft.imageType,
      imageUrls: parseLineListText(projectDraft.imageUrlsText),
      optionalPriceRange: projectDraft.optionalPriceRange.trim(),
      title: projectDraft.title.trim(),
    };

    setIsSavingProject(true);
    const result = editingProjectId
      ? await updateProviderProPortfolioProject(editingProjectId, payload, authToken)
      : await createProviderProPortfolioProject(payload, authToken);
    setIsSavingProject(false);

    if (!result.ok) {
      setProjectFieldErrors(getProjectFieldErrorsFromApiError(result.error));
      setProjectErrorMessage(t('couldNotSaveProPortfolioProject'));
      return;
    }

    setPortfolioProjects((current) => {
      const next = current.filter((project) => project.id !== result.data.project.id);
      return [result.data.project, ...next];
    });
    setProjectDraft(emptyProProjectDraft);
    setEditingProjectId(null);
    setIsProjectFormOpen(false);
    setProjectFieldErrors({});
    setProNotice(t('proPortfolioProjectSaved'));
  }

  async function handleDeleteProject(projectId: string) {
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProjectErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsDeletingProjectId(projectId);
    setProjectErrorMessage(null);
    const result = await deleteProviderProPortfolioProject(projectId, authToken);
    setIsDeletingProjectId(null);

    if (!result.ok) {
      setProjectErrorMessage(t('couldNotDeleteProPortfolioProject'));
      return;
    }

    setPortfolioProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingProjectId === projectId) {
      cancelProjectEdit();
    }
    setProNotice(t('proPortfolioProjectDeleted'));
  }

  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <StatusBadge label={t('tasklyTaskerWorkspace')} tone="core" />
        <AppText variant="screenTitle">{t('profile')}</AppText>
        <AppText color={colors.slate700}>{t('providerProfileIntro')}</AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label={t('loading')} tone="neutral" />
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

      {taskerProfile ? (
        <ProfilePhotoCard profile={taskerProfile} />
      ) : null}

      {profile ? (
        <AppCard backgroundColor={colors.tasklyBlue50}>
          <StatusBadge label={status === 'demo' ? t('demoMode') : t('liveProfile')} tone={status === 'demo' ? 'neutral' : 'success'} />
          <AppText variant="sectionTitle">{profile.displayName}</AppText>
          <AppText color={colors.slate700}>{profile.profileStrengthLabel}</AppText>
        </AppCard>
      ) : null}

      <TaskerReadinessCard items={readinessItems} stripeStatusLabel={profile?.stripeStatusLabel ?? null} />

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
            <InfoRow label={t('cityCoverage')} value={taskerProfile.cityLabel || t('needsAttention')} />
            <InfoRow label={t('serviceCategoriesLabel')} value={taskerProfile.serviceCategories.length ? taskerProfile.serviceCategories.join(', ') : t('needsAttention')} />
            <InfoRow label={t('skillsAndTools')} value={formatProfileList([...taskerProfile.toolsEquipment, ...taskerProfile.languagesSpoken])} />
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

      {showProProfileTools ? (
      <AppCard accentColor={colors.proOrange600}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleBlock}>
            <ModeBadge mode="providerPro" />
            <AppText variant="sectionTitle">{t('proProfessionalProfile')}</AppText>
          </View>
          {!isEditingPro && proProfile && status === 'authenticated' ? (
            <AppButton onPress={beginProEdit} style={styles.headerButton} tone="pro" variant="outline">
              {t('edit')}
            </AppButton>
          ) : null}
        </View>
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
        {profile ? <AppText color={colors.slate500}>{t('portfolioProjectsCount')}: {profile.portfolioProjectsCount}</AppText> : null}

        {proErrorMessage ? <InlineMessage message={proErrorMessage} tone="error" /> : null}
        {projectErrorMessage ? <InlineMessage message={projectErrorMessage} tone="error" /> : null}
        {proNotice ? <InlineMessage message={proNotice} tone="success" /> : null}
        {status === 'demo' ? <InlineMessage message={t('proProfileEditUnavailableDemo')} tone="neutral" /> : null}

        {proProfile ? (
          <View style={styles.form}>
            <FormField
              autoCapitalize="words"
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.displayName}
              label={t('proDisplayName')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, displayName: value }))}
              value={proDraft.displayName}
            />
            <FormField
              autoCapitalize="words"
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.tradeName}
              label={t('proTradeName')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, tradeName: value }))}
              value={proDraft.tradeName}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.bio}
              label={t('proBio')}
              multiline
              onChangeText={(value) => setProDraft((current) => ({ ...current, bio: value }))}
              value={proDraft.bio}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.businessType}
              label={t('businessType')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, businessType: value }))}
              value={proDraft.businessType}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.yearsExperience}
              keyboardType="number-pad"
              label={t('yearsExperience')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, yearsExperience: value }))}
              value={proDraft.yearsExperience}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.teamSize}
              keyboardType="number-pad"
              label={t('teamSize')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, teamSize: value }))}
              value={proDraft.teamSize}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              label={t('siteVisitPreference')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, siteVisitPreference: value }))}
              value={proDraft.siteVisitPreference}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              label={t('quotePreference')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, quotePreference: value }))}
              value={proDraft.quotePreference}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              label={t('warrantyNote')}
              multiline
              onChangeText={(value) => setProDraft((current) => ({ ...current, warrantyNote: value }))}
              value={proDraft.warrantyNote}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              helperText={t('commaSeparatedHelper')}
              label={t('languagesSpoken')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, languagesText: value }))}
              value={proDraft.languagesText}
            />
            <FormField
              editable={isEditingPro && !isSavingPro}
              errorText={proFieldErrors.profileImageUrl}
              label={t('profileImageUrl')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, profileImageUrl: value }))}
              value={proDraft.profileImageUrl}
            />
            <FormField
              autoComplete="tel"
              editable={isEditingPro && !isSavingPro}
              label={t('internalPhone')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, internalPhone: value }))}
              value={proDraft.internalPhone}
            />
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              editable={isEditingPro && !isSavingPro}
              keyboardType="email-address"
              label={t('internalEmail')}
              onChangeText={(value) => setProDraft((current) => ({ ...current, internalEmail: value }))}
              value={proDraft.internalEmail}
            />
            <View style={styles.toggleBlock}>
              <AppText variant="bodyStrong">{t('invoiceAvailable')}</AppText>
              <View style={styles.toggleRow}>
                <ToggleChip disabled={!isEditingPro || isSavingPro} label={t('yes')} onPress={() => setProDraft((current) => ({ ...current, invoiceAvailable: true }))} selected={proDraft.invoiceAvailable} />
                <ToggleChip disabled={!isEditingPro || isSavingPro} label={t('no')} onPress={() => setProDraft((current) => ({ ...current, invoiceAvailable: false }))} selected={!proDraft.invoiceAvailable} />
              </View>
            </View>
            <InfoRow label={t('proStatus')} value={proProfile.status} />
            {proProfile.cityLabels.length ? <InfoRow label={t('city')} value={proProfile.cityLabels.join(', ')} /> : null}
            {proProfile.categories.length ? <InfoRow label={t('category')} value={proProfile.categories.map((category) => `${category.label}: ${category.status}`).join(', ')} /> : null}
            <AppText color={colors.slate500} variant="small">
              {t('proProfileReadonlyNote')}
            </AppText>

            {isEditingPro ? (
              <View style={styles.actionRow}>
                <AppButton disabled={isSavingPro} onPress={cancelProEdit} style={styles.actionButton} tone="neutral" variant="outline">
                  {t('cancel')}
                </AppButton>
                {hasProChanges ? (
                  <AppButton disabled={isSavingPro} loading={isSavingPro} onPress={handleSavePro} style={styles.actionButton} tone="pro">
                    {isSavingPro ? t('savingChanges') : t('saveChanges')}
                  </AppButton>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          <AppText color={colors.slate500}>{t('proProfileMissing')}</AppText>
        )}

        {proProfile ? (
          <View style={styles.portfolioBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <AppText variant="sectionTitle">{t('portfolio')}</AppText>
                <AppText color={colors.slate700} variant="small">
                  {t('proPortfolioHelper')}
                </AppText>
              </View>
              {status === 'authenticated' && !isProjectFormOpen ? (
                <AppButton onPress={beginCreateProject} style={styles.headerButton} tone="pro">
                  {t('addProject')}
                </AppButton>
              ) : null}
            </View>

            {isProjectFormOpen ? (
              <View style={styles.projectForm}>
                <AppText variant="bodyStrong">
                  {editingProjectId ? t('editProject') : t('addProject')}
                </AppText>
                <FormField
                  autoCapitalize="words"
                  editable={!isSavingProject}
                  errorText={projectFieldErrors.title}
                  label={t('portfolioProjectTitle')}
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, title: value }))}
                  value={projectDraft.title}
                />
                <FormField
                  editable={!isSavingProject}
                  label={t('category')}
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, categoryName: value }))}
                  value={projectDraft.categoryName}
                />
                <FormField
                  editable={!isSavingProject}
                  label={t('city')}
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, cityName: value }))}
                  value={projectDraft.cityName}
                />
                <FormField
                  editable={!isSavingProject}
                  label={t('description')}
                  multiline
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, description: value }))}
                  value={projectDraft.description}
                />
                <FormField
                  editable={!isSavingProject}
                  label={t('approximateDuration')}
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, approximateDuration: value }))}
                  value={projectDraft.approximateDuration}
                />
                <FormField
                  editable={!isSavingProject}
                  label={t('optionalPriceRange')}
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, optionalPriceRange: value }))}
                  value={projectDraft.optionalPriceRange}
                />
                <FormField
                  editable={!isSavingProject}
                  helperText={t('imageUrlsHelper')}
                  label={t('projectImageUrls')}
                  multiline
                  onChangeText={(value) => setProjectDraft((current) => ({ ...current, imageUrlsText: value }))}
                  value={projectDraft.imageUrlsText}
                />
                <View style={styles.toggleBlock}>
                  <AppText variant="bodyStrong">{t('projectImageType')}</AppText>
                  <View style={styles.toggleRow}>
                    {(['GENERAL', 'BEFORE', 'AFTER'] as ProviderProPortfolioImageType[]).map((imageType) => (
                      <ToggleChip
                        key={imageType}
                        disabled={isSavingProject}
                        label={t(imageType === 'GENERAL' ? 'imageTypeGeneral' : imageType === 'BEFORE' ? 'imageTypeBefore' : 'imageTypeAfter')}
                        onPress={() => setProjectDraft((current) => ({ ...current, imageType }))}
                        selected={projectDraft.imageType === imageType}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.toggleBlock}>
                  <AppText variant="bodyStrong">{t('customerPermissionConfirmed')}</AppText>
                  <View style={styles.toggleRow}>
                    <ToggleChip disabled={isSavingProject} label={t('yes')} onPress={() => setProjectDraft((current) => ({ ...current, customerPermissionConfirmed: true }))} selected={projectDraft.customerPermissionConfirmed} />
                    <ToggleChip disabled={isSavingProject} label={t('no')} onPress={() => setProjectDraft((current) => ({ ...current, customerPermissionConfirmed: false }))} selected={!projectDraft.customerPermissionConfirmed} />
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <AppButton disabled={isSavingProject} onPress={cancelProjectEdit} style={styles.actionButton} tone="neutral" variant="outline">
                    {t('cancel')}
                  </AppButton>
                  <AppButton disabled={isSavingProject} loading={isSavingProject} onPress={handleSaveProject} style={styles.actionButton} tone="pro">
                    {isSavingProject ? t('savingChanges') : t('saveProject')}
                  </AppButton>
                </View>
              </View>
            ) : null}

            {portfolioProjects.length ? (
              <View style={styles.projectList}>
                {portfolioProjects.map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <AppText variant="bodyStrong">{project.title}</AppText>
                    {project.categoryName || project.cityName ? (
                      <AppText color={colors.slate500} variant="small">
                        {[project.categoryName, project.cityName].filter(Boolean).join(' / ')}
                      </AppText>
                    ) : null}
                    {project.description ? <AppText color={colors.slate700}>{project.description}</AppText> : null}
                    {project.images.length ? (
                      <AppText color={colors.slate500} variant="small">
                        {t('projectPhotos')}: {project.images.length}
                      </AppText>
                    ) : null}
                    <View style={styles.actionRow}>
                      <AppButton onPress={() => beginEditProject(project)} style={styles.actionButton} tone="pro" variant="outline">
                        {t('edit')}
                      </AppButton>
                      <AppButton
                        disabled={isDeletingProjectId === project.id}
                        loading={isDeletingProjectId === project.id}
                        onPress={() => handleDeleteProject(project.id)}
                        style={styles.actionButton}
                        tone="neutral"
                        variant="outline">
                        {t('remove')}
                      </AppButton>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <InlineMessage message={t('proPortfolioEmpty')} tone="neutral" />
            )}
          </View>
        ) : null}
      </AppCard>
      ) : null}

      <AppCard>
        <StatusBadge label={t('drawerSettings')} tone="neutral" />
        <AppText variant="sectionTitle">{t('providerAccount')}</AppText>
        <AppText color={colors.slate700}>{t('providerAccountHelper')}</AppText>
        <AppButton onPress={() => router.push('/provider/account')} variant="outline">
          {t('openAccount')}
        </AppButton>
      </AppCard>

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

function toProDraft(profile: ProviderProProfile): ProDraft {
  return {
    bio: profile.bio,
    businessType: profile.businessType,
    displayName: profile.displayName,
    internalEmail: profile.internalEmail,
    internalPhone: profile.internalPhone,
    invoiceAvailable: profile.invoiceAvailable,
    languagesText: profile.languages.join(', '),
    profileImageUrl: profile.profileImageUrl || '',
    quotePreference: profile.quotePreference,
    siteVisitPreference: profile.siteVisitPreference,
    teamSize: profile.teamSize,
    tradeName: profile.tradeName,
    warrantyNote: profile.warrantyNote,
    yearsExperience: profile.yearsExperience,
  };
}

function toProjectDraft(project: ProviderProPortfolioProject): ProProjectDraft {
  return {
    approximateDuration: project.approximateDuration,
    categoryName: project.categoryName,
    cityName: project.cityName,
    customerPermissionConfirmed: project.customerPermissionConfirmed,
    description: project.description,
    imageType: project.images[0]?.type ?? 'GENERAL',
    imageUrlsText: project.images.map((image) => image.url).join('\n'),
    optionalPriceRange: project.optionalPriceRange,
    title: project.title,
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

function parseLineListText(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item.toLowerCase())) return false;
      seen.add(item.toLowerCase());
      return true;
    })
    .slice(0, 10);
}

type ReadinessItem = {
  body: string;
  complete: boolean;
  label: string;
};

function isPayoutReadyFromLabel(stripeStatusLabel: string | null | undefined) {
  const stripeLabel = String(stripeStatusLabel || '').toLocaleLowerCase();
  return Boolean(stripeLabel && (stripeLabel.includes('complete') || stripeLabel.includes('ready') || stripeLabel.includes('verified')));
}

function buildTaskerReadinessItems(
  taskerProfile: ProviderTaskerProfile | null,
  profile: ProviderProfileResponse['profile'] | undefined,
): ReadinessItem[] {
  const hasProfileBasics = Boolean(
    taskerProfile?.firstName.trim() &&
      taskerProfile.lastName.trim() &&
      taskerProfile.phone.trim() &&
      taskerProfile.bio.trim(),
  );
  const hasCity = Boolean(taskerProfile?.cityLabel.trim() || profile?.coreCities.length);
  const hasCategories = Boolean(taskerProfile?.serviceCategories.length || profile?.coreCategories.length);
  const hasSkillsAndTools = Boolean(taskerProfile?.toolsEquipment.length || taskerProfile?.languagesSpoken.length);
  const payoutReady = isPayoutReadyFromLabel(profile?.stripeStatusLabel);

  return [
    {
      body: hasProfileBasics ? t('readyToReceiveTasks') : t('completeYourProfile'),
      complete: hasProfileBasics,
      label: t('completeYourProfile'),
    },
    {
      body: hasCity ? taskerProfile?.cityLabel || profile?.coreCities.join(', ') || t('readyToReceiveTasks') : t('cityCoverageMissing'),
      complete: hasCity,
      label: t('cityCoverage'),
    },
    {
      body: hasCategories ? (taskerProfile?.serviceCategories.join(', ') || profile?.coreCategories.join(', ') || t('readyToReceiveTasks')) : t('serviceCategoriesMissing'),
      complete: hasCategories,
      label: t('serviceCategoriesLabel'),
    },
    {
      body: hasSkillsAndTools ? formatProfileList([...(taskerProfile?.toolsEquipment ?? []), ...(taskerProfile?.languagesSpoken ?? [])]) : t('skillsAndToolsMissing'),
      complete: hasSkillsAndTools,
      label: t('skillsAndTools'),
    },
    {
      body: payoutReady ? profile?.stripeStatusLabel || t('ready') : t('payoutSetupNeedsAttention'),
      complete: payoutReady,
      label: t('payoutSetup'),
    },
  ];
}

function ProfilePhotoCard({ profile }: { profile: ProviderTaskerProfile }) {
  const initials = getInitials(profile);

  return (
    <AppCard backgroundColor={colors.tasklyBlue50}>
      <View style={styles.photoRow}>
        <View style={styles.avatar}>
          {profile.profilePhotoUrl ? (
            <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatarImage} />
          ) : initials ? (
            <AppText color={colors.tasklyBlue700} style={styles.avatarInitials}>
              {initials}
            </AppText>
          ) : (
            <Ionicons color={colors.tasklyBlue700} name="person-outline" size={30} />
          )}
        </View>
        <View style={styles.photoText}>
          <StatusBadge label={t('profilePhoto')} tone="core" />
          <AppText variant="sectionTitle">{profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('tasklyTasker')}</AppText>
          <AppText color={colors.slate700}>
            {profile.profilePhotoUrl ? t('profilePhotoReady') : t('profilePhotoPlaceholderBody')}
          </AppText>
          <AppText color={colors.slate500} variant="small">
            {t('profilePhotoDisplayOnly')}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function TaskerReadinessCard({ items, stripeStatusLabel }: { items: ReadinessItem[]; stripeStatusLabel: string | null }) {
  const payoutReady = isPayoutReadyFromLabel(stripeStatusLabel);

  return (
    <AppCard backgroundColor={colors.white}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <StatusBadge label={t('profileReadiness')} tone="core" />
          <AppText variant="sectionTitle">{t('readyToReceiveTasks')}</AppText>
        </View>
      </View>
      <AppText color={colors.slate700}>{t('taskerProfileReadinessIntro')}</AppText>
      <View style={styles.readinessList}>
        {items.map((item) => (
          <View key={item.label} style={styles.readinessRow}>
            <View style={[styles.readinessIcon, item.complete ? styles.readinessIconComplete : styles.readinessIconAttention]}>
              <Ionicons color={item.complete ? colors.tasklyBlue700 : colors.warning600} name={item.complete ? 'checkmark' : 'alert'} size={16} />
            </View>
            <View style={styles.readinessText}>
              <AppText variant="bodyStrong">{item.label}</AppText>
              <AppText color={colors.slate700} variant="small">{item.body}</AppText>
            </View>
            <StatusBadge label={item.complete ? t('ready') : t('needsAttention')} tone={item.complete ? 'success' : 'warning'} />
          </View>
        ))}
      </View>
      {stripeStatusLabel ? (
        <View style={styles.payoutBox}>
          <View style={styles.payoutHeader}>
            <AppText variant="bodyStrong">{t('payoutSetup')}</AppText>
            <StatusBadge label={payoutReady ? t('ready') : t('needsAttention')} tone={payoutReady ? 'success' : 'warning'} />
          </View>
          <AppText color={colors.slate700}>{stripeStatusLabel}</AppText>
          {!payoutReady ? (
            <AppText color={colors.slate500} variant="small">
              {t('payoutActionsUnavailableMobile')}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

function normalizeListText(value: string) {
  return parseListText(value).join(', ');
}

function getInitials(profile: ProviderTaskerProfile) {
  const source = [profile.firstName, profile.lastName].filter(Boolean);
  if (source.length) return source.map((value) => value.trim().slice(0, 1).toUpperCase()).join('').slice(0, 2);
  return profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => value.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, 2);
}

function formatProfileList(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(', ') : t('needsAttention');
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

function validateProDraft(draft: ProDraft): ProFieldErrors {
  const errors: ProFieldErrors = {};
  const displayName = draft.displayName.trim();
  const bio = draft.bio.trim();
  const warrantyNote = draft.warrantyNote.trim();
  const yearsExperience = draft.yearsExperience.trim();
  const teamSize = draft.teamSize.trim();
  const yearsExperienceNumber = yearsExperience ? Number(yearsExperience.replace(',', '.')) : null;
  const teamSizeNumber = teamSize ? Number(teamSize.replace(',', '.')) : null;

  if (!displayName) errors.displayName = t('proDisplayNameRequired');
  if (displayName.length > 160) errors.displayName = t('proDisplayNameTooLong');
  if (bio.length > 2000) errors.bio = t('proBioTooLong');
  if (warrantyNote.length > 2000) errors.warrantyNote = t('proWarrantyNoteTooLong');
  if (yearsExperience && (!Number.isFinite(yearsExperienceNumber) || Number(yearsExperienceNumber) < 0)) {
    errors.yearsExperience = t('numberFieldInvalid');
  }
  if (teamSize && (!Number.isFinite(teamSizeNumber) || Number(teamSizeNumber) < 0)) {
    errors.teamSize = t('numberFieldInvalid');
  }

  return errors;
}

function validateProjectDraft(draft: ProProjectDraft): ProProjectFieldErrors {
  const errors: ProProjectFieldErrors = {};
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (!title) errors.title = t('projectTitleRequired');
  if (title.length > 191) errors.title = t('projectTitleTooLong');
  if (description.length > 2000) errors.description = t('projectDescriptionTooLong');

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

function getProFieldErrorsFromApiError(error: ApiError): ProFieldErrors {
  const details = error.details;
  if (!details || typeof details !== 'object' || !('fields' in details)) {
    return {};
  }

  const fields = (details as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  const fieldErrors: ProFieldErrors = {};
  const record = fields as Record<string, unknown>;
  if (record.displayName) fieldErrors.displayName = t('proDisplayNameRequired');
  if (record.bio) fieldErrors.bio = t('proBioTooLong');
  if (record.yearsExperience) fieldErrors.yearsExperience = t('numberFieldInvalid');
  if (record.teamSize) fieldErrors.teamSize = t('numberFieldInvalid');
  if (record.profileImageUrl) fieldErrors.profileImageUrl = t('profileImageUrlInvalid');

  return fieldErrors;
}

function getProjectFieldErrorsFromApiError(error: ApiError): ProProjectFieldErrors {
  const details = error.details;
  if (!details || typeof details !== 'object' || !('fields' in details)) {
    return {};
  }

  const fields = (details as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  const fieldErrors: ProProjectFieldErrors = {};
  const record = fields as Record<string, unknown>;
  if (record.title) fieldErrors.title = t('projectTitleRequired');
  if (record.description) fieldErrors.description = t('projectDescriptionTooLong');

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
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: 42,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
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
  payoutBox: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  payoutHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  photoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoText: {
    flex: 1,
    gap: spacing.xs,
  },
  portfolioBlock: {
    borderTopColor: colors.proOrangeBorder,
    borderTopWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  projectForm: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  projectList: {
    gap: spacing.md,
  },
  readinessIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  readinessIconAttention: {
    backgroundColor: colors.slate100,
  },
  readinessIconComplete: {
    backgroundColor: colors.tasklyBlue50,
  },
  readinessList: {
    gap: spacing.sm,
  },
  readinessRow: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  readinessText: {
    flex: 1,
    gap: 2,
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
