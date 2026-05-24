import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

export default function CustomerPostProRequestScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalSelectedImage[]>([]);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

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

  const descriptionLength = description.trim().length;
  const descriptionHelper = catalog
    ? `${descriptionLength}/${catalog.rules.maxDescriptionLength} characters. Backend rules remain final.`
    : 'Backend posting rules will appear here.';

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <StatusBadge label="Customer Pro" tone="pro" />
        <AppText variant="screenTitle">{t('postProRequest')}</AppText>
        <AppText color={colors.slate700}>
          Preview the Pro request posting flow. Submitting, unlocks, and messages are not connected yet.
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
            onPress={() => setSelectedCategoryId(category.id)}
            selected={selectedCategoryId === category.id}
            tone="pro"
          />
        ))}
        {!catalog?.categories.length ? <AppText color={colors.slate500}>Pro categories will load here.</AppText> : null}
      </FormSection>

      <FormSection accent="pro" description="City options come from the backend catalog." title={t('city')}>
        {catalog?.cities.map((city) => (
          <SelectOptionCard
            key={city.id}
            label={city.nameEn}
            onPress={() => setSelectedCityId(city.id)}
            selected={selectedCityId === city.id}
            tone="pro"
          />
        ))}
        {!catalog?.cities.length ? <AppText color={colors.slate500}>Cities will load here.</AppText> : null}
      </FormSection>

      <FormSection accent="pro" description={t('formPreviewOnly')} title="Project details">
        <FormField label={t('districtArea')} placeholder="Neighborhood, district, or area" />
        <FormField label={t('title')} onChangeText={setTitle} placeholder="Example: Bathroom renovation" value={title} />
        <FormField
          helperText={descriptionHelper}
          label={t('description')}
          maxLength={catalog?.rules.maxDescriptionLength}
          multiline
          onChangeText={setDescription}
          placeholder="Describe the project scope, current state, rough timeline, and constraints."
          value={description}
        />
        <FormField label="Preferred timeline" placeholder="Flexible, this month, specific period" />
        <FormField label={t('budgetRange')} placeholder="Example: EUR 1,000 - 2,500" />
      </FormSection>

      <FormSection accent="pro" description="Image picker and upload are intentionally not connected yet." title={t('photos')}>
        <ImagePickerPlaceholder
          acceptedImageTypes={catalog?.rules.acceptedImageTypes}
          accent="pro"
          errorMessage={imageErrorMessage}
          helperText={t('photosStayLocal')}
          images={images}
          isProcessing={isProcessingImages}
          maxImages={catalog?.rules.maxImages}
          onPickImages={handlePickImages}
          onRemoveImage={handleRemoveImage}
        />
      </FormSection>

      <AppButton disabled tone="pro">
        {t('submitConnectedLater')}
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
});
