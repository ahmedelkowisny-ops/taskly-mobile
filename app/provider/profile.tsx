import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField, ModeBadge, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCities, getCoreCategories } from '@/src/lib/api/catalog';
import type {
  CatalogCategory,
  CityOption,
  ProviderPayoutStatus,
  ProviderProPortfolioProject,
  ProviderProProfile,
  ProviderProfileResponse,
  TaskerAvailability,
  ProviderTaskerProfile,
} from '@/src/lib/api/domain';
import type { ApiError } from '@/src/lib/api/types';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockProviderProfileResponse } from '@/src/lib/api/mockApi';
import {
  createProviderProPortfolioProject,
  deleteProviderProPortfolioProject,
  getProviderProPortfolio,
  getProviderProfile,
  getProviderProProfile,
  getProviderTaskerProfile,
  refreshPayoutStatus,
  removeProviderPortfolioProjectPhoto,
  startPayoutSetup,
  updateProviderProPortfolioProject,
  updateProviderProProfile,
  updateProviderTaskerProfile,
} from '@/src/lib/api/provider';
import {
  canUploadSelectedImage,
  uploadProviderPortfolioProjectPhoto,
  uploadProviderTaskerProfilePhoto,
} from '@/src/lib/api/imageUploads';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCoreTaskerStatusLabel, getProStatusLabel, hasApprovedProMode, hasCoreTaskerMode } from '@/src/lib/auth/workspaceAccess';
import {
  compressSelectedImage,
  defaultAcceptedImageTypes,
  pickTasklyImages,
  requestImageLibraryPermission,
  validateSelectedImages,
} from '@/src/lib/images/imagePicker';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type TaskerDraft = {
  availability: TaskerAvailability;
  bio: string;
  cityId: string;
  firstName: string;
  hasCar: boolean;
  hourlyRate: string;
  languagesText: string;
  lastName: string;
  phone: string;
  serviceArea: string;
  serviceCategorySlugs: string[];
  toolsText: string;
};

type TaskerFieldErrors = Partial<Record<keyof TaskerDraft, string>>;
type TaskerEditor = 'availability' | 'basics' | 'coverage' | 'skills';
type ProfileMode = 'tasker' | 'pro';
type IoniconName = ComponentProps<typeof Ionicons>['name'];

const emptyTaskerDraft: TaskerDraft = {
  availability: createDefaultAvailability(),
  bio: '',
  cityId: '',
  firstName: '',
  hasCar: false,
  hourlyRate: '',
  languagesText: '',
  lastName: '',
  phone: '',
  serviceArea: '',
  serviceCategorySlugs: [],
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
  optionalPriceRange: string;
  title: string;
};

type ProFieldErrors = Partial<Record<keyof ProDraft, string>>;
type ProProjectFieldErrors = Partial<Record<keyof ProProjectDraft | 'imageUrls', string>>;

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
  optionalPriceRange: '',
  title: '',
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { applySession, getValidAccessToken, refreshSession, session: authSession, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProfileResponse | null>(null);
  const [taskerProfile, setTaskerProfile] = useState<ProviderTaskerProfile | null>(null);
  const [taskerDraft, setTaskerDraft] = useState<TaskerDraft>(emptyTaskerDraft);
  const [taskerFieldErrors, setTaskerFieldErrors] = useState<TaskerFieldErrors>({});
  const [activeTaskerEditor, setActiveTaskerEditor] = useState<TaskerEditor | null>(null);
  const [isSavingTasker, setIsSavingTasker] = useState(false);
  const [taskerNotice, setTaskerNotice] = useState<string | null>(null);
  const [taskerErrorMessage, setTaskerErrorMessage] = useState<string | null>(null);
  const [isUploadingTaskerPhoto, setIsUploadingTaskerPhoto] = useState(false);
  const [isStartingPayoutSetup, setIsStartingPayoutSetup] = useState(false);
  const [isRefreshingPayoutStatus, setIsRefreshingPayoutStatus] = useState(false);
  const [proProfile, setProProfile] = useState<ProviderProProfile | null>(null);
  const [proDraft, setProDraft] = useState<ProDraft>(emptyProDraft);
  const [proFieldErrors, setProFieldErrors] = useState<ProFieldErrors>({});
  const [isEditingPro, setIsEditingPro] = useState(false);
  const [isSavingPro, setIsSavingPro] = useState(false);
  const [proNotice, setProNotice] = useState<string | null>(null);
  const [proErrorMessage, setProErrorMessage] = useState<string | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<ProviderProPortfolioProject[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [coreCategoryOptions, setCoreCategoryOptions] = useState<CatalogCategory[]>([]);
  const [projectDraft, setProjectDraft] = useState<ProProjectDraft>(emptyProProjectDraft);
  const [projectFieldErrors, setProjectFieldErrors] = useState<ProProjectFieldErrors>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProjectId, setIsDeletingProjectId] = useState<string | null>(null);
  const [projectErrorMessage, setProjectErrorMessage] = useState<string | null>(null);
  const [isUploadingProjectPhoto, setIsUploadingProjectPhoto] = useState(false);
  const [projectPhotoErrorMessage, setProjectPhotoErrorMessage] = useState<string | null>(null);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [activeProfileMode, setActiveProfileMode] = useState<ProfileMode>('tasker');
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
      taskerDraft.cityId !== current.cityId ||
      taskerDraft.serviceCategorySlugs.join(',') !== current.serviceCategorySlugs.join(',') ||
      JSON.stringify(taskerDraft.availability) !== JSON.stringify(current.availability) ||
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
      setActiveTaskerEditor(null);
      setProProfile(null);
      setProDraft(emptyProDraft);
      setPortfolioProjects([]);
      setCityOptions([]);
      setCoreCategoryOptions([]);
      setIsEditingPro(false);
      setIsProjectFormOpen(false);
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setTaskerProfile(null);
      setTaskerDraft(emptyTaskerDraft);
      setActiveTaskerEditor(null);
      setProProfile(null);
      setProDraft(emptyProDraft);
      setPortfolioProjects([]);
      setCityOptions([]);
      setCoreCategoryOptions([]);
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

    const [result, taskerResult, proResult, portfolioResult, citiesResult, categoriesResult] = await Promise.all([
      getProviderProfile(authToken),
      getProviderTaskerProfile(authToken),
      getProviderProProfile(authToken),
      getProviderProPortfolio(authToken),
      getCities(authToken),
      getCoreCategories(authToken),
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
      if (taskerResult.data.session) {
        applySession(taskerResult.data.session);
      }
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

    setCityOptions(citiesResult.ok ? citiesResult.data.cities.filter((city) => city.isActive) : []);
    setCoreCategoryOptions(categoriesResult.ok ? categoriesResult.data.categories.filter((category) => category.isActive) : []);

    setIsLoading(false);
  }, [applySession, getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const profile = data?.profile;
  const showProProfileTools = status === 'demo' || hasApprovedProMode(authSession) || profile?.proStatus === 'approved';
  const showTaskerProfileTools = Boolean(taskerProfile) || status === 'demo' || hasCoreTaskerMode(authSession) || (profile?.coreTaskerStatus != null && profile.coreTaskerStatus !== 'none');
  const effectiveProfileMode: ProfileMode = showProProfileTools && !showTaskerProfileTools ? 'pro' : activeProfileMode;
  const showTaskerProfileSection = showTaskerProfileTools && effectiveProfileMode === 'tasker';
  const showProProfileSection = showProProfileTools && effectiveProfileMode === 'pro';
  const readinessItems = buildTaskerReadinessItems(taskerProfile, profile);
  const proReadinessItems = buildProReadinessItems(proProfile, profile, portfolioProjects);

  function beginTaskerEdit(editor: TaskerEditor) {
    if (!taskerProfile) return;
    setTaskerDraft(toTaskerDraft(taskerProfile));
    setTaskerFieldErrors({});
    setTaskerNotice(null);
    setTaskerErrorMessage(null);
    setActiveTaskerEditor(editor);
  }

  function cancelTaskerEdit() {
    if (taskerProfile) {
      setTaskerDraft(toTaskerDraft(taskerProfile));
    }
    setTaskerFieldErrors({});
    setTaskerNotice(null);
    setTaskerErrorMessage(null);
    setActiveTaskerEditor(null);
  }

  async function handleStartPayoutSetup() {
    setTaskerNotice(null);
    setTaskerErrorMessage(null);

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setTaskerErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsStartingPayoutSetup(true);
    const result = await startPayoutSetup(authToken);
    setIsStartingPayoutSetup(false);

    if (!result.ok) {
      setTaskerErrorMessage(getPayoutActionErrorMessage(result.error));
      return;
    }

    setData((current) => (current ? { ...current, profile: result.data.profile } : current));

    if (!result.data.onboardingUrl) {
      setTaskerErrorMessage(t('couldNotOpenStripeSetup'));
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(result.data.onboardingUrl);
      if (!canOpen) {
        setTaskerErrorMessage(t('couldNotOpenStripeSetup'));
        return;
      }

      await Linking.openURL(result.data.onboardingUrl);
      setTaskerNotice(t('stripeSetupOpened'));
    } catch {
      setTaskerErrorMessage(t('couldNotOpenStripeSetup'));
    }
  }

  async function handleRefreshPayoutStatus() {
    setTaskerNotice(null);
    setTaskerErrorMessage(null);

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setTaskerErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsRefreshingPayoutStatus(true);
    const result = await refreshPayoutStatus(authToken);
    setIsRefreshingPayoutStatus(false);

    if (!result.ok) {
      setTaskerErrorMessage(getPayoutActionErrorMessage(result.error, t('couldNotRefreshPayoutStatus')));
      return;
    }

    setData((current) => (current ? { ...current, profile: result.data.profile } : current));
    await refreshSession();
    setTaskerNotice(t('payoutStatusRefreshed'));
  }

  async function handleSaveTasker(successKey: 'availabilityUpdated' | 'coverageUpdated' | 'profileUpdated' | 'skillsUpdated' = 'profileUpdated') {
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
        availability: taskerDraft.availability,
        cityId: taskerDraft.cityId,
        serviceCategorySlugs: taskerDraft.serviceCategorySlugs,
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
    setActiveTaskerEditor(null);
    if (result.data.session) {
      applySession(result.data.session);
    }
    setTaskerNotice(t(successKey));
    await loadProfile();
  }

  async function handleChangeTaskerPhoto() {
    if (status !== 'authenticated') {
      setTaskerErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setTaskerNotice(null);
    setTaskerErrorMessage(null);

    const permission = await requestImageLibraryPermission();
    if (!permission.granted) {
      setTaskerErrorMessage(t('photoPermissionNeeded'));
      return;
    }

    const selected = await pickTasklyImages({ maxImages: 1 });
    if (!selected.length) {
      return;
    }

    const validation = validateSelectedImages(selected, {
      acceptedImageTypes: defaultAcceptedImageTypes,
      maxImages: 1,
    });

    if (!validation.accepted.length) {
      setTaskerErrorMessage(t('unsupportedImageType'));
      return;
    }

    const processedImage = await compressSelectedImage(validation.accepted[0], {
      compress: 0.78,
      maxFileSizeBeforeCompression: 900_000,
      maxWidth: 1600,
    });

    if (!canUploadSelectedImage(processedImage)) {
      setTaskerErrorMessage(processedImage.errorMessage || t('couldNotUpdatePhoto'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setTaskerErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsUploadingTaskerPhoto(true);
    const result = await uploadProviderTaskerProfilePhoto(processedImage, authToken);
    setIsUploadingTaskerPhoto(false);

    if (!result.ok) {
      setTaskerErrorMessage(getPhotoUploadErrorMessage(result.error));
      return;
    }

    setTaskerProfile(result.data.profile);
    setTaskerDraft(toTaskerDraft(result.data.profile));
    if (result.data.session) {
      applySession(result.data.session);
    }
    setTaskerNotice(t('photoUpdated'));
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
    setProjectPhotoErrorMessage(null);
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

    const isCreating = !editingProjectId;
    const payload = {
      approximateDuration: projectDraft.approximateDuration.trim(),
      categoryName: projectDraft.categoryName.trim(),
      cityName: projectDraft.cityName.trim(),
      customerPermissionConfirmed: projectDraft.customerPermissionConfirmed,
      description: projectDraft.description.trim(),
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
    setProjectFieldErrors({});
    setProjectPhotoErrorMessage(null);
    setProNotice(t('proPortfolioProjectSaved'));

    if (isCreating) {
      // After creating, stay in edit mode so the user can add photos immediately.
      setEditingProjectId(result.data.project.id);
    } else {
      setProjectDraft(emptyProProjectDraft);
      setEditingProjectId(null);
      setIsProjectFormOpen(false);
    }
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

  async function handleAddPortfolioPhoto() {
    if (!editingProjectId) return;
    if (status !== 'authenticated') {
      setProjectPhotoErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setProjectPhotoErrorMessage(null);

    const permission = await requestImageLibraryPermission();
    if (!permission.granted) {
      setProjectPhotoErrorMessage(t('photoPermissionNeeded'));
      return;
    }

    const selected = await pickTasklyImages({ maxImages: 1 });
    if (!selected.length) return;

    const validation = validateSelectedImages(selected, {
      acceptedImageTypes: defaultAcceptedImageTypes,
      maxImages: 1,
    });

    if (!validation.accepted.length) {
      setProjectPhotoErrorMessage(t('unsupportedImageType'));
      return;
    }

    const processedImage = await compressSelectedImage(validation.accepted[0], {
      compress: 0.78,
      maxFileSizeBeforeCompression: 900_000,
      maxWidth: 1600,
    });

    if (!canUploadSelectedImage(processedImage)) {
      setProjectPhotoErrorMessage(processedImage.errorMessage || t('couldNotUploadPortfolioPhoto'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProjectPhotoErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsUploadingProjectPhoto(true);
    const result = await uploadProviderPortfolioProjectPhoto(editingProjectId, processedImage, authToken);
    setIsUploadingProjectPhoto(false);

    if (!result.ok) {
      setProjectPhotoErrorMessage(getPortfolioPhotoUploadErrorMessage(result.error));
      return;
    }

    setPortfolioProjects((current) =>
      current.map((p) => (p.id === result.data.project.id ? result.data.project : p)),
    );
    setProjectPhotoErrorMessage(null);
  }

  async function handleRemovePortfolioPhoto(projectId: string, imageId: string) {
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setProjectPhotoErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setRemovingPhotoId(imageId);
    setProjectPhotoErrorMessage(null);
    const result = await removeProviderPortfolioProjectPhoto(projectId, imageId, authToken);
    setRemovingPhotoId(null);

    if (!result.ok) {
      setProjectPhotoErrorMessage(t('couldNotRemovePortfolioPhoto'));
      return;
    }

    setPortfolioProjects((current) =>
      current.map((p) => (p.id === result.data.project.id ? result.data.project : p)),
    );
  }

  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <StatusBadge
          label={showProProfileTools && !showTaskerProfileTools ? t('tasklyProWorkspace') : t('tasklyTaskerWorkspace')}
          tone={showProProfileTools && !showTaskerProfileTools ? 'pro' : 'core'}
        />
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

      {showTaskerProfileTools && showProProfileTools ? (
        <ProfileModeSwitcher activeMode={effectiveProfileMode} onChange={setActiveProfileMode} />
      ) : null}

      {showTaskerProfileSection && taskerProfile ? (
        <ProfilePhotoCard
          canChangePhoto={status === 'authenticated'}
          isUploading={isUploadingTaskerPhoto}
          onChangePhoto={handleChangeTaskerPhoto}
          profile={taskerProfile}
          summary={profile ?? null}
        />
      ) : null}

      {showTaskerProfileSection ? (
        <TaskerReadinessCard
          isRefreshing={isRefreshingPayoutStatus}
          isStarting={isStartingPayoutSetup}
          items={readinessItems}
          onRefresh={handleRefreshPayoutStatus}
          onStart={handleStartPayoutSetup}
          payoutStatus={profile?.payoutStatus ?? null}
          stripeStatusLabel={profile?.stripeStatusLabel ?? null}
        />
      ) : null}

      {showTaskerProfileSection ? (
      <AppCard accentColor={colors.tasklyBlue600} backgroundColor={colors.white}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleBlock}>
            <ModeBadge mode="providerCore" />
            <AppText variant="sectionTitle">{t('profileOverview')}</AppText>
          </View>
        </View>
        <AppText color={colors.slate700}>{t('swipeProfileSections')}</AppText>

        {taskerErrorMessage ? <InlineMessage message={taskerErrorMessage} tone="error" /> : null}
        {taskerNotice ? <InlineMessage message={taskerNotice} tone="success" /> : null}
        {status === 'demo' ? <InlineMessage message={t('taskerProfileEditUnavailableDemo')} tone="neutral" /> : null}

        {taskerProfile ? (
          <TaskerProfileHub
            canEdit={status === 'authenticated'}
            onEdit={beginTaskerEdit}
            profile={taskerProfile}
            providerProfile={profile ?? null}
          />
        ) : (
          <AppText color={colors.slate500}>{t('taskerProfileEmptyHelper')}</AppText>
        )}
      </AppCard>
      ) : null}

      {showTaskerProfileSection && taskerProfile ? (
        <TaskerEditModal
          activeEditor={activeTaskerEditor}
          cityOptions={cityOptions}
          coreCategoryOptions={coreCategoryOptions}
          draft={taskerDraft}
          fieldErrors={taskerFieldErrors}
          hasChanges={hasTaskerChanges}
          isSaving={isSavingTasker}
          onCancel={cancelTaskerEdit}
          onChange={setTaskerDraft}
          onSave={handleSaveTasker}
        />
      ) : null}

      {showProProfileSection ? (
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
        <AppText color={colors.slate700}>{t('proProfileWorkspaceBody')}</AppText>

        {proErrorMessage ? <InlineMessage message={proErrorMessage} tone="error" /> : null}
        {projectErrorMessage ? <InlineMessage message={projectErrorMessage} tone="error" /> : null}
        {proNotice ? <InlineMessage message={proNotice} tone="success" /> : null}
        {status === 'demo' ? <InlineMessage message={t('proProfileEditUnavailableDemo')} tone="neutral" /> : null}

        {proProfile ? (
          <View style={styles.form}>
            <ProProfileHero profile={proProfile} summary={profile ?? null} projectCount={portfolioProjects.length} />
            <ProReadinessCard items={proReadinessItems} />
            <ProApprovalSummary profile={proProfile} summary={profile ?? null} />
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
                <View style={styles.toggleBlock}>
                  <AppText variant="bodyStrong">{t('customerPermissionConfirmed')}</AppText>
                  <View style={styles.toggleRow}>
                    <ToggleChip disabled={isSavingProject} label={t('yes')} onPress={() => setProjectDraft((current) => ({ ...current, customerPermissionConfirmed: true }))} selected={projectDraft.customerPermissionConfirmed} />
                    <ToggleChip disabled={isSavingProject} label={t('no')} onPress={() => setProjectDraft((current) => ({ ...current, customerPermissionConfirmed: false }))} selected={!projectDraft.customerPermissionConfirmed} />
                  </View>
                </View>

                {editingProjectId ? (
                  <PortfolioPhotoSection
                    editingProjectId={editingProjectId}
                    isUploading={isUploadingProjectPhoto}
                    onAddPhoto={handleAddPortfolioPhoto}
                    onRemovePhoto={handleRemovePortfolioPhoto}
                    photoErrorMessage={projectPhotoErrorMessage}
                    projects={portfolioProjects}
                    removingPhotoId={removingPhotoId}
                  />
                ) : (
                  <View style={styles.portfolioPhotoHint}>
                    <Ionicons color={colors.proOrangeTextDark} name="images-outline" size={20} />
                    <AppText color={colors.proOrangeTextDark} variant="small">
                      {t('portfolioPhotosSaveFirst')}
                    </AppText>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <AppButton disabled={isSavingProject || isUploadingProjectPhoto} onPress={cancelProjectEdit} style={styles.actionButton} tone="neutral" variant="outline">
                    {editingProjectId ? t('done') : t('cancel')}
                  </AppButton>
                  {!editingProjectId ? (
                    <AppButton disabled={isSavingProject} loading={isSavingProject} onPress={handleSaveProject} style={styles.actionButton} tone="pro">
                      {isSavingProject ? t('savingChanges') : t('saveProject')}
                    </AppButton>
                  ) : (
                    <AppButton disabled={isSavingProject} loading={isSavingProject} onPress={handleSaveProject} style={styles.actionButton} tone="pro" variant="outline">
                      {isSavingProject ? t('savingChanges') : t('saveChanges')}
                    </AppButton>
                  )}
                </View>
              </View>
            ) : null}

            {portfolioProjects.length ? (
              <View style={styles.projectList}>
                {portfolioProjects.map((project) => (
                  <PortfolioProjectCard
                    canEdit={status === 'authenticated'}
                    isDeleting={isDeletingProjectId === project.id}
                    key={project.id}
                    onDelete={() => handleDeleteProject(project.id)}
                    onEdit={() => beginEditProject(project)}
                    project={project}
                  />
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
    availability: normalizeTaskerAvailability(profile.availability),
    bio: profile.bio,
    cityId: profile.cityId || '',
    firstName: profile.firstName,
    hasCar: profile.hasCar,
    hourlyRate: profile.hourlyRate,
    languagesText: profile.languagesSpoken.join(', '),
    lastName: profile.lastName,
    phone: profile.phone,
    serviceArea: profile.serviceArea,
    serviceCategorySlugs: profile.serviceCategorySlugs ?? [],
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

const availabilityDays = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
] as const;

function createDefaultAvailability(): TaskerAvailability {
  return {
    notes: '',
    timezone: 'Europe/Sofia',
    weekly: {
      mon: { enabled: false, start: '09:00', end: '17:00' },
      tue: { enabled: false, start: '09:00', end: '17:00' },
      wed: { enabled: false, start: '09:00', end: '17:00' },
      thu: { enabled: false, start: '09:00', end: '17:00' },
      fri: { enabled: false, start: '09:00', end: '17:00' },
      sat: { enabled: false, start: '09:00', end: '17:00' },
      sun: { enabled: false, start: '09:00', end: '17:00' },
    },
  };
}

function normalizeTaskerAvailability(value: TaskerAvailability | null | undefined): TaskerAvailability {
  const fallback = createDefaultAvailability();
  if (!value?.weekly) return fallback;

  return {
    notes: typeof value.notes === 'string' ? value.notes : '',
    timezone: value.timezone || 'Europe/Sofia',
    weekly: availabilityDays.reduce((weekly, day) => {
      const current = value.weekly[day.key] ?? fallback.weekly[day.key];
      weekly[day.key] = {
        enabled: current.enabled === true,
        end: current.end || '17:00',
        start: current.start || '09:00',
      };
      return weekly;
    }, {} as TaskerAvailability['weekly']),
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getCityLabel(city: CityOption) {
  return city.nameEn || city.nameBg || city.slug;
}

function getCategoryLabel(category: CatalogCategory) {
  return category.nameEn || category.nameBg || category.slug;
}

function TaskerProfileHub({
  canEdit,
  onEdit,
  profile,
  providerProfile,
}: {
  canEdit: boolean;
  onEdit: (editor: TaskerEditor) => void;
  profile: ProviderTaskerProfile;
  providerProfile: ProviderProfileResponse['profile'] | null;
}) {
  const basicsSummary = [
    profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('needsAttention'),
    profile.phone || t('needsAttention'),
    profile.bio || t('completeYourProfile'),
  ];
  const coverageSummary = [
    profile.cityLabel || providerProfile?.coreCities.join(', ') || t('needsAttention'),
    profile.serviceCategories.length ? profile.serviceCategories.join(', ') : providerProfile?.coreCategories.join(', ') || t('needsAttention'),
    profile.serviceArea || t('needsAttention'),
  ];
  const skillsSummary = [
    profile.toolsEquipment.length ? profile.toolsEquipment.join(', ') : t('skillsAndToolsMissing'),
    profile.languagesSpoken.length ? profile.languagesSpoken.join(', ') : t('languages'),
    profile.hasCar ? t('hasCar') : t('needsAttention'),
  ];

  return (
    <View style={styles.hubBlock}>
      <ScrollView
        contentContainerStyle={styles.profileSectionTabs}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {[t('basics'), t('workCoverage'), t('skillsAndTools'), t('availability'), t('payouts')].map((label) => (
          <View key={label} style={styles.profileSectionTab}>
            <AppText color={colors.tasklyBlue700} style={styles.profileSectionTabText} variant="small">
              {label}
            </AppText>
          </View>
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.profileSectionCarousel}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start">
        <ProfileSectionCard
          buttonLabel={t('editBasics')}
          canEdit={canEdit}
          icon="person-outline"
          onEdit={() => onEdit('basics')}
          rows={[
            { label: t('accountName'), value: basicsSummary[0] },
            { label: t('phoneLabel'), value: basicsSummary[1] },
            { label: t('aboutYou'), value: basicsSummary[2] },
          ]}
          title={t('basics')}
        />
        <ProfileSectionCard
          buttonLabel={t('editCoverage')}
          canEdit={canEdit}
          icon="map-outline"
          onEdit={() => onEdit('coverage')}
          rows={[
            { label: t('city'), value: coverageSummary[0] },
            { label: t('selectedServices'), value: coverageSummary[1] },
            { label: t('serviceArea'), value: coverageSummary[2] },
          ]}
          title={t('workCoverage')}
        />
        <ProfileSectionCard
          buttonLabel={t('editSkills')}
          canEdit={canEdit}
          icon="construct-outline"
          onEdit={() => onEdit('skills')}
          rows={[
            { label: t('toolsEquipment'), value: skillsSummary[0] },
            { label: t('languages'), value: skillsSummary[1] },
            { label: t('hasCar'), value: profile.hasCar ? t('yes') : t('no') },
          ]}
          title={t('skillsAndTools')}
        />
        <ProfileSectionCard
          buttonLabel={t('editAvailability')}
          canEdit={canEdit}
          icon="calendar-outline"
          onEdit={() => onEdit('availability')}
          rows={[
            { label: t('availability'), value: formatAvailabilitySummary(profile.availability) },
            { label: t('latestUpdate'), value: t('tapSectionToEdit') },
          ]}
          title={t('availability')}
        />
        <ProfileSectionCard
          buttonLabel={t('refreshPayoutStatus')}
          canEdit={false}
          icon="card-outline"
          rows={[
            { label: t('payoutSetup'), value: providerProfile?.stripeStatusLabel || t('payoutSetupUnavailable') },
            { label: t('currentStatus'), value: providerProfile?.payoutStatus?.isReady ? t('payoutsReady') : t('payoutSetupNeedsAttention') },
          ]}
          title={t('payouts')}
        />
      </ScrollView>
      <AppText color={colors.slate500} variant="small">{t('tapSectionToEdit')}</AppText>
    </View>
  );
}

function ProfileSectionCard({
  buttonLabel,
  canEdit,
  icon,
  onEdit,
  rows,
  title,
}: {
  buttonLabel: string;
  canEdit: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onEdit?: () => void;
  rows: { label: string; value: string }[];
  title: string;
}) {
  return (
    <View style={styles.profileSectionCard}>
      <View style={styles.profileSectionCardHeader}>
        <View style={styles.profileSectionIcon}>
          <Ionicons color={colors.tasklyBlue700} name={icon} size={20} />
        </View>
        <AppText style={styles.profileSectionTitle} variant="bodyStrong">{title}</AppText>
      </View>
      <View style={styles.profileSectionRows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.profileSummaryRow}>
            <AppText color={colors.slate500} variant="small">{row.label}</AppText>
            <AppText color={colors.navy900} numberOfLines={3} style={styles.profileSummaryValue}>{row.value}</AppText>
          </View>
        ))}
      </View>
      {canEdit && onEdit ? (
        <AppButton onPress={onEdit} style={styles.sectionEditButton} variant="outline">
          {buttonLabel}
        </AppButton>
      ) : null}
    </View>
  );
}

function TaskerEditModal({
  activeEditor,
  cityOptions,
  coreCategoryOptions,
  draft,
  fieldErrors,
  hasChanges,
  isSaving,
  onCancel,
  onChange,
  onSave,
}: {
  activeEditor: TaskerEditor | null;
  cityOptions: CityOption[];
  coreCategoryOptions: CatalogCategory[];
  draft: TaskerDraft;
  fieldErrors: TaskerFieldErrors;
  hasChanges: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChange: Dispatch<SetStateAction<TaskerDraft>>;
  onSave: (successKey?: 'availabilityUpdated' | 'coverageUpdated' | 'profileUpdated' | 'skillsUpdated') => Promise<void>;
}) {
  const config = getTaskerEditorConfig(activeEditor);
  const visible = activeEditor !== null;
  const insets = useSafeAreaInsets();
  const canSave = isTaskerEditorSaveEnabled(activeEditor, draft, hasChanges);
  const footerBottomPadding = Math.max(insets.bottom, spacing.md);

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.select({ android: 'height', ios: 'padding', default: undefined })} style={styles.modalRoot}>
        <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onCancel} style={styles.modalScrim} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.sectionTitleBlock}>
              <AppText variant="sectionTitle">{config.title}</AppText>
            </View>
            <Pressable accessibilityRole="button" disabled={isSaving} onPress={onCancel} style={styles.modalCloseButton}>
              <Ionicons color={colors.slate500} name="close" size={22} />
            </Pressable>
          </View>
          {config.helper ? (
            <View style={styles.modalInfoStrip}>
              <Ionicons color={colors.tasklyBlue700} name="information-circle-outline" size={18} />
              <AppText color={colors.tasklyBlue700} style={styles.modalInfoText} variant="small">
                {config.helper}
              </AppText>
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={[styles.modalContent, { paddingBottom: spacing.xl + footerBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {activeEditor === 'basics' ? (
              <>
                <FormField
                  autoCapitalize="words"
                  editable={!isSaving}
                  errorText={fieldErrors.firstName}
                  label={t('firstNameLabel')}
                  onChangeText={(value) => onChange((current) => ({ ...current, firstName: value }))}
                  value={draft.firstName}
                />
                <FormField
                  autoCapitalize="words"
                  editable={!isSaving}
                  errorText={fieldErrors.lastName}
                  label={t('lastNameLabel')}
                  onChangeText={(value) => onChange((current) => ({ ...current, lastName: value }))}
                  value={draft.lastName}
                />
                <FormField
                  autoComplete="tel"
                  editable={!isSaving}
                  errorText={fieldErrors.phone}
                  keyboardType="phone-pad"
                  label={t('phoneLabel')}
                  onChangeText={(value) => onChange((current) => ({ ...current, phone: value }))}
                  value={draft.phone}
                />
                <FormField
                  editable={!isSaving}
                  errorText={fieldErrors.bio}
                  label={t('aboutYou')}
                  multiline
                  onChangeText={(value) => onChange((current) => ({ ...current, bio: value }))}
                  value={draft.bio}
                />
                <FormField
                  editable={!isSaving}
                  errorText={fieldErrors.hourlyRate}
                  keyboardType="decimal-pad"
                  label={t('hourlyRate')}
                  onChangeText={(value) => onChange((current) => ({ ...current, hourlyRate: value }))}
                  value={draft.hourlyRate}
                />
              </>
            ) : null}

            {activeEditor === 'coverage' ? (
              <>
                <EditableChipSection
                  disabled={isSaving}
                  helperText={t('selectYourCity')}
                  label={t('chooseCity')}
                  options={cityOptions.map((city) => ({ label: getCityLabel(city), value: city.id }))}
                  onToggle={(value) => onChange((current) => ({ ...current, cityId: value }))}
                  selectedValues={draft.cityId ? [draft.cityId] : []}
                  single
                />
                <EditableChipSection
                  disabled={isSaving}
                  helperText={t('chooseServicesYouCanHandle')}
                  label={t('chooseServices')}
                  options={coreCategoryOptions.map((category) => ({ label: getCategoryLabel(category), value: category.slug }))}
                  onToggle={(value) => onChange((current) => ({ ...current, serviceCategorySlugs: toggleValue(current.serviceCategorySlugs, value) }))}
                  selectedValues={draft.serviceCategorySlugs}
                />
                <FormField
                  editable={!isSaving}
                  errorText={fieldErrors.serviceArea}
                  label={t('serviceArea')}
                  onChangeText={(value) => onChange((current) => ({ ...current, serviceArea: value }))}
                  value={draft.serviceArea}
                />
              </>
            ) : null}

            {activeEditor === 'skills' ? (
              <>
                <FormField
                  editable={!isSaving}
                  label={t('languages')}
                  onChangeText={(value) => onChange((current) => ({ ...current, languagesText: value }))}
                  placeholder={t('languagesExample')}
                  value={draft.languagesText}
                />
                <FormField
                  editable={!isSaving}
                  label={t('skillsAndTools')}
                  onChangeText={(value) => onChange((current) => ({ ...current, toolsText: value }))}
                  placeholder={t('toolsExample')}
                  value={draft.toolsText}
                />
                <CarAccessControl
                  disabled={isSaving}
                  onChange={(hasCar) => onChange((current) => ({ ...current, hasCar }))}
                  value={draft.hasCar}
                />
              </>
            ) : null}

            {activeEditor === 'availability' ? (
              <AvailabilityEditor
                disabled={isSaving}
                onChange={(availability) => onChange((current) => ({ ...current, availability }))}
                value={draft.availability}
              />
            ) : null}
          </ScrollView>

          <View style={[styles.modalActions, { paddingBottom: footerBottomPadding }]}>
            <AppButton disabled={isSaving} onPress={onCancel} style={styles.actionButton} tone="neutral" variant="outline">
              {t('cancel')}
            </AppButton>
            <AppButton
              disabled={isSaving || !canSave}
              loading={isSaving}
              onPress={() => void onSave(config.successKey)}
              style={styles.actionButton}>
              {isSaving ? t('savingChanges') : t('saveChanges')}
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getTaskerEditorConfig(editor: TaskerEditor | null) {
  switch (editor) {
    case 'basics':
      return {
        helper: t('tapSectionToEdit'),
        successKey: 'profileUpdated' as const,
        title: t('editBasics'),
      };
    case 'coverage':
      return {
        helper: t('matchingChangesNote'),
        successKey: 'coverageUpdated' as const,
        title: t('editCoverage'),
      };
    case 'skills':
      return {
        helper: t('skillsModalHelper'),
        successKey: 'skillsUpdated' as const,
        title: t('editSkills'),
      };
    case 'availability':
      return {
        helper: t('readyToReceiveMatchingTasks'),
        successKey: 'availabilityUpdated' as const,
        title: t('editAvailability'),
      };
    default:
      return {
        helper: '',
        successKey: 'profileUpdated' as const,
        title: t('profileOverview'),
      };
  }
}

function isTaskerEditorSaveEnabled(editor: TaskerEditor | null, draft: TaskerDraft, hasChanges: boolean) {
  if (!hasChanges) return false;

  if (editor === 'coverage') {
    return Boolean(draft.cityId && draft.serviceCategorySlugs.length > 0);
  }

  return true;
}

function CarAccessControl({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.segmentBlock}>
      <AppText style={styles.segmentLabel} variant="bodyStrong">{t('hasCar')}</AppText>
      <View style={styles.segmentControl}>
        {[
          { label: t('yes'), value: true },
          { label: t('no'), value: false },
        ].map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              key={option.label}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.segmentOption,
                selected ? styles.segmentOptionSelected : null,
                { opacity: disabled ? 0.6 : pressed ? 0.84 : 1 },
              ]}>
              <AppText
                color={selected ? colors.tasklyBlue700 : colors.slate700}
                style={styles.segmentOptionText}
                variant="bodyStrong">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EditableChipSection({
  disabled,
  helperText,
  label,
  onToggle,
  options,
  selectedValues,
  single = false,
}: {
  disabled: boolean;
  helperText: string;
  label: string;
  onToggle: (value: string) => void;
  options: { label: string; value: string }[];
  selectedValues: string[];
  single?: boolean;
}) {
  return (
    <View style={styles.editBlock}>
      <AppText variant="bodyStrong">{label}</AppText>
      <AppText color={colors.slate500} variant="small">{helperText}</AppText>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <ToggleChip
              disabled={disabled || (single && selected)}
              key={option.value}
              label={option.label}
              onPress={() => onToggle(option.value)}
              selected={selected}
            />
          );
        })}
      </View>
    </View>
  );
}

function AvailabilityEditor({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: TaskerAvailability) => void;
  value: TaskerAvailability;
}) {
  const normalized = normalizeTaskerAvailability(value);

  function updateDay(dayKey: keyof TaskerAvailability['weekly'], patch: Partial<TaskerAvailability['weekly'][typeof dayKey]>) {
    onChange({
      ...normalized,
      weekly: {
        ...normalized.weekly,
        [dayKey]: {
          ...normalized.weekly[dayKey],
          ...patch,
        },
      },
    });
  }

  return (
    <View style={styles.editBlock}>
      <AppText variant="bodyStrong">{t('availability')}</AppText>
      <AppText color={colors.slate500} variant="small">{t('readyToReceiveMatchingTasks')}</AppText>
      <View style={styles.availabilityList}>
        {availabilityDays.map((day) => {
          const current = normalized.weekly[day.key];
          return (
            <View key={day.key} style={styles.availabilityRow}>
              <ToggleChip
                disabled={disabled}
                label={day.label}
                onPress={() => updateDay(day.key, { enabled: !current.enabled })}
                selected={current.enabled}
              />
              <View style={styles.availabilityTimeField}>
                <FormField
                  editable={!disabled && current.enabled}
                  label={t('start')}
                  onChangeText={(text) => updateDay(day.key, { start: text })}
                  value={current.start}
                />
              </View>
              <View style={styles.availabilityTimeField}>
                <FormField
                  editable={!disabled && current.enabled}
                  label={t('end')}
                  onChangeText={(text) => updateDay(day.key, { end: text })}
                  value={current.end}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
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

function buildProReadinessItems(
  proProfile: ProviderProProfile | null,
  profile: ProviderProfileResponse['profile'] | undefined,
  projects: ProviderProPortfolioProject[],
): ReadinessItem[] {
  const approvedCategories = proProfile?.categories.filter((category) => category.status === 'approved') ?? profile?.proCategories.filter((category) => category.status === 'approved') ?? [];
  const approvedCities = proProfile?.cityLabels ?? profile?.proCities ?? [];
  const photoCount = projects.reduce((total, project) => total + project.images.length, 0);
  const hasPublicBasics = Boolean(proProfile?.displayName.trim() && proProfile.bio.trim());
  const hasContactDetails = Boolean(proProfile?.internalPhone.trim() || proProfile?.internalEmail.trim());
  const hasResponsePreferences = Boolean(proProfile?.siteVisitPreference.trim() || proProfile?.quotePreference.trim() || proProfile?.warrantyNote.trim());

  return [
    {
      body: hasPublicBasics ? [proProfile?.displayName, proProfile?.tradeName].filter(Boolean).join(' / ') : t('proReadinessPublicBasicsMissing'),
      complete: hasPublicBasics,
      label: t('proReadinessPublicBasics'),
    },
    {
      body: approvedCategories.length ? approvedCategories.map((category) => category.label).join(', ') : t('proReadinessApprovedCategoriesMissing'),
      complete: approvedCategories.length > 0,
      label: t('proReadinessApprovedCategories'),
    },
    {
      body: approvedCities.length ? approvedCities.join(', ') : t('proReadinessCityCoverageMissing'),
      complete: approvedCities.length > 0,
      label: t('proReadinessCityCoverage'),
    },
    {
      body: projects.length ? `${t('portfolioProjectsCount')}: ${projects.length} / ${t('projectPhotos')}: ${photoCount}` : t('proPortfolioEmpty'),
      complete: projects.length > 0,
      label: t('proReadinessPortfolio'),
    },
    {
      body: hasResponsePreferences ? formatProfileList([proProfile?.siteVisitPreference ?? '', proProfile?.quotePreference ?? '']) : t('proReadinessResponsePreferencesMissing'),
      complete: hasResponsePreferences,
      label: t('proReadinessResponsePreferences'),
    },
    {
      body: hasContactDetails ? t('proInternalContactReady') : t('proReadinessContactDetailsMissing'),
      complete: hasContactDetails,
      label: t('proReadinessContactDetails'),
    },
  ];
}

function ProfileModeSwitcher({
  activeMode,
  onChange,
}: {
  activeMode: ProfileMode;
  onChange: (mode: ProfileMode) => void;
}) {
  const options: { icon: IoniconName; label: string; mode: ProfileMode; tone: 'core' | 'pro' }[] = [
    { icon: 'briefcase-outline', label: t('tasklyProfile'), mode: 'tasker', tone: 'core' },
    { icon: 'ribbon-outline', label: t('tasklyProProfile'), mode: 'pro', tone: 'pro' },
  ];

  return (
    <AppCard backgroundColor={colors.white}>
      <View style={styles.profileModeHeader}>
        <StatusBadge label={t('dualProviderWorkspace')} tone="neutral" />
        <AppText color={colors.slate700} variant="small">
          {t('proProfileModeHelper')}
        </AppText>
      </View>
      <View style={styles.profileModeSwitch}>
        {options.map((option) => {
          const selected = activeMode === option.mode;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.mode}
              onPress={() => onChange(option.mode)}
              style={({ pressed }) => [
                styles.profileModeOption,
                selected ? (option.mode === 'pro' ? styles.profileModeOptionProSelected : styles.profileModeOptionCoreSelected) : null,
                { opacity: pressed ? 0.84 : 1 },
              ]}>
              <Ionicons color={selected && option.mode === 'pro' ? colors.proOrangeTextDark : colors.tasklyBlue700} name={option.icon} size={20} />
              <View style={styles.profileModeText}>
                <StatusBadge label={option.tone === 'pro' ? t('tasklyPro') : t('tasklyTasks')} tone={option.tone} />
                <AppText color={colors.navy900} numberOfLines={2} variant="bodyStrong">
                  {option.label}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

function ProProfileHero({
  profile,
  projectCount,
  summary,
}: {
  profile: ProviderProProfile;
  projectCount: number;
  summary: ProviderProfileResponse['profile'] | null;
}) {
  const imageUrl = resolveApiMediaUrl(profile.profileImageUrl || '');
  const displayName = profile.displayName || profile.tradeName || t('proProfessionalProfile');
  const languages = profile.languages.length ? profile.languages.join(', ') : t('needsAttention');
  const approvedCategories = profile.categories.filter((category) => category.status === 'approved').length;

  return (
    <View style={styles.proHero}>
      <View style={styles.proHeroPhoto}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
        ) : (
          <AppText color={colors.proOrangeTextDark} style={styles.avatarInitials}>
            {getNameInitials(displayName)}
          </AppText>
        )}
      </View>
      <View style={styles.proHeroBody}>
        <View style={styles.profileHeaderBadges}>
          <StatusBadge label={summary ? getProStatusLabel(summary.proStatus) : profile.status} tone="pro" />
          <StatusBadge label={t('customerContactProtected')} tone="warning" />
        </View>
        <AppText variant="sectionTitle">{displayName}</AppText>
        {profile.tradeName ? <AppText color={colors.slate700}>{profile.tradeName}</AppText> : null}
        <View style={styles.proMetricsGrid}>
          <InfoRow label={t('yearsExperience')} value={profile.yearsExperience || t('needsAttention')} />
          <InfoRow label={t('teamSize')} value={profile.teamSize || t('needsAttention')} />
          <InfoRow label={t('portfolioProjectsCount')} value={String(projectCount)} />
          <InfoRow label={t('approvedCategories')} value={String(approvedCategories)} />
        </View>
        <AppText color={colors.slate500} variant="small">
          {t('languagesSpoken')}: {languages}
        </AppText>
      </View>
    </View>
  );
}

function ProReadinessCard({ items }: { items: ReadinessItem[] }) {
  const completeCount = items.filter((item) => item.complete).length;
  const percent = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  return (
    <View style={styles.proReadinessPanel}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <StatusBadge label={t('proAccountReadiness')} tone="pro" />
          <AppText variant="sectionTitle">{percent}%</AppText>
        </View>
      </View>
      <AppText color={colors.slate700}>{t('proProfileReadinessIntro')}</AppText>
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
    </View>
  );
}

function ProApprovalSummary({
  profile,
  summary,
}: {
  profile: ProviderProProfile;
  summary: ProviderProfileResponse['profile'] | null;
}) {
  const cities = profile.cityLabels.length ? profile.cityLabels : summary?.proCities ?? [];
  const categories = profile.categories.length ? profile.categories : summary?.proCategories ?? [];

  return (
    <View style={styles.proApprovalPanel}>
      <View style={styles.sectionTitleBlock}>
        <AppText variant="bodyStrong">{t('approvedCategoriesCities')}</AppText>
        <AppText color={colors.slate500} variant="small">
          {t('proReadonlyApprovals')}
        </AppText>
      </View>
      {cities.length ? (
        <View style={styles.chipGrid}>
          {cities.map((city) => (
            <StatusBadge key={city} label={city} tone="success" />
          ))}
        </View>
      ) : (
        <InlineMessage message={t('proReadinessCityCoverageMissing')} tone="neutral" />
      )}
      {categories.length ? (
        <View style={styles.chipGrid}>
          {categories.map((category) => (
            <StatusBadge
              key={`${category.label}-${category.status}`}
              label={`${category.label}: ${category.status}`}
              tone={category.status === 'approved' ? 'success' : category.status === 'rejected' ? 'danger' : 'warning'}
            />
          ))}
        </View>
      ) : (
        <InlineMessage message={t('proReadinessApprovedCategoriesMissing')} tone="neutral" />
      )}
    </View>
  );
}

function PortfolioProjectCard({
  canEdit,
  isDeleting,
  onDelete,
  onEdit,
  project,
}: {
  canEdit: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
  project: ProviderProPortfolioProject;
}) {
  const primaryImage = project.images[0] ? resolveApiMediaUrl(project.images[0].url) : '';

  return (
    <View style={styles.projectCard}>
      {primaryImage ? (
        <Image source={{ uri: primaryImage }} style={styles.projectPreviewImage} />
      ) : (
        <View style={styles.projectPreviewPlaceholder}>
          <Ionicons color={colors.proOrangeTextDark} name="images-outline" size={24} />
          <AppText color={colors.proOrangeTextDark} variant="small">{t('portfolioPreview')}</AppText>
        </View>
      )}
      <View style={styles.projectCardBody}>
        <View style={styles.projectCardTitleRow}>
          <AppText style={styles.projectTitle} variant="bodyStrong">{project.title}</AppText>
          {project.customerPermissionConfirmed ? <StatusBadge label={t('customerPermissionConfirmed')} tone="success" /> : null}
        </View>
        {project.categoryName || project.cityName ? (
          <AppText color={colors.slate500} variant="small">
            {[project.categoryName, project.cityName].filter(Boolean).join(' / ')}
          </AppText>
        ) : null}
        {project.description ? <AppText color={colors.slate700}>{project.description}</AppText> : null}
        <View style={styles.projectMetaRow}>
          {project.approximateDuration ? <StatusBadge label={project.approximateDuration} tone="neutral" /> : null}
          {project.optionalPriceRange ? <StatusBadge label={project.optionalPriceRange} tone="neutral" /> : null}
          <StatusBadge label={`${t('projectPhotos')}: ${project.images.length}`} tone={project.images.length ? 'pro' : 'warning'} />
        </View>
        {canEdit ? (
          <View style={styles.actionRow}>
            <AppButton onPress={onEdit} style={styles.actionButton} tone="pro" variant="outline">
              {t('edit')}
            </AppButton>
            <AppButton
              disabled={isDeleting}
              loading={isDeleting}
              onPress={onDelete}
              style={styles.actionButton}
              tone="neutral"
              variant="outline">
              {t('remove')}
            </AppButton>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PortfolioPhotoSection({
  editingProjectId,
  isUploading,
  onAddPhoto,
  onRemovePhoto,
  photoErrorMessage,
  projects,
  removingPhotoId,
}: {
  editingProjectId: string;
  isUploading: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (projectId: string, imageId: string) => void;
  photoErrorMessage: string | null;
  projects: ProviderProPortfolioProject[];
  removingPhotoId: string | null;
}) {
  const project = projects.find((p) => p.id === editingProjectId);
  const images = project?.images ?? [];

  return (
    <View style={styles.portfolioPhotoSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <AppText variant="bodyStrong">{t('portfolioPhotos')}</AppText>
          {images.length === 0 ? (
            <AppText color={colors.slate500} variant="small">{t('addRealProjectPhotos')}</AppText>
          ) : (
            <AppText color={colors.slate500} variant="small">
              {images.length} {t('projectPhotos').toLowerCase()}
            </AppText>
          )}
        </View>
        <AppButton
          disabled={isUploading}
          loading={isUploading}
          onPress={onAddPhoto}
          style={styles.headerButton}
          tone="pro"
          variant="outline"
        >
          {isUploading ? t('uploadingPortfolioPhoto') : t('addPhotos')}
        </AppButton>
      </View>

      {photoErrorMessage ? <InlineMessage message={photoErrorMessage} tone="error" /> : null}

      {images.length > 0 ? (
        <View style={styles.portfolioPhotoGrid}>
          {images.map((image) => {
            const resolvedUrl = resolveApiMediaUrl(image.url);
            const isRemoving = removingPhotoId === image.id;
            return (
              <View key={image.id} style={styles.portfolioPhotoThumb}>
                <Image source={{ uri: resolvedUrl }} style={styles.portfolioThumbImage} />
                <Pressable
                  accessibilityRole="button"
                  disabled={isRemoving || isUploading}
                  onPress={() => onRemovePhoto(editingProjectId, image.id)}
                  style={[styles.portfolioThumbRemove, (isRemoving || isUploading) ? { opacity: 0.5 } : null]}
                >
                  <Ionicons color={colors.white} name={isRemoving ? 'hourglass-outline' : 'close'} size={14} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.portfolioPhotoEmpty}>
          <Ionicons color={colors.proOrangeTextDark} name="images-outline" size={28} />
          <AppText color={colors.proOrangeTextDark} variant="small" style={{ textAlign: 'center' }}>
            {t('noPortfolioPhotosYet')}
          </AppText>
        </View>
      )}
    </View>
  );
}

function ProfilePhotoCard({
  canChangePhoto,
  isUploading,
  onChangePhoto,
  profile,
  summary,
}: {
  canChangePhoto: boolean;
  isUploading: boolean;
  onChangePhoto: () => void;
  profile: ProviderTaskerProfile;
  summary: ProviderProfileResponse['profile'] | null;
}) {
  const initials = getInitials(profile);
  const photoUrl = resolveApiMediaUrl(profile.profilePhotoUrl || '');
  const statusLabel = summary ? getCoreTaskerStatusLabel(summary.coreTaskerStatus) : profile.taskerStatus;
  const payoutReady = summary?.payoutStatus?.isReady ?? isPayoutReadyFromLabel(summary?.stripeStatusLabel);

  return (
    <AppCard backgroundColor={colors.tasklyBlue50} accentColor={colors.tasklyBlue600}>
      <View style={styles.photoRow}>
        <View style={styles.avatar}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : initials ? (
            <AppText color={colors.tasklyBlue700} style={styles.avatarInitials}>
              {initials}
            </AppText>
          ) : (
            <Ionicons color={colors.tasklyBlue700} name="person-outline" size={30} />
          )}
        </View>
        <View style={styles.photoText}>
          <View style={styles.profileHeaderBadges}>
            <StatusBadge label={statusLabel} tone="core" />
            <StatusBadge label={payoutReady ? t('payoutsReady') : t('payoutSetupNeedsAttention')} tone={payoutReady ? 'success' : 'warning'} />
          </View>
          <AppText variant="sectionTitle">{profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('tasklyTasker')}</AppText>
          <AppText color={colors.slate700}>
            {photoUrl ? t('profilePhotoReady') : t('profilePhotoPlaceholderBody')}
          </AppText>
          {canChangePhoto ? (
            <AppButton
              disabled={isUploading}
              loading={isUploading}
              onPress={onChangePhoto}
              style={styles.photoButton}
              variant="outline"
            >
              {isUploading ? t('uploadingPhoto') : t('changePhoto')}
            </AppButton>
          ) : (
            <AppText color={colors.slate500} variant="small">
              {t('profilePhotoDisplayOnly')}
            </AppText>
          )}
        </View>
      </View>
    </AppCard>
  );
}

function TaskerReadinessCard({
  isRefreshing,
  isStarting,
  items,
  onRefresh,
  onStart,
  payoutStatus,
  stripeStatusLabel,
}: {
  isRefreshing: boolean;
  isStarting: boolean;
  items: ReadinessItem[];
  onRefresh: () => void;
  onStart: () => void;
  payoutStatus: ProviderPayoutStatus | null;
  stripeStatusLabel: string | null;
}) {
  const payoutReady = payoutStatus?.isReady ?? isPayoutReadyFromLabel(stripeStatusLabel);
  const taskerProfileVerified = payoutStatus?.taskerStatus === 'VERIFIED';
  const showOnboardingAction = payoutStatus?.canOpenOnboarding === true;
  const setupLabel = payoutStatus?.hasStripeAccount ? t('continueStripeSetup') : t('setUpPayouts');

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
            <StatusBadge label={payoutReady ? t('payoutsReady') : t('needsAttention')} tone={payoutReady ? 'success' : 'warning'} />
          </View>
          <AppText color={colors.slate700}>
            {payoutReady ? t('yourPayoutsAreReady') : t('payoutSetupNeedsAttention')}
          </AppText>
          <AppText color={colors.slate500} variant="small">
            {t('stripePayoutsExplanation')}
          </AppText>
          {!taskerProfileVerified && !payoutReady ? (
            <AppText color={colors.warning600} variant="small">
              {t('completeTaskerProfileFirst')}
            </AppText>
          ) : null}
          <View style={styles.payoutActions}>
            {showOnboardingAction ? (
              <AppButton disabled={isRefreshing} loading={isStarting} onPress={onStart} style={styles.payoutActionButton}>
                {setupLabel}
              </AppButton>
            ) : null}
            <AppButton
              disabled={isStarting || payoutStatus?.canRefresh === false}
              loading={isRefreshing}
              onPress={onRefresh}
              style={styles.payoutActionButton}
              variant="outline">
              {t('refreshPayoutStatus')}
            </AppButton>
          </View>
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

function getNameInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, 2);
}

function formatProfileList(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(', ') : t('needsAttention');
}

function formatAvailabilitySummary(value: TaskerAvailability | null | undefined) {
  const normalized = normalizeTaskerAvailability(value);
  const enabledDays = availabilityDays.filter((day) => normalized.weekly[day.key].enabled);

  if (!enabledDays.length) {
    return t('needsAttention');
  }

  const labels = enabledDays.map((day) => {
    const window = normalized.weekly[day.key];
    return `${day.label} ${window.start}-${window.end}`;
  });

  return labels.join(', ');
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

function getPhotoUploadErrorMessage(error: ApiError) {
  if (error.code === 'IMAGE_TOO_LARGE') return t('imageTooLarge10Mb');
  if (error.code === 'UNSUPPORTED_IMAGE_TYPE') return t('unsupportedImageType');
  if (error.code === 'MISSING_IMAGE' || error.code === 'INVALID_MULTIPART_BODY') return t('chooseAnotherPhoto');
  if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') return t('pleaseLoginToContinue');
  return t('couldNotUpdatePhoto');
}

function getPortfolioPhotoUploadErrorMessage(error: ApiError) {
  if (error.code === 'IMAGE_TOO_LARGE') return t('imageTooLarge10Mb');
  if (error.code === 'UNSUPPORTED_IMAGE_TYPE') return t('unsupportedImageType');
  if (error.code === 'MISSING_IMAGE' || error.code === 'INVALID_MULTIPART_BODY') return t('chooseAnotherPhoto');
  if (error.code === 'MAX_IMAGES_REACHED') return t('maxPortfolioImagesReached');
  if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') return t('pleaseLoginToContinue');
  return t('couldNotUploadPortfolioPhoto');
}

function getPayoutActionErrorMessage(error: ApiError, fallback = t('couldNotOpenStripeSetup')) {
  if (error.code === 'TASKER_REVIEW_PENDING' || error.message === 'TASKER_REVIEW_PENDING') {
    return t('completeTaskerProfileFirst');
  }
  if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
    return t('pleaseLoginToContinue');
  }
  return fallback;
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
      <AppText
        color={selected ? colors.tasklyBlue700 : colors.slate500}
        numberOfLines={2}
        style={styles.toggleChipText}
        variant="bodyStrong">
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
  availabilityList: {
    gap: spacing.sm,
  },
  availabilityRow: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  availabilityTimeField: {
    minWidth: 0,
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
  hubBlock: {
    gap: spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editBlock: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
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
  modalActions: {
    backgroundColor: colors.white,
    borderTopColor: colors.tasklyBlueBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  modalContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 5,
    opacity: 0.45,
    width: 48,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  modalInfoStrip: {
    alignItems: 'flex-start',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  modalInfoText: {
    flex: 1,
    lineHeight: 18,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: spacing.md,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    shadowColor: colors.navy900,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 18,
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
  payoutActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  payoutActionButton: {
    minHeight: 42,
  },
  photoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  photoText: {
    flex: 1,
    gap: spacing.xs,
  },
  profileHeaderBadges: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  profileModeHeader: {
    gap: spacing.sm,
  },
  profileModeOption: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 78,
    minWidth: 132,
    padding: spacing.md,
  },
  profileModeOptionCoreSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  profileModeOptionProSelected: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrange600,
  },
  profileModeSwitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  profileModeText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  profileSectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginRight: spacing.md,
    minHeight: 300,
    padding: spacing.md,
    width: 300,
  },
  profileSectionCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  profileSectionCarousel: {
    paddingRight: spacing.md,
  },
  profileSectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  profileSectionRows: {
    gap: spacing.sm,
  },
  profileSectionTab: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  profileSectionTabs: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  profileSectionTabText: {
    fontWeight: '800',
  },
  profileSectionTitle: {
    flex: 1,
  },
  profileSummaryRow: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    padding: spacing.sm,
  },
  profileSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  portfolioBlock: {
    borderTopColor: colors.proOrangeBorder,
    borderTopWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  portfolioPhotoEmpty: {
    alignItems: 'center',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 88,
    padding: spacing.md,
  },
  portfolioPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  portfolioPhotoHint: {
    alignItems: 'center',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  portfolioPhotoSection: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  portfolioThumbImage: {
    height: '100%',
    width: '100%',
  },
  portfolioThumbRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 51, 0.60)',
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 22,
  },
  portfolioPhotoThumb: {
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 80,
    overflow: 'hidden',
    position: 'relative',
    width: 80,
  },
  proApprovalPanel: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  proHero: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  proHeroBody: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  proHeroPhoto: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 82,
  },
  proMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  proReadinessPanel: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  projectCardBody: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  projectCardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
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
  projectMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  projectPreviewImage: {
    aspectRatio: 1.8,
    backgroundColor: colors.proOrange50,
    width: '100%',
  },
  projectPreviewPlaceholder: {
    alignItems: 'center',
    aspectRatio: 1.8,
    backgroundColor: colors.proOrange50,
    gap: spacing.xs,
    justifyContent: 'center',
    width: '100%',
  },
  projectTitle: {
    flex: 1,
    minWidth: 120,
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
  sectionEditButton: {
    marginTop: 'auto',
    minHeight: 42,
  },
  sectionTitleBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  successMessage: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  segmentBlock: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  segmentControl: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
  },
  segmentLabel: {
    fontSize: 14,
    lineHeight: 19,
  },
  segmentOption: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentOptionSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  segmentOptionText: {
    textAlign: 'center',
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
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 44,
    minWidth: 96,
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleChipText: {
    flexShrink: 1,
    lineHeight: 18,
    textAlign: 'center',
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
