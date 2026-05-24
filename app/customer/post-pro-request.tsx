import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AssistantGuideCard,
  FormField,
  FormSection,
  ImagePickerPlaceholder,
  ModeBadge,
  SelectOptionCard,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCities, getPostingRules, getProCategories } from '@/src/lib/api/catalog';
import { createCustomerProRequest } from '@/src/lib/api/customer';
import {
  CatalogCategory,
  CityOption,
  ProRequestPostingRules,
} from '@/src/lib/api/domain';
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
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type CatalogState = {
  categories: CatalogCategory[];
  cities: CityOption[];
  rules: ProRequestPostingRules;
};

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

export default function CustomerPostProRequestScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [district, setDistrict] = useState('');
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
    setErrorMessage('Could not load Pro request catalogs. Retry or continue in demo mode.');
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

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
    const parsedBudgetMin = parseNumberInput(budgetMin);
    const parsedBudgetMax = parseNumberInput(budgetMax);
    const addIssue = (key: ValidationFieldKey, label: string, message: string) => {
      issues.push({ key, label, message });
    };

    if (!selectedCategoryId) addIssue('categoryKey', t('proCategory'), t('missingProCategory'));
    if (!selectedCityId) addIssue('cityId', t('city'), t('missingCity'));
    if (!district.trim()) addIssue('district', t('areaOrDistrict'), t('missingDistrictArea'));
    if (!title.trim()) addIssue('title', t('projectTitle'), t('missingTitle'));

    if (!description.trim()) {
      addIssue('description', t('projectDescription'), t('missingDescription'));
    } else if (description.trim().length < minDescriptionLength) {
      addIssue('description', t('projectDescription'), `${t('descriptionTooShort')} ${minDescriptionLength}.`);
    }

    if (!timeline.trim()) addIssue('timeline', t('preferredStartDate'), t('missingTimeline'));

    if (!budgetMin.trim()) {
      addIssue('budgetMinEur', t('budgetRange'), t('missingBudget'));
    } else if (parsedBudgetMin === null || parsedBudgetMin < 0) {
      addIssue('budgetMinEur', t('budgetRange'), t('invalidBudget'));
    }

    if (!budgetMax.trim()) {
      addIssue('budgetMaxEur', t('budgetRange'), t('missingBudget'));
    } else if (parsedBudgetMax === null || parsedBudgetMax < 0) {
      addIssue('budgetMaxEur', t('budgetRange'), t('invalidBudget'));
    }

    if (parsedBudgetMin !== null && parsedBudgetMax !== null && parsedBudgetMax < parsedBudgetMin) {
      addIssue('budgetMaxEur', t('budgetRange'), t('maxBudgetMustBeAtLeastMin'));
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
    catalog?.rules.minDescriptionLength,
    description,
    district,
    selectedCategoryId,
    selectedCityId,
    timeline,
    title,
  ]);

  const isSubmitEnabled = formValidation.issues.length === 0;
  const showStrongValidation = hasSubmittedOnce || Object.keys(fieldErrors).length > 0;
  const visibleFieldErrors = showStrongValidation ? { ...formValidation.errors, ...fieldErrors } : fieldErrors;

  const handleSubmit = useCallback(async () => {
    setHasSubmittedOnce(true);
    setSubmitMessage(null);
    setSubmitError(null);
    setFieldErrors({});

    if (formValidation.issues.length > 0 || !selectedCategoryId || !selectedCityId) {
      setFieldErrors(formValidation.errors);
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
        description: description.trim(),
        district: district.trim(),
        localImageCount: images.length,
        timeline: timeline.trim(),
        title: title.trim(),
      },
      authToken,
    );
    setIsSubmitting(false);

    if (result.ok) {
      setSubmitMessage(t('proRequestCreated'));
      router.push(`/customer/pro-requests/${result.data.proRequest.id}` as Href);
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
    description,
    district,
    formValidation,
    getValidAccessToken,
    images.length,
    router,
    selectedCategoryId,
    selectedCityId,
    status,
    timeline,
    title,
  ]);

  const descriptionLength = description.trim().length;
  const descriptionHelper = catalog
    ? `${descriptionLength}/${catalog.rules.maxDescriptionLength} characters. Backend rules remain final.`
    : 'Backend posting rules will appear here.';
  const getFieldError = (key: ValidationFieldKey) => (showStrongValidation ? visibleFieldErrors[key] : undefined);
  const getFieldHelper = (key: ValidationFieldKey, fallback?: string) =>
    showStrongValidation ? fallback : formValidation.errors[key] ?? fallback;
  const categoryValidationMessage = showStrongValidation
    ? visibleFieldErrors.categoryKey
    : formValidation.errors.categoryKey;
  const cityValidationMessage = showStrongValidation ? visibleFieldErrors.cityId : formValidation.errors.cityId;
  const missingFieldLabels = Array.from(new Set(formValidation.issues.map((issue) => issue.label)));

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <StatusBadge label="Customer Pro" tone="pro" />
        <AppText variant="screenTitle">{t('postProRequest')}</AppText>
        <AppText color={colors.slate700}>
          Pro request creation is connected. Unlocks, payments, messages, and image upload stay separate.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.proOrange600}>
          <StatusBadge label="Loading" tone="pro" />
          <AppText variant="sectionTitle">Loading Pro request setup</AppText>
          <AppText color={colors.slate700}>Fetching cities, Pro categories, and posting rules.</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard accentColor={colors.danger600}>
          <StatusBadge label="Catalog unavailable" tone="danger" />
          <AppText variant="sectionTitle">Pro posting setup could not load</AppText>
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadCatalog} tone="pro" variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      <AssistantGuideCard
        body={
          catalog?.rules.postingIsFreeCopy ||
          'Posting a Pro request is free. After meaningful Pro responses arrive, you can unlock comparison details, portfolios, rough quotes, and messages.'
        }
        title={t('postingProFree')}
        tone="pro"
      />

      <FormSection
        accent="pro"
        description="Choose a larger quote-based Pro category from the backend catalog."
        title={t('category')}>
        {catalog?.categories.map((category) => (
          <SelectOptionCard
            key={category.id}
            description={category.descriptionEn}
            label={category.nameEn}
            onPress={() => {
              setSelectedCategoryId(category.id);
              clearFieldError('categoryKey');
            }}
            selected={selectedCategoryId === category.id}
            tone="pro"
          />
        ))}
        {!catalog?.categories.length ? <AppText color={colors.slate500}>Pro categories will load here.</AppText> : null}
        {categoryValidationMessage ? (
          <AppText color={showStrongValidation ? colors.danger600 : colors.slate500} variant="small">
            {categoryValidationMessage}
          </AppText>
        ) : null}
      </FormSection>

      <FormSection accent="pro" description="City options come from the backend catalog." title={t('city')}>
        {catalog?.cities.map((city) => (
          <SelectOptionCard
            key={city.id}
            label={city.nameEn}
            onPress={() => {
              setSelectedCityId(city.id);
              clearFieldError('cityId');
            }}
            selected={selectedCityId === city.id}
            tone="pro"
          />
        ))}
        {!catalog?.cities.length ? <AppText color={colors.slate500}>Cities will load here.</AppText> : null}
        {cityValidationMessage ? (
          <AppText color={showStrongValidation ? colors.danger600 : colors.slate500} variant="small">
            {cityValidationMessage}
          </AppText>
        ) : null}
      </FormSection>

      <FormSection accent="pro" description={t('formPreviewOnly')} title="Project details">
        <FormField
          errorText={getFieldError('district')}
          helperText={getFieldHelper('district')}
          label={t('areaOrDistrict')}
          onChangeText={(value) => {
            setDistrict(value);
            clearFieldError('district');
          }}
          placeholder="Neighborhood, district, or area"
          value={district}
        />
        <FormField
          errorText={getFieldError('title')}
          helperText={getFieldHelper('title')}
          label={t('projectTitle')}
          onChangeText={(value) => {
            setTitle(value);
            clearFieldError('title');
          }}
          placeholder="Example: Bathroom renovation"
          value={title}
        />
        <FormField
          errorText={getFieldError('description')}
          helperText={getFieldHelper('description', descriptionHelper)}
          label={t('projectDescription')}
          maxLength={catalog?.rules.maxDescriptionLength}
          multiline
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError('description');
          }}
          placeholder="Describe the project scope, current state, rough timeline, and constraints."
          value={description}
        />
        <FormField
          errorText={getFieldError('timeline')}
          helperText={getFieldHelper('timeline')}
          label={t('preferredStartDate')}
          onChangeText={(value) => {
            setTimeline(value);
            clearFieldError('timeline');
          }}
          placeholder="Example: Flexible, this month, or 2026-06-15"
          value={timeline}
        />
        <View style={styles.twoColumn}>
          <FormField
            errorText={getFieldError('budgetMinEur')}
            helperText={getFieldHelper('budgetMinEur')}
            keyboardType="decimal-pad"
            label={t('minBudget')}
            onChangeText={(value) => {
              setBudgetMin(value);
              clearFieldError('budgetMinEur');
              clearFieldError('budgetMaxEur');
            }}
            placeholder="1000"
            value={budgetMin}
          />
          <FormField
            errorText={getFieldError('budgetMaxEur')}
            helperText={getFieldHelper('budgetMaxEur')}
            keyboardType="decimal-pad"
            label={t('maxBudget')}
            onChangeText={(value) => {
              setBudgetMax(value);
              clearFieldError('budgetMinEur');
              clearFieldError('budgetMaxEur');
            }}
            placeholder="2500"
            value={budgetMax}
          />
        </View>
      </FormSection>

      <FormSection accent="pro" description="Image picker and upload are intentionally not connected yet." title={t('photos')}>
        <ImagePickerPlaceholder
          acceptedImageTypes={catalog?.rules.acceptedImageTypes}
          accent="pro"
          errorMessage={imageErrorMessage}
          helperText={t('photosStayLocalCreate')}
          images={images}
          isProcessing={isProcessingImages}
          maxImages={catalog?.rules.maxImages}
          onPickImages={handlePickImages}
          onRemoveImage={handleRemoveImage}
        />
      </FormSection>

      {images.length ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('imageUploadLater')} tone="warning" />
          <AppText color={colors.slate700}>{t('imagesLaterStep')}</AppText>
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

      {!isSubmitEnabled ? (
        <AppCard accentColor={showStrongValidation ? colors.warning600 : colors.proOrange600}>
          <StatusBadge label={t('completeRequiredFields')} tone={showStrongValidation ? 'warning' : 'pro'} />
          <AppText color={colors.slate700}>{t('completeTheseFieldsToSubmit')}</AppText>
          <View style={styles.validationList}>
            {missingFieldLabels.map((label) => (
              <View key={label} style={styles.validationPill}>
                <AppText color={colors.slate700} variant="small">
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          {showStrongValidation ? (
            <AppText color={colors.slate700} variant="small">
              {t('pleaseCheckHighlightedFields')}
            </AppText>
          ) : null}
        </AppCard>
      ) : null}

      <AppButton disabled={!isSubmitEnabled || isSubmitting} loading={isSubmitting} onPress={handleSubmit} tone="pro">
        {isSubmitting ? t('creatingProRequest') : isSubmitEnabled ? t('submitProRequest') : t('completeRequiredFields')}
      </AppButton>
      <AppButton onPress={() => router.back()} tone="neutral" variant="ghost">
        {t('backToTaskly')}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  twoColumn: {
    gap: spacing.md,
  },
  validationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  validationPill: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: spacing.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
