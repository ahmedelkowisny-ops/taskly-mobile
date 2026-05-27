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
import { createCustomerTask } from '@/src/lib/api/customer';
import { getCities, getCoreCategories, getPostingRules } from '@/src/lib/api/catalog';
import {
  CatalogCategory,
  CityOption,
  CoreTaskPostingRules,
} from '@/src/lib/api/domain';
import {
  getMockCitiesCatalogResponse,
  getMockCoreCategoriesResponse,
  getMockPostingRulesResponse,
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
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type CatalogState = {
  categories: CatalogCategory[];
  cities: CityOption[];
  rules: CoreTaskPostingRules;
};

const CORE_TASK_UPLOAD_MAX_IMAGES = 5;

type ValidationFieldKey =
  | 'address'
  | 'budgetEur'
  | 'categorySlug'
  | 'cityId'
  | 'description'
  | 'estimatedTime'
  | 'location'
  | 'scheduledEndAt'
  | 'scheduledStartAt'
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

function parseDateInput(value: string) {
  if (!value.trim()) return null;

  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidLatitude(value: number | null) {
  return value !== null && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null) {
  return value !== null && value >= -180 && value <= 180;
}

function normalizeApiFieldErrors(fieldErrors: Record<string, string>) {
  const keyMap: Record<string, ValidationFieldKey> = {
    budget: 'budgetEur',
    budgetEur: 'budgetEur',
    category: 'categorySlug',
    categorySlug: 'categorySlug',
    cityId: 'cityId',
    description: 'description',
    detailsText: 'description',
    estimatedTime: 'estimatedTime',
    location: 'location',
    preferredTimeWindow: 'scheduledEndAt',
    scheduledEndAt: 'scheduledEndAt',
    scheduledStartAt: 'scheduledStartAt',
    title: 'title',
  };

  return Object.entries(fieldErrors).reduce<Record<string, string>>((normalized, [key, message]) => {
    normalized[keyMap[key] ?? key] = message;
    return normalized;
  }, {});
}

function getSafeApiMessage(message: string) {
  if (!message || message.includes('\n') || message.includes(' at ')) {
    return t('couldNotCreateTask');
  }

  return message;
}

function formatUploadProgress(current: number, total: number) {
  return t('uploadingPhotosProgress')
    .replace('{current}', String(current))
    .replace('{total}', String(total));
}

export default function CustomerPostTaskScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [budget, setBudget] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
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
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const loadCatalog = useCallback(async () => {
    setErrorMessage(null);

    if (status === 'demo') {
      const rules = getMockPostingRulesResponse();
      setCatalog({
        categories: getMockCoreCategoriesResponse().categories,
        cities: getMockCitiesCatalogResponse().cities,
        rules: rules.coreTask,
      });
      return;
    }

    setIsLoading(true);
    const authToken = status === 'authenticated' ? await getValidAccessToken() : null;
    const [citiesResult, categoriesResult, rulesResult] = await Promise.all([
      getCities(authToken),
      getCoreCategories(authToken),
      getPostingRules(authToken),
    ]);

    if (citiesResult.ok && categoriesResult.ok && rulesResult.ok) {
      setCatalog({
        categories: categoriesResult.data.categories,
        cities: citiesResult.data.cities,
        rules: rulesResult.data.coreTask,
      });
      setIsLoading(false);
      return;
    }

    setCatalog(null);
    setErrorMessage('Could not load posting catalogs. Retry or continue in demo mode.');
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

  const handlePickImages = useCallback(async () => {
    const rules = catalog?.rules ?? getMockPostingRulesResponse().coreTask;
    const maxImages = Math.min(rules.maxImages, CORE_TASK_UPLOAD_MAX_IMAGES);
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
        maxImages,
      });

      if (!pickedImages.length) {
        return;
      }

      const validation = validateSelectedImages(pickedImages, {
        acceptedImageTypes: rules.acceptedImageTypes,
        maxImages: Math.max(0, maxImages - images.length),
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
    const minDescriptionLength = catalog?.rules.minDescriptionLength ?? 20;
    const parsedBudget = parseNumberInput(budget);
    const parsedLatitude = parseNumberInput(latitude);
    const parsedLongitude = parseNumberInput(longitude);
    const parsedStartAt = parseDateInput(scheduledStartAt);
    const parsedEndAt = parseDateInput(scheduledEndAt);
    const addIssue = (key: ValidationFieldKey, label: string, message: string) => {
      issues.push({ key, label, message });
    };

    if (!selectedCategoryId) addIssue('categorySlug', t('category'), t('missingCategory'));
    if (!selectedCityId) addIssue('cityId', t('city'), t('missingCity'));
    if (!title.trim()) addIssue('title', t('title'), t('missingTitle'));

    if (!description.trim()) {
      addIssue('description', t('description'), t('missingDescription'));
    } else if (description.trim().length < minDescriptionLength) {
      addIssue('description', t('description'), `${t('descriptionTooShort')} ${minDescriptionLength}.`);
    }

    if (!address.trim()) addIssue('address', t('address'), t('missingAddress'));
    if (!scheduledStartAt.trim()) addIssue('scheduledStartAt', t('scheduleStart'), t('missingScheduleStart'));
    if (!scheduledEndAt.trim()) addIssue('scheduledEndAt', t('scheduleEnd'), t('missingScheduleEnd'));

    if (scheduledStartAt.trim() && !parsedStartAt) {
      addIssue('scheduledStartAt', t('scheduleStart'), t('invalidSchedule'));
    }

    if (scheduledEndAt.trim() && !parsedEndAt) {
      addIssue('scheduledEndAt', t('scheduleEnd'), t('invalidSchedule'));
    }

    if (parsedStartAt && parsedEndAt && parsedEndAt <= parsedStartAt) {
      addIssue('scheduledEndAt', t('scheduleEnd'), t('endTimeAfterStart'));
    }

    if (!estimatedTime.trim()) addIssue('estimatedTime', t('estimatedTime'), t('missingEstimatedTime'));

    if (!budget.trim()) {
      addIssue('budgetEur', t('budget'), t('missingBudget'));
    } else if (parsedBudget === null || parsedBudget <= 0) {
      addIssue('budgetEur', t('budget'), t('invalidBudget'));
    }

    if (!latitude.trim() || !longitude.trim()) {
      addIssue('location', t('location'), t('missingLocation'));
    } else if (!isValidLatitude(parsedLatitude) || !isValidLongitude(parsedLongitude)) {
      addIssue('location', t('location'), t('invalidLocation'));
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
      parsedBudget,
      parsedLatitude,
      parsedLongitude,
    };
  }, [
    address,
    budget,
    catalog?.rules.minDescriptionLength,
    description,
    estimatedTime,
    latitude,
    longitude,
    scheduledEndAt,
    scheduledStartAt,
    selectedCategoryId,
    selectedCityId,
    title,
  ]);

  const isSubmitEnabled = formValidation.issues.length === 0;
  const showStrongValidation = hasSubmittedOnce || Object.keys(fieldErrors).length > 0;
  const visibleFieldErrors = showStrongValidation ? { ...formValidation.errors, ...fieldErrors } : fieldErrors;

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
      setSubmitError(t('pleaseCheckHighlightedFields'));
      return;
    }

    if (status === 'demo') {
      setSubmitMessage(t('demoDoesNotCreateTasks'));
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
    const result = await createCustomerTask(
      {
        address: address.trim(),
        budgetEur: formValidation.parsedBudget!,
        categorySlug: selectedCategoryId,
        cityId: selectedCityId,
        description: description.trim(),
        estimatedTime: estimatedTime.trim(),
        localImageCount: images.length,
        location: {
          lat: formValidation.parsedLatitude!,
          lng: formValidation.parsedLongitude!,
        },
        scheduledEndAt: scheduledEndAt.trim(),
        scheduledStartAt: scheduledStartAt.trim(),
        title: title.trim(),
      },
      authToken,
    );
    setIsSubmitting(false);

    if (result.ok) {
      const taskId = result.data.task.id;

      if (images.length > 0) {
        setSubmitMessage(t('taskCreatedUploadingPhotos'));
        setIsUploadingImages(true);

        const uploadSummary = await uploadSelectedImagesSequentially({
          authToken,
          entityId: taskId,
          entityType: 'task',
          images,
          onProgress: ({ current, total }) => {
            setUploadProgressCurrent(current);
            setUploadProgressTotal(total);
            setSubmitMessage(formatUploadProgress(current, total));
          },
        });

        setIsUploadingImages(false);

        if (uploadSummary.failed > 0) {
          setUploadWarning(t('taskCreatedSomePhotosFailed'));
          setSubmitMessage(t('taskCreated'));
          setTimeout(() => {
            router.push(`/customer/tasks/${taskId}` as Href);
          }, 1200);
          return;
        }

        if (uploadSummary.skipped > 0) {
          setUploadWarning(t('somePhotosSkipped'));
          setTimeout(() => {
            router.push(`/customer/tasks/${taskId}` as Href);
          }, 1200);
          return;
        }

        if (uploadSummary.uploaded > 0) {
          setSubmitMessage(t('photosUploaded'));
        } else {
          setSubmitMessage(t('taskCreated'));
        }

        router.push(`/customer/tasks/${taskId}` as Href);
        return;
      }

      setSubmitMessage(t('taskCreated'));
      router.push(`/customer/tasks/${taskId}` as Href);
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
    address,
    description,
    estimatedTime,
    formValidation,
    getValidAccessToken,
    images,
    router,
    scheduledEndAt,
    scheduledStartAt,
    selectedCategoryId,
    selectedCityId,
    status,
    title,
  ]);

  const descriptionLength = description.trim().length;
  const descriptionHelper = catalog
    ? `${descriptionLength}/${catalog.rules.maxDescriptionLength} characters. Taskly rules apply at submit.`
    : 'Taskly posting rules will appear here.';
  const getFieldError = (key: ValidationFieldKey) => (showStrongValidation ? visibleFieldErrors[key] : undefined);
  const getFieldHelper = (key: ValidationFieldKey, fallback?: string) =>
    showStrongValidation ? fallback : formValidation.errors[key] ?? fallback;
  const categoryValidationMessage = getFieldHelper('categorySlug') ?? getFieldError('categorySlug');
  const cityValidationMessage = getFieldHelper('cityId') ?? getFieldError('cityId');
  const missingFieldLabels = formValidation.issues.map((issue) => issue.label);

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('postTask')}</AppText>
        <AppText color={colors.slate700}>
          Taskly task creation is connected. Payments and image upload stay separate.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading posting setup</AppText>
          <AppText color={colors.slate700}>Loading cities, Taskly categories, and posting rules.</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard accentColor={colors.danger600}>
          <StatusBadge label="Catalog unavailable" tone="danger" />
          <AppText variant="sectionTitle">Posting setup could not load</AppText>
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadCatalog} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      <AssistantGuideCard
        body={catalog?.rules.paymentProtectionCopy || 'Taskly will explain payment protection before payment-sensitive actions.'}
        title={t('paymentProtected')}
      />

      <FormSection
        description="Choose a small fixed-scope Taskly category."
        title={t('category')}>
        {catalog?.categories.map((category) => (
          <SelectOptionCard
            key={category.id}
            description={category.descriptionEn}
            label={category.nameEn}
            onPress={() => {
              setSelectedCategoryId(category.id);
              clearFieldError('categorySlug');
            }}
            selected={selectedCategoryId === category.id}
          />
        ))}
        {!catalog?.categories.length ? <AppText color={colors.slate500}>Taskly categories will load here.</AppText> : null}
        {categoryValidationMessage ? (
          <AppText color={showStrongValidation ? colors.danger600 : colors.slate500} variant="small">
            {categoryValidationMessage}
          </AppText>
        ) : null}
      </FormSection>

      <FormSection description="Choose the city where you need help." title={t('city')}>
        {catalog?.cities.map((city) => (
          <SelectOptionCard
            key={city.id}
            label={city.nameEn}
            onPress={() => {
              setSelectedCityId(city.id);
              clearFieldError('cityId');
            }}
            selected={selectedCityId === city.id}
          />
        ))}
        {!catalog?.cities.length ? <AppText color={colors.slate500}>Cities will load here.</AppText> : null}
        {cityValidationMessage ? (
          <AppText color={showStrongValidation ? colors.danger600 : colors.slate500} variant="small">
            {cityValidationMessage}
          </AppText>
        ) : null}
      </FormSection>

      <FormSection description={t('formPreviewOnly')} title="Task details">
        <FormField
          errorText={getFieldError('address')}
          helperText={getFieldHelper('address')}
          label={t('address')}
          onChangeText={(value) => {
            setAddress(value);
            clearFieldError('address');
          }}
          placeholder="Street, building, access notes"
          value={address}
        />
        <FormField
          errorText={getFieldError('title')}
          helperText={getFieldHelper('title')}
          label={t('title')}
          onChangeText={(value) => {
            setTitle(value);
            clearFieldError('title');
          }}
          placeholder="Example: Assemble wardrobe"
          value={title}
        />
        <FormField
          errorText={getFieldError('description')}
          helperText={getFieldHelper('description', descriptionHelper)}
          label={t('description')}
          maxLength={catalog?.rules.maxDescriptionLength}
          multiline
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError('description');
          }}
          placeholder="Describe the task, item count, access, and anything the Tasker should know."
          value={description}
        />
        <View style={styles.twoColumn}>
          <FormField
            errorText={getFieldError('scheduledStartAt')}
            helperText={getFieldHelper('scheduledStartAt', t('scheduleFormatHelper'))}
            label={t('scheduleStart')}
            onChangeText={(value) => {
              setScheduledStartAt(value);
              clearFieldError('scheduledStartAt');
              clearFieldError('scheduledEndAt');
            }}
            placeholder="2026-06-01T10:00:00.000Z"
            value={scheduledStartAt}
          />
          <FormField
            errorText={getFieldError('scheduledEndAt')}
            helperText={getFieldHelper('scheduledEndAt', t('scheduleFormatHelper'))}
            label={t('scheduleEnd')}
            onChangeText={(value) => {
              setScheduledEndAt(value);
              clearFieldError('scheduledStartAt');
              clearFieldError('scheduledEndAt');
            }}
            placeholder="2026-06-01T12:00:00.000Z"
            value={scheduledEndAt}
          />
        </View>
        <FormField
          errorText={getFieldError('estimatedTime')}
          helperText={getFieldHelper('estimatedTime')}
          label={t('estimatedTime')}
          onChangeText={(value) => {
            setEstimatedTime(value);
            clearFieldError('estimatedTime');
          }}
          placeholder="Example: 2 hours"
          value={estimatedTime}
        />
        <FormField
          errorText={getFieldError('budgetEur')}
          helperText={getFieldHelper('budgetEur')}
          keyboardType="decimal-pad"
          label={t('budget')}
          onChangeText={(value) => {
            setBudget(value);
            clearFieldError('budgetEur');
          }}
          placeholder="Example: 40"
          value={budget}
        />
        <View style={styles.twoColumn}>
          <FormField
            errorText={getFieldError('location')}
            helperText={getFieldHelper('location', t('locationCoordinateHelper'))}
            keyboardType="decimal-pad"
            label={t('latitude')}
            onChangeText={(value) => {
              setLatitude(value);
              clearFieldError('location');
            }}
            placeholder="42.6977"
            value={latitude}
          />
          <FormField
            keyboardType="decimal-pad"
            label={t('longitude')}
            onChangeText={(value) => {
              setLongitude(value);
              clearFieldError('location');
            }}
            placeholder="23.3219"
            value={longitude}
          />
        </View>
      </FormSection>

      <FormSection description={t('photosUploadAfterCreation')} title={t('photos')}>
        <ImagePickerPlaceholder
          acceptedImageTypes={catalog?.rules.acceptedImageTypes}
          errorMessage={imageErrorMessage}
          helperText={t('photosUploadAfterCreation')}
          images={images}
          isProcessing={isProcessingImages}
          maxImages={catalog?.rules.maxImages ? Math.min(catalog.rules.maxImages, CORE_TASK_UPLOAD_MAX_IMAGES) : undefined}
          onPickImages={handlePickImages}
          onRemoveImage={handleRemoveImage}
        />
      </FormSection>

      {images.length ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={t('photos')} tone="warning" />
          <AppText color={colors.slate700}>{t('photosUploadAfterCreation')}</AppText>
        </AppCard>
      ) : null}

      {isUploadingImages ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('uploadingPhotos')} tone="core" />
          <AppText color={colors.slate700}>
            {uploadProgressTotal > 0
              ? formatUploadProgress(uploadProgressCurrent, uploadProgressTotal)
              : t('taskCreatedUploadingPhotos')}
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
          <StatusBadge label={t('taskCreated')} tone="success" />
          <AppText color={colors.slate700}>{submitMessage}</AppText>
        </AppCard>
      ) : null}

      {submitError ? (
        <AppCard accentColor={colors.danger600}>
          <StatusBadge label={t('couldNotCreateTask')} tone="danger" />
          <AppText color={colors.slate700}>{submitError}</AppText>
        </AppCard>
      ) : null}

      {!isSubmitEnabled ? (
        <AppCard accentColor={showStrongValidation ? colors.warning600 : colors.tasklyBlue600}>
          <StatusBadge label={t('completeRequiredFields')} tone={showStrongValidation ? 'warning' : 'core'} />
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

      <AppButton
        disabled={!isSubmitEnabled || isSubmitting || isUploadingImages}
        loading={isSubmitting || isUploadingImages}
        onPress={handleSubmit}>
        {isUploadingImages
          ? t('uploadingPhotos')
          : isSubmitting
            ? t('creatingTask')
            : isSubmitEnabled
              ? t('submitTask')
              : t('completeRequiredFields')}
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
