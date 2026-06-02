import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardTypeOptions,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import { ImagePickerPlaceholder, TasklyLogoText, useCustomerCreateBarScrollHandler } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCities, getPostingRules, getProCategories } from '@/src/lib/api/catalog';
import { createCustomerProRequest } from '@/src/lib/api/customer';
import { CatalogCategory, CityOption, ProRequestPostingRules } from '@/src/lib/api/domain';
import {
  getMockCitiesCatalogResponse,
  getMockPostingRulesResponse,
  getMockProCategoriesResponse,
} from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import {
  compressSelectedImages,
  pickTasklyImages,
  requestImageLibraryPermission,
  validateSelectedImages,
} from '@/src/lib/images/imagePicker';
import { LocalSelectedImage } from '@/src/lib/images/types';
import { uploadSelectedImagesSequentially } from '@/src/lib/images/uploadSelectedImages';
import { t, TranslationKey, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type CatalogState = {
  categories: CatalogCategory[];
  cities: CityOption[];
  rules: ProRequestPostingRules;
};

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

type ValidationFieldKey =
  | 'budgetMaxEur'
  | 'budgetMinEur'
  | 'categoryKey'
  | 'cityId'
  | 'description'
  | 'district'
  | 'timeline'
  | 'title';

type ValidationIssue = {
  key: ValidationFieldKey;
  label: string;
  message: string;
  step: WizardStep;
};

type StepMeta = {
  body: string;
  id: WizardStep;
  label: string;
  support: string;
  title: string;
};

const STEP_TOTAL = 6;
const QUICK_BUDGET_RANGES = [
  { max: '2500', min: '800' },
  { max: '7000', min: '2500' },
  { max: '15000', min: '7000' },
];

const PROPERTY_TYPE_KEYS = [
  'proPropertyApartment',
  'proPropertyHouse',
  'proPropertyOffice',
  'proPropertyCommercial',
  'other',
] as const;

const SITE_VISIT_KEYS = [
  'proSiteVisitNotSure',
  'proSiteVisitLikely',
  'proSiteVisitPhotosEnough',
] as const;

const SITE_VISIT_EN_LABELS: Record<string, string> = {
  proSiteVisitNotSure: 'Not sure yet',
  proSiteVisitLikely: 'Yes, likely needed',
  proSiteVisitPhotosEnough: 'No, photos/details are enough',
};

function parseNumberInput(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeApiFieldErrors(fieldErrors: Record<string, string>) {
  const keyMap: Record<string, ValidationFieldKey> = {
    budgetMax: 'budgetMaxEur',
    budgetMaxEur: 'budgetMaxEur',
    budgetMin: 'budgetMinEur',
    budgetMinEur: 'budgetMinEur',
    categoryId: 'categoryKey',
    categoryKey: 'categoryKey',
    categorySlug: 'categoryKey',
    cityId: 'cityId',
    description: 'description',
    district: 'district',
    timeline: 'timeline',
    title: 'title',
  };

  return Object.entries(fieldErrors).reduce<Record<string, string>>((normalized, [key, message]) => {
    normalized[keyMap[key] ?? key] = message;
    return normalized;
  }, {});
}

function getSafeApiMessage(message: string) {
  if (!message || message.includes('\n') || message.includes(' at ')) {
    return t('couldNotCreateProRequest');
  }

  return message;
}

function formatUploadProgress(current: number, total: number) {
  return t('uploadingPhotosProgress')
    .replace('{current}', String(current))
    .replace('{total}', String(total));
}

function getLocalizedCategoryName(category: CatalogCategory, locale: 'bg' | 'en') {
  return locale === 'bg' ? category.nameBg || category.nameEn : category.nameEn || category.nameBg;
}

function getLocalizedCategoryDescription(category: CatalogCategory, locale: 'bg' | 'en') {
  return locale === 'bg'
    ? category.descriptionBg || category.descriptionEn
    : category.descriptionEn || category.descriptionBg;
}

function getLocalizedCityName(city: CityOption, locale: 'bg' | 'en') {
  return locale === 'bg' ? city.nameBg || city.nameEn : city.nameEn || city.nameBg;
}

function getCategoryIcon(category: CatalogCategory): keyof typeof Ionicons.glyphMap {
  const value = `${category.slug} ${category.nameEn}`.toLowerCase();

  if (value.includes('bath') || value.includes('tile')) return 'water-outline';
  if (value.includes('electric')) return 'flash-outline';
  if (value.includes('kitchen')) return 'restaurant-outline';
  if (value.includes('paint')) return 'color-palette-outline';
  if (value.includes('repair') || value.includes('renov')) return 'construct-outline';
  return 'business-outline';
}

function Field({
  errorText,
  helperText,
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  errorText?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText color={colors.proOrangeTextDark} variant="small">{label}</AppText>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.slate500}
        style={[styles.input, multiline ? styles.textArea : null, errorText ? styles.inputError : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
      {errorText ? <AppText color={colors.danger600} variant="small">{errorText}</AppText> : null}
      {!errorText && helperText ? <AppText color={colors.slate500} variant="small">{helperText}</AppText> : null}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.navy900} variant="bodyStrong">{value || '-'}</AppText>
    </View>
  );
}

export default function CustomerPostProRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const handleCustomerScroll = useCustomerCreateBarScrollHandler();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [district, setDistrict] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [projectSize, setProjectSize] = useState('');
  const [specialtyNotes, setSpecialtyNotes] = useState('');
  const [siteVisitNeeded, setSiteVisitNeeded] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [images, setImages] = useState<LocalSelectedImage[]>([]);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressCurrent, setUploadProgressCurrent] = useState(0);
  const [uploadProgressTotal, setUploadProgressTotal] = useState(0);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const loadCatalog = useCallback(async () => {
    setErrorMessage(null);

    if (status === 'demo') {
      const rules = getMockPostingRulesResponse();
      setCatalog({
        categories: getMockProCategoriesResponse().categories,
        cities: getMockCitiesCatalogResponse().cities,
        rules: rules.proRequest,
      });
      return;
    }

    setIsLoading(true);
    const authToken = status === 'authenticated' ? await getValidAccessToken() : null;
    const [citiesResult, categoriesResult, rulesResult] = await Promise.all([
      getCities(authToken),
      getProCategories(authToken),
      getPostingRules(authToken),
    ]);

    if (citiesResult.ok && categoriesResult.ok && rulesResult.ok) {
      setCatalog({
        categories: categoriesResult.data.categories,
        cities: citiesResult.data.cities,
        rules: rulesResult.data.proRequest,
      });
      setIsLoading(false);
      return;
    }

    setCatalog(null);
    setErrorMessage(t('couldNotLoadProRequestSetup'));
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

  const steps: StepMeta[] = [
    {
      body: t('proWizardProjectTypeBody'),
      id: 1,
      label: t('proWizardStepProjectType'),
      support: t('proWizardProjectTypeSupport'),
      title: t('proWizardProjectTypeTitle'),
    },
    {
      body: t('proWizardLocationBody'),
      id: 2,
      label: t('proWizardStepLocation'),
      support: t('proWizardLocationSupport'),
      title: t('proWizardLocationTitle'),
    },
    {
      body: t('proWizardDetailsBody'),
      id: 3,
      label: t('proWizardStepDetails'),
      support: t('proWizardDetailsSupport'),
      title: t('proWizardDetailsTitle'),
    },
    {
      body: t('proWizardBudgetBody'),
      id: 4,
      label: t('proWizardStepBudget'),
      support: t('proWizardBudgetSupport'),
      title: t('proWizardBudgetTitle'),
    },
    {
      body: t('proWizardPhotosBody'),
      id: 5,
      label: t('proWizardStepPhotos'),
      support: t('proWizardPhotosSupport'),
      title: t('proWizardPhotosTitle'),
    },
    {
      body: t('proWizardReviewBody'),
      id: 6,
      label: t('proWizardStepReview'),
      support: t('proWizardReviewSupport'),
      title: t('proWizardReviewTitle'),
    },
  ];

  const activeStep = steps[currentStep - 1];
  const progressPercent = (currentStep / STEP_TOTAL) * 100;
  const selectedCategory = catalog?.categories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedCity = catalog?.cities.find((city) => city.id === selectedCityId) ?? null;
  const selectedCategoryLabel = selectedCategory ? getLocalizedCategoryName(selectedCategory, locale) : t('notSelectedYet');
  const selectedCityLabel = selectedCity ? getLocalizedCityName(selectedCity, locale) : t('notSelectedYet');
  const combinedDescription = useMemo(() => {
    const extras = [
      propertyType ? `${t('propertyType')}: ${propertyType}` : null,
      projectSize ? `${t('projectSize')}: ${projectSize}` : null,
      specialtyNotes ? `${t('specialtyDetails')}: ${specialtyNotes}` : null,
      siteVisitNeeded ? `Site visit needed: ${SITE_VISIT_EN_LABELS[siteVisitNeeded] ?? siteVisitNeeded}` : null,
    ].filter(Boolean);

    return [description.trim(), ...extras].filter(Boolean).join('\n\n');
  }, [description, projectSize, propertyType, siteVisitNeeded, specialtyNotes]);

  const clearFieldError = useCallback((key: ValidationFieldKey) => {
    setSubmitError(null);
    setFieldErrors((current) => {
      if (!current[key]) return current;

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  }, []);

  const formValidation = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const minDescriptionLength = catalog?.rules.minDescriptionLength ?? 30;
    const maxDescriptionLength = catalog?.rules.maxDescriptionLength ?? 4000;
    const parsedBudgetMin = parseNumberInput(budgetMin);
    const parsedBudgetMax = parseNumberInput(budgetMax);
    const addIssue = (key: ValidationFieldKey, label: string, message: string, step: WizardStep) => {
      issues.push({ key, label, message, step });
    };

    if (!selectedCategoryId) addIssue('categoryKey', t('proCategory'), t('missingProCategory'), 1);
    if (!selectedCityId) addIssue('cityId', t('city'), t('missingCity'), 2);
    if (!district.trim()) addIssue('district', t('areaOrDistrict'), t('missingDistrictArea'), 2);
    if (!title.trim()) addIssue('title', t('projectTitle'), t('missingTitle'), 3);

    if (!description.trim()) {
      addIssue('description', t('projectDescription'), t('missingDescription'), 3);
    } else if (description.trim().length < minDescriptionLength) {
      addIssue('description', t('projectDescription'), `${t('descriptionTooShort')} ${minDescriptionLength}.`, 3);
    } else if (combinedDescription.length > maxDescriptionLength) {
      addIssue('description', t('projectDescription'), t('descriptionTooLongForProRequest'), 3);
    }

    if (!timeline.trim()) addIssue('timeline', t('preferredStartDate'), t('missingTimeline'), 4);

    if (!budgetMin.trim()) {
      addIssue('budgetMinEur', t('budgetRange'), t('missingBudget'), 4);
    } else if (parsedBudgetMin === null || parsedBudgetMin < 0) {
      addIssue('budgetMinEur', t('budgetRange'), t('invalidBudget'), 4);
    }

    if (!budgetMax.trim()) {
      addIssue('budgetMaxEur', t('budgetRange'), t('missingBudget'), 4);
    } else if (parsedBudgetMax === null || parsedBudgetMax < 0) {
      addIssue('budgetMaxEur', t('budgetRange'), t('invalidBudget'), 4);
    }

    if (parsedBudgetMin !== null && parsedBudgetMax !== null && parsedBudgetMax < parsedBudgetMin) {
      addIssue('budgetMaxEur', t('budgetRange'), t('maxBudgetMustBeAtLeastMin'), 4);
    }

    const errors = issues.reduce<Record<ValidationFieldKey, string>>((nextErrors, issue) => {
      if (!nextErrors[issue.key]) {
        nextErrors[issue.key] = issue.message;
      }

      return nextErrors;
    }, {} as Record<ValidationFieldKey, string>);

    return {
      errors,
      issues,
      parsedBudgetMax,
      parsedBudgetMin,
    };
  }, [
    budgetMax,
    budgetMin,
    catalog?.rules.maxDescriptionLength,
    catalog?.rules.minDescriptionLength,
    combinedDescription,
    description,
    district,
    selectedCategoryId,
    selectedCityId,
    timeline,
    title,
  ]);

  const stepIssues = useCallback(
    (step: WizardStep) => formValidation.issues.filter((issue) => issue.step === step),
    [formValidation.issues],
  );
  const shouldShowStepErrors = hasSubmittedOnce || Boolean(attemptedSteps[currentStep]);
  const getFieldError = (key: ValidationFieldKey) => (shouldShowStepErrors || hasSubmittedOnce ? fieldErrors[key] || formValidation.errors[key] : undefined);
  const isBusy = isSubmitting || isUploadingImages;

  const handlePickImages = useCallback(async () => {
    const rules = catalog?.rules ?? getMockPostingRulesResponse().proRequest;
    setImageErrorMessage(null);
    setIsProcessingImages(true);

    try {
      const permission = await requestImageLibraryPermission();

      if (!permission.granted) {
        setImageErrorMessage(t('allowPhotoAccess'));
        return;
      }

      const pickedImages = await pickTasklyImages({
        currentCount: images.length,
        maxImages: rules.maxImages,
      });

      if (!pickedImages.length) {
        return;
      }

      const validation = validateSelectedImages(pickedImages, {
        acceptedImageTypes: rules.acceptedImageTypes,
        maxImages: Math.max(0, rules.maxImages - images.length),
      });
      const compressedImages = await compressSelectedImages(validation.accepted, {
        compress: 0.75,
        maxWidth: 1600,
      });

      setImages((current) => [...current, ...compressedImages]);

      const hasProcessingError = compressedImages.some((image) => image.status === 'error');
      if (validation.rejected.length || hasProcessingError) {
        setImageErrorMessage(t('somePhotosCouldNotBeAdded'));
      }
    } catch {
      setImageErrorMessage(t('couldNotProcessPhoto'));
    } finally {
      setIsProcessingImages(false);
    }
  }, [catalog?.rules, images.length]);

  const handleRemoveImage = useCallback((imageId: string) => {
    setImages((current) => current.filter((image) => image.id !== imageId));
    setImageErrorMessage(null);
  }, []);

  const handleContinue = useCallback(() => {
    setAttemptedSteps((current) => ({ ...current, [currentStep]: true }));

    const currentStepIssues = stepIssues(currentStep);
    if (currentStepIssues.length) {
      return;
    }

    if (currentStep < STEP_TOTAL) {
      setCurrentStep((step) => (step + 1) as WizardStep);
    }
  }, [currentStep, stepIssues]);

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      router.back();
      return;
    }

    setCurrentStep((step) => (step - 1) as WizardStep);
  }, [currentStep, router]);

  const handleSubmit = useCallback(async () => {
    setHasSubmittedOnce(true);
    setSubmitMessage(null);
    setSubmitError(null);
    setUploadWarning(null);
    setUploadProgressCurrent(0);
    setUploadProgressTotal(0);
    setFieldErrors({});

    if (formValidation.issues.length > 0 || !selectedCategoryId || !selectedCityId) {
      setFieldErrors(formValidation.errors);
      const firstIssue = formValidation.issues[0];
      if (firstIssue) {
        setCurrentStep(firstIssue.step);
      }
      setSubmitError(t('pleaseCheckHighlightedFields'));
      return;
    }

    if (status === 'demo') {
      setSubmitMessage(t('demoDoesNotCreateProRequests'));
      return;
    }

    if (status !== 'authenticated') {
      setSubmitError(t('loginRequired'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setSubmitError(t('loginRequired'));
      return;
    }

    setIsSubmitting(true);
    const result = await createCustomerProRequest(
      {
        budgetMaxEur: formValidation.parsedBudgetMax!,
        budgetMinEur: formValidation.parsedBudgetMin!,
        categoryKey: selectedCategoryId,
        cityId: selectedCityId,
        description: combinedDescription,
        district: district.trim(),
        localImageCount: images.length,
        timeline: timeline.trim(),
        title: title.trim(),
        ...(addressNotes.trim() && { locationAddress: addressNotes.trim() }),
        ...(locationNotes.trim() && { internalLocationDetails: locationNotes.trim() }),
      },
      authToken,
    );
    setIsSubmitting(false);

    if (result.ok) {
      const proRequestId = result.data.proRequest.id;

      if (images.length > 0) {
        setSubmitMessage(t('proRequestCreatedUploadingPhotos'));
        setIsUploadingImages(true);

        const uploadSummary = await uploadSelectedImagesSequentially({
          authToken,
          entityId: proRequestId,
          entityType: 'proRequest',
          images,
          onProgress: ({ current, total }) => {
            setUploadProgressCurrent(current);
            setUploadProgressTotal(total);
            setSubmitMessage(formatUploadProgress(current, total));
          },
        });

        setIsUploadingImages(false);

        if (uploadSummary.failed > 0) {
          setUploadWarning(t('proRequestCreatedSomePhotosFailed'));
          setSubmitMessage(t('proRequestCreated'));
          setTimeout(() => {
            router.push(`/customer/pro-requests/${proRequestId}` as Href);
          }, 1200);
          return;
        }

        if (uploadSummary.skipped > 0) {
          setUploadWarning(t('somePhotosSkipped'));
          setTimeout(() => {
            router.push(`/customer/pro-requests/${proRequestId}` as Href);
          }, 1200);
          return;
        }

        if (uploadSummary.uploaded > 0) {
          setSubmitMessage(t('photosUploaded'));
        } else {
          setSubmitMessage(t('proRequestCreated'));
        }

        router.push(`/customer/pro-requests/${proRequestId}` as Href);
        return;
      }

      setSubmitMessage(t('proRequestCreated'));
      router.push(`/customer/pro-requests/${proRequestId}` as Href);
      return;
    }

    const details = result.error.details;
    const maybeFieldErrors =
      details && typeof details === 'object' && 'fieldErrors' in details
        ? (details as { fieldErrors?: Record<string, string> }).fieldErrors
        : undefined;

    if (maybeFieldErrors) {
      setFieldErrors(normalizeApiFieldErrors(maybeFieldErrors));
    }

    setSubmitError(getSafeApiMessage(result.error.message));
  }, [
    addressNotes,
    combinedDescription,
    district,
    formValidation,
    getValidAccessToken,
    images,
    locationNotes,
    router,
    selectedCategoryId,
    selectedCityId,
    status,
    timeline,
    title,
  ]);

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
            <AppText color={colors.slate700}>{activeStep.body}</AppText>
            <View style={styles.optionList}>
              {catalog?.categories.map((category) => {
                const selected = selectedCategoryId === category.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={category.id}
                    onPress={() => {
                      setSelectedCategoryId(category.id);
                      clearFieldError('categoryKey');
                    }}
                    style={({ pressed }) => [
                      styles.selectionCard,
                      selected ? styles.selectionCardSelected : null,
                      pressed ? styles.pressed : null,
                    ]}>
                    <View style={[styles.iconBox, selected ? styles.iconBoxSelected : null]}>
                      <Ionicons
                        color={selected ? colors.white : colors.proOrangeText}
                        name={getCategoryIcon(category)}
                        size={20}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <AppText color={colors.navy900} variant="bodyStrong">
                        {getLocalizedCategoryName(category, locale)}
                      </AppText>
                      {getLocalizedCategoryDescription(category, locale) ? (
                        <AppText color={colors.slate700} variant="small">
                          {getLocalizedCategoryDescription(category, locale)}
                        </AppText>
                      ) : null}
                    </View>
                    {selected ? <Ionicons color={colors.proOrange600} name="checkmark-circle" size={22} /> : null}
                  </Pressable>
                );
              })}
              {!catalog?.categories.length ? <AppText color={colors.slate500}>{t('noProCategoriesAvailable')}</AppText> : null}
            </View>
            {getFieldError('categoryKey') ? <AppText color={colors.danger600} variant="small">{getFieldError('categoryKey')}</AppText> : null}
          </View>

          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{t('propertyType')}</AppText>
            <View style={styles.chipRow}>
              {PROPERTY_TYPE_KEYS.map((key) => (
                <ChoiceChip
                  key={key}
                  label={t(key)}
                  onPress={() => setPropertyType(t(key))}
                  selected={propertyType === t(key)}
                />
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
            <AppText color={colors.slate700}>{activeStep.body}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowCityPicker(true)}
              style={({ pressed }) => [
                styles.selectField,
                getFieldError('cityId') ? styles.inputError : null,
                pressed ? styles.pressed : null,
              ]}>
              <Ionicons color={colors.proOrange600} name="location-outline" size={18} />
              <AppText
                color={selectedCity ? colors.navy900 : colors.slate500}
                style={styles.selectFieldValue}>
                {selectedCity ? getLocalizedCityName(selectedCity, locale) : t('selectCity')}
              </AppText>
              <Ionicons color={colors.slate500} name="chevron-down" size={18} />
            </Pressable>
            {!catalog?.cities.length ? <AppText color={colors.slate500}>{t('noCitiesAvailable')}</AppText> : null}
            {getFieldError('cityId') ? <AppText color={colors.danger600} variant="small">{getFieldError('cityId')}</AppText> : null}
            <Modal
              animationType="slide"
              onRequestClose={() => setShowCityPicker(false)}
              transparent
              visible={showCityPicker}>
              <Pressable style={styles.pickerBackdrop} onPress={() => setShowCityPicker(false)}>
                <Pressable style={[styles.pickerSheet, { marginBottom: Math.max(insets.bottom, spacing.sm) }]}>
                  <View style={styles.pickerHeader}>
                    <AppText style={styles.sectionTitle}>{t('selectCity')}</AppText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowCityPicker(false)}
                      style={styles.pickerClose}>
                      <Ionicons color={colors.proOrangeTextDark} name="close" size={18} />
                    </Pressable>
                  </View>
                  <ScrollView
                    contentContainerStyle={[
                      styles.pickerList,
                      { paddingBottom: Math.max(insets.bottom + spacing.xxl, spacing.xxl) },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    style={styles.pickerScroll}>
                    {catalog?.cities.map((city) => {
                      const selected = selectedCityId === city.id;

                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          key={city.id}
                          onPress={() => {
                            setSelectedCityId(city.id);
                            clearFieldError('cityId');
                            setShowCityPicker(false);
                          }}
                          style={[
                            styles.pickerOption,
                            selected ? styles.pickerOptionSelected : null,
                          ]}>
                          <AppText
                            color={selected ? colors.proOrange600 : colors.navy900}
                            style={styles.pickerOptionText}>
                            {getLocalizedCityName(city, locale)}
                          </AppText>
                          {selected ? <Ionicons color={colors.proOrange600} name="checkmark-circle" size={18} /> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </View>

          <View style={styles.sectionCard}>
            <Field
              errorText={getFieldError('district')}
              label={t('areaOrDistrict')}
              onChangeText={(value) => {
                setDistrict(value);
                clearFieldError('district');
              }}
              placeholder={t('proRequestDistrictPlaceholder')}
              value={district}
            />
            <Field
              helperText={t('proLocationPrivacyHelper')}
              label={t('locationAddress')}
              onChangeText={setAddressNotes}
              placeholder={t('proLocationAddressPlaceholder')}
              value={addressNotes}
            />
            <Field
              helperText={t('proLocationNotesHelper')}
              label={t('locationNotes')}
              multiline
              onChangeText={setLocationNotes}
              placeholder={t('locationNotesPlaceholder')}
              value={locationNotes}
            />
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      const maxDescriptionLength = catalog?.rules.maxDescriptionLength ?? 4000;

      return (
        <View style={styles.stepStack}>
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
            <AppText color={colors.slate700}>{activeStep.body}</AppText>
            <Field
              errorText={getFieldError('title')}
              label={t('projectTitle')}
              onChangeText={(value) => {
                setTitle(value);
                clearFieldError('title');
              }}
              placeholder={t('proRequestTitlePlaceholder')}
              value={title}
            />
            <Field
              errorText={getFieldError('description')}
              helperText={t('proRequestDescriptionCounter')
                .replace('{count}', String(combinedDescription.length))
                .replace('{max}', String(maxDescriptionLength))}
              label={t('projectDescription')}
              multiline
              onChangeText={(value) => {
                setDescription(value);
                clearFieldError('description');
              }}
              placeholder={t('proRequestDescriptionPlaceholder')}
              value={description}
            />
            <Field
              label={t('projectSize')}
              onChangeText={setProjectSize}
              placeholder={t('projectSizePlaceholder')}
              value={projectSize}
            />
            <Field
              helperText={t('specialtyDetailsHelper')}
              label={t('specialtyDetails')}
              multiline
              onChangeText={setSpecialtyNotes}
              placeholder={t('specialtyDetailsPlaceholder')}
              value={specialtyNotes}
            />
          </View>
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
            <AppText color={colors.slate700}>{activeStep.body}</AppText>
            <View style={styles.quickBudgetRow}>
              {QUICK_BUDGET_RANGES.map((range) => (
                <ChoiceChip
                  key={`${range.min}-${range.max}`}
                  label={`€${range.min} - €${range.max}`}
                  onPress={() => {
                    setBudgetMin(range.min);
                    setBudgetMax(range.max);
                    clearFieldError('budgetMinEur');
                    clearFieldError('budgetMaxEur');
                  }}
                  selected={budgetMin === range.min && budgetMax === range.max}
                />
              ))}
            </View>
            <View style={styles.twoColumn}>
              <Field
                errorText={getFieldError('budgetMinEur')}
                keyboardType="decimal-pad"
                label={t('minBudget')}
                onChangeText={(value) => {
                  setBudgetMin(value);
                  clearFieldError('budgetMinEur');
                  clearFieldError('budgetMaxEur');
                }}
                placeholder={t('proRequestBudgetMinPlaceholder')}
                value={budgetMin}
              />
              <Field
                errorText={getFieldError('budgetMaxEur')}
                keyboardType="decimal-pad"
                label={t('maxBudget')}
                onChangeText={(value) => {
                  setBudgetMax(value);
                  clearFieldError('budgetMinEur');
                  clearFieldError('budgetMaxEur');
                }}
                placeholder={t('proRequestBudgetMaxPlaceholder')}
                value={budgetMax}
              />
            </View>
            <Field
              errorText={getFieldError('timeline')}
              helperText={t('proPreferredStartHelper')}
              label={t('preferredStartDate')}
              onChangeText={(value) => {
                setTimeline(value);
                clearFieldError('timeline');
              }}
              placeholder={t('proRequestTimelinePlaceholder')}
              value={timeline}
            />
          </View>

          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{t('siteVisitNeeded')}</AppText>
            <View style={styles.chipColumn}>
              {SITE_VISIT_KEYS.map((key) => (
                <ChoiceChip
                  key={key}
                  label={t(key)}
                  onPress={() => setSiteVisitNeeded(key)}
                  selected={siteVisitNeeded === key}
                />
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.stepStack}>
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
            <AppText color={colors.slate700}>{activeStep.body}</AppText>
            <ImagePickerPlaceholder
              acceptedImageTypes={catalog?.rules.acceptedImageTypes}
              accent="pro"
              errorMessage={imageErrorMessage}
              helperText={t('proRequestPhotosHelper')}
              images={images}
              isProcessing={isProcessingImages}
              maxImages={catalog?.rules.maxImages}
              onPickImages={handlePickImages}
              onRemoveImage={handleRemoveImage}
            />
          </View>
        </View>
      );
    }

    const missingFieldLabels = Array.from(new Set(formValidation.issues.map((issue) => issue.label)));

    return (
      <View style={styles.stepStack}>
        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>{activeStep.title}</AppText>
          <AppText color={colors.slate700}>{activeStep.body}</AppText>
          <View style={styles.reviewTrustCard}>
            <Ionicons color={colors.proOrange600} name="shield-checkmark-outline" size={18} />
            <AppText color={colors.proOrangeTextDark} style={styles.reviewTrustText} variant="small">
              {t('proWizardReviewTrust')}
            </AppText>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryRow label={t('category')} value={selectedCategoryLabel} />
            <SummaryRow label={t('propertyType')} value={propertyType || t('notSelectedYet')} />
            <SummaryRow label={t('city')} value={selectedCityLabel} />
            <SummaryRow label={t('areaOrDistrict')} value={district || t('notSelectedYet')} />
            <SummaryRow label={t('projectTitle')} value={title || t('notSelectedYet')} />
            <SummaryRow label={t('budgetRange')} value={budgetMin && budgetMax ? `€${budgetMin} - €${budgetMax}` : t('notSelectedYet')} />
            <SummaryRow label={t('timeline')} value={timeline || t('notSelectedYet')} />
            <SummaryRow label={t('siteVisitNeeded')} value={siteVisitNeeded ? t(siteVisitNeeded as TranslationKey) : t('notSelectedYet')} />
            <SummaryRow label={t('photos')} value={images.length ? String(images.length) : t('noPhotosAdded')} />
          </View>
        </View>

        {missingFieldLabels.length ? (
          <View style={styles.validationCard}>
            <StatusBadge label={t('completeRequiredFields')} tone="warning" />
            <AppText color={colors.slate700}>{t('completeTheseFieldsToSubmit')}</AppText>
            <View style={styles.chipRow}>
              {missingFieldLabels.map((label) => (
                <View key={label} style={styles.validationPill}>
                  <AppText color={colors.slate700} variant="small">{label}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <TasklyLogoText navIcon />
          <Pressable accessibilityLabel={t('close')} onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons color={colors.proOrangeTextDark} name="close" size={22} />
          </Pressable>
        </View>

        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTopLine}>
              <View style={styles.badgeRow}>
                <MiniChip label={t('tasklyPro')} tone="pro" />
                <MiniChip label={t('postingIsFree')} />
              </View>
              <AppText color={colors.proOrangeTextDark} style={styles.stepText} variant="small">
                {t('proWizardStepIndicator')
                  .replace('{current}', String(currentStep))
                  .replace('{total}', String(STEP_TOTAL))}
                {' · '}
                {activeStep.support}
              </AppText>
            </View>
            <AppText style={styles.heroTitle}>{t('proWizardTitle')}</AppText>
            <AppText color={colors.slate700} style={styles.compactIntro} variant="small">{t('postProRequestIntro')}</AppText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stepperContent}>
              {steps.map((step) => {
                const selected = step.id === currentStep;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={step.id}
                    onPress={() => setCurrentStep(step.id)}
                    style={[styles.stepPill, selected ? styles.stepPillActive : null]}>
                    <AppText color={selected ? colors.white : colors.proOrangeTextDark} style={styles.stepPillText} variant="small">
                      {step.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <StatusBadge label={t('loading')} tone="pro" />
              <AppText variant="cardTitle">{t('loadingProRequestSetup')}</AppText>
              <AppText color={colors.slate700}>{t('loadingProRequestSetupBody')}</AppText>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.stateCard}>
              <StatusBadge label={t('couldNotLoadProRequestSetupTitle')} tone="danger" />
              <AppText color={colors.slate700}>{errorMessage}</AppText>
              <View style={styles.buttonStack}>
                <AppButton onPress={loadCatalog} tone="pro" variant="outline">{t('retry')}</AppButton>
                <AppButton onPress={useDemoSession} tone="neutral" variant="outline">{t('continueDemoMode')}</AppButton>
              </View>
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.content}
            onScroll={handleCustomerScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            {renderStep()}

            {isUploadingImages ? (
              <AppCard accentColor={colors.proOrange600}>
                <StatusBadge label={t('uploadingPhotos')} tone="pro" />
                <AppText color={colors.slate700}>
                  {uploadProgressTotal > 0
                    ? formatUploadProgress(uploadProgressCurrent, uploadProgressTotal)
                    : t('proRequestCreatedUploadingPhotos')}
                </AppText>
              </AppCard>
            ) : null}

            {uploadWarning ? (
              <AppCard accentColor={colors.warning600}>
                <StatusBadge label={t('somePhotosSkipped')} tone="warning" />
                <AppText color={colors.slate700}>{uploadWarning}</AppText>
              </AppCard>
            ) : null}

            {submitMessage ? (
              <AppCard accentColor={colors.success600}>
                <StatusBadge label={t('proRequestCreated')} tone="success" />
                <AppText color={colors.slate700}>{submitMessage}</AppText>
              </AppCard>
            ) : null}

            {submitError ? (
              <AppCard accentColor={colors.danger600}>
                <StatusBadge label={t('couldNotCreateProRequest')} tone="danger" />
                <AppText color={colors.slate700}>{submitError}</AppText>
              </AppCard>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <AppButton disabled={isBusy} onPress={handleBack} style={styles.footerButton} tone="neutral" variant="outline">
                {currentStep === 1 ? t('cancel') : t('back')}
              </AppButton>
              <AppButton
                disabled={isBusy}
                loading={isBusy}
                onPress={currentStep === STEP_TOTAL ? handleSubmit : handleContinue}
                style={styles.footerButton}
                tone="pro">
                {currentStep === STEP_TOTAL ? t('submitRequest') : t('continueAction')}
              </AppButton>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function ChoiceChip({
  label,
  onPress,
  selected,
  style,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceChip,
        selected ? styles.choiceChipSelected : null,
        pressed ? styles.pressed : null,
        style,
      ]}>
      <AppText color={selected ? colors.white : colors.proOrangeTextDark} variant="small">{label}</AppText>
    </Pressable>
  );
}

function MiniChip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'pro' }) {
  const isPro = tone === 'pro';

  return (
    <View style={[styles.miniChip, isPro ? styles.miniChipPro : null]}>
      <AppText color={isPro ? colors.white : colors.proOrangeTextDark} style={styles.miniChipText} variant="small">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  chipColumn: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceChipSelected: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange500,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  content: {
    gap: spacing.md,
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  compactIntro: {
    lineHeight: 18,
  },
  field: {
    gap: spacing.xs,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.proOrangeBorder,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  headerTopLine: {
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconBoxSelected: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.sheet,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    shadowColor: colors.proOrange600,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  modalHeader: {
    backgroundColor: colors.proOrange50,
    borderBottomColor: colors.proOrangeBorder,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  miniChip: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  miniChipPro: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  optionList: {
    gap: spacing.sm,
  },
  pickerBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerClose: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerList: {
    gap: spacing.sm,
  },
  pickerOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerOptionSelected: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrange600,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.sm,
    maxHeight: '68%',
    padding: spacing.md,
  },
  pickerScroll: {
    maxHeight: 360,
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.86,
  },
  progressFill: {
    backgroundColor: colors.proOrange600,
    borderRadius: radius.pill,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    height: 5,
    overflow: 'hidden',
  },
  quickBudgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.navy900,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  reviewTrustCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  reviewTrustText: {
    flex: 1,
    lineHeight: 18,
  },
  selectionCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  selectionCardSelected: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrange600,
  },
  selectField: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectFieldValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  shell: {
    backgroundColor: colors.slate50,
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  stateCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
  },
  stepPill: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepPillActive: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepStack: {
    gap: spacing.md,
  },
  stepperContent: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  stepText: {
    fontWeight: '700',
    lineHeight: 16,
  },
  summaryGrid: {
    gap: spacing.sm,
  },
  summaryRow: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 112,
  },
  twoColumn: {
    gap: spacing.md,
  },
  validationCard: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  validationPill: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
