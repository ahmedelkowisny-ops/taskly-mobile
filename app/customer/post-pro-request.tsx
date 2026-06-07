import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import AddressPickerModal from '@/components/AddressPickerModal';
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
import { designTokens } from '@/src/theme/designTokens';
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
const DEFAULT_PRO_LOCATION = { lat: 42.6977, lng: 23.3219 };
const DEFAULT_PRO_ADDRESS = 'Sofia, Bulgaria';
const TIME_SLOT_START_MINUTES = 6 * 60;
const TIME_SLOT_END_MINUTES = 24 * 60;
const TIME_SLOT_STEP_MINUTES = 15;
const MIN_DURATION_MINUTES = 60;
const FOOTER_SCROLL_THRESHOLD = 16;
const FOOTER_BOTTOM_PROXIMITY = 96;
type TimePickerTarget = 'start' | 'end' | null;

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

const PRO_CATEGORY_TAGS: Record<string, { bg: string; en: string; key: string }[]> = {
  full_home_renovation: [
    { key: 'electrical_work', en: 'Electrical work', bg: 'Ел. инсталации' },
    { key: 'plumbing_work', en: 'Plumbing work', bg: 'ВиК' },
    { key: 'painting', en: 'Painting', bg: 'Боядисване' },
    { key: 'drywall', en: 'Drywall', bg: 'Гипсокартон' },
    { key: 'flooring', en: 'Flooring', bg: 'Подови настилки' },
    { key: 'windows_doors', en: 'Windows/doors', bg: 'Дограма/врати' },
    { key: 'bathroom', en: 'Bathroom', bg: 'Баня' },
    { key: 'kitchen', en: 'Kitchen', bg: 'Кухня' },
  ],
  bathroom_renovation: [
    { key: 'full_bathroom_build', en: 'Full bathroom build', bg: 'Цялостно изграждане' },
    { key: 'demolition', en: 'Demolition', bg: 'Къртене' },
    { key: 'waterproofing', en: 'Waterproofing', bg: 'Хидроизолация' },
    { key: 'plumbing_changes', en: 'Plumbing changes', bg: 'ВиК промени' },
    { key: 'tiling', en: 'Tiling', bg: 'Плочки' },
    { key: 'sanitary_install', en: 'Sanitary installation', bg: 'Монтаж на санитария' },
    { key: 'lighting', en: 'Lighting', bg: 'Осветление' },
  ],
  kitchen_projects: [
    { key: 'kitchen_renovation', en: 'Kitchen renovation', bg: 'Ремонт на кухня' },
    { key: 'custom_kitchen', en: 'Custom kitchen', bg: 'Кухня по поръчка' },
    { key: 'countertop', en: 'Countertop', bg: 'Плот' },
    { key: 'appliance_integration', en: 'Appliance integration', bg: 'Монтаж на уреди' },
    { key: 'plumbing_connection', en: 'Plumbing connection', bg: 'ВиК връзки' },
    { key: 'lighting', en: 'Lighting', bg: 'Осветление' },
  ],
  tiling_cladding: [
    { key: 'floor_tiles', en: 'Floor tiles', bg: 'Подови плочки' },
    { key: 'wall_tiles', en: 'Wall tiles', bg: 'Стенни плочки' },
    { key: 'bathroom_tiles', en: 'Bathroom tiles', bg: 'Плочки за баня' },
    { key: 'backsplash', en: 'Kitchen backsplash', bg: 'Кухненски гръб' },
    { key: 'outdoor_tiles', en: 'Outdoor tiles', bg: 'Външни плочки' },
  ],
  painting_surface_prep: [
    { key: 'painting', en: 'Painting', bg: 'Боядисване' },
    { key: 'skim_coating', en: 'Skim coating / шпакловка', bg: 'Шпакловка' },
    { key: 'primer', en: 'Primer', bg: 'Грундиране' },
    { key: 'decorative_plaster', en: 'Decorative plaster', bg: 'Декоративни мазилки' },
    { key: 'finishing', en: 'Finishing works', bg: 'Довършителни работи' },
  ],
  drywall_ceilings: [
    { key: 'drywall_walls', en: 'Drywall walls', bg: 'Гипсокартон' },
    { key: 'suspended_ceiling', en: 'Suspended ceiling', bg: 'Окачен таван' },
    { key: 'partition_walls', en: 'Partition walls', bg: 'Преградни стени' },
    { key: 'niches', en: 'Niches', bg: 'Ниши' },
    { key: 'hidden_lighting', en: 'Hidden lighting', bg: 'Скрито осветление' },
  ],
  plumbing_drainage: [
    { key: 'new_plumbing', en: 'New plumbing', bg: 'Нова ВиК инсталация' },
    { key: 'bathroom_plumbing', en: 'Bathroom plumbing', bg: 'ВиК за баня' },
    { key: 'kitchen_plumbing', en: 'Kitchen plumbing', bg: 'ВиК за кухня' },
    { key: 'drainage', en: 'Drainage', bg: 'Канализация' },
    { key: 'pipe_replacement', en: 'Pipe replacement', bg: 'Смяна на тръби' },
  ],
  electrical_installations: [
    { key: 'new_wiring', en: 'New wiring', bg: 'Нова ел. инсталация' },
    { key: 'electrical_panel', en: 'Electrical panel', bg: 'Ел. табло' },
    { key: 'sockets_switches', en: 'Sockets and switches', bg: 'Контакти и ключове' },
    { key: 'lighting', en: 'Lighting', bg: 'Осветление' },
    { key: 'measurements_checks', en: 'Measurements/checks', bg: 'Измервания/проверка' },
  ],
  roofing_waterproofing: [
    { key: 'roof_repair', en: 'Roof repair', bg: 'Ремонт на покрив' },
    { key: 'roof_replacement', en: 'Full roof replacement', bg: 'Нов покрив' },
    { key: 'flat_roof', en: 'Flat roof', bg: 'Плосък покрив' },
    { key: 'gutters', en: 'Gutters', bg: 'Улуци' },
    { key: 'waterproofing', en: 'Waterproofing', bg: 'Хидроизолация' },
  ],
  hvac_air_conditioning: [
    { key: 'ac_install', en: 'AC installation', bg: 'Монтаж на климатик' },
    { key: 'ac_relocation', en: 'AC relocation', bg: 'Преместване на климатик' },
    { key: 'multi_split', en: 'Multi-split', bg: 'Мултисплит' },
    { key: 'ac_service', en: 'Service/repair', bg: 'Сервиз/ремонт' },
    { key: 'ventilation', en: 'Ventilation', bg: 'Вентилация' },
  ],
  windows_doors: [
    { key: 'pvc_windows', en: 'PVC windows', bg: 'PVC дограма' },
    { key: 'aluminum_windows', en: 'Aluminum windows', bg: 'Алуминиева дограма' },
    { key: 'interior_doors', en: 'Interior doors', bg: 'Интериорни врати' },
    { key: 'exterior_doors', en: 'Exterior doors', bg: 'Входни врати' },
    { key: 'opening_finishing', en: 'Finishing around openings', bg: 'Обръщане около дограма' },
  ],
};

function parseNumberInput(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateToIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayIsoDate() {
  return dateToIsoDate(new Date());
}

function parseIsoDate(value: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!parts) return null;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function getDateRelationToToday(value: string): 'invalid' | 'past' | 'today' | 'future' {
  const date = parseIsoDate(value);
  if (!date) return 'invalid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) return 'past';
  if (date.getTime() === today.getTime()) return 'today';
  return 'future';
}

function parseTimeToMinutes(value: string) {
  const parts = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!parts) return null;

  const hour = Number(parts[1]);
  const minute = Number(parts[2]);
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  if (hour === 0 && minute === 0) return 24 * 60;
  return hour * 60 + minute;
}

function minutesToTimeString(totalMinutes: number) {
  if (totalMinutes === 24 * 60) return '00:00';
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildTimeOptions() {
  const options: string[] = [];
  for (let minute = TIME_SLOT_START_MINUTES; minute <= TIME_SLOT_END_MINUTES; minute += TIME_SLOT_STEP_MINUTES) {
    options.push(minutesToTimeString(minute));
  }

  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function getDefaultTimesForDate(dateIso: string) {
  const relation = getDateRelationToToday(dateIso);
  if (relation === 'invalid' || relation === 'past') return { startTime: '', endTime: '' };

  const startTime = '09:00';
  const endTime = '12:00';
  return { startTime, endTime };
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
  onFocus,
  onChangeText,
  placeholder,
  value,
}: {
  errorText?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  multiline?: boolean;
  onFocus?: () => void;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        onFocus={onFocus}
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
  if (!value || value === '-' || value === t('notSelectedYet')) return null;
  return (
    <View style={styles.summaryRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.navy900} variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function usePostingFooterVisibility() {
  const [visible, setVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const visibleRef = useRef(true);
  const keyboardVisibleRef = useRef(false);
  const lastOffsetRef = useRef(0);
  const animation = useRef(new Animated.Value(1)).current;

  const setFooterVisible = useCallback(
    (nextVisible: boolean) => {
      if (nextVisible && keyboardVisibleRef.current) return;
      if (visibleRef.current === nextVisible) return;

      visibleRef.current = nextVisible;
      setVisible(nextVisible);
      animation.stopAnimation();
      Animated.timing(animation, {
        duration: nextVisible ? 190 : 220,
        toValue: nextVisible ? 1 : 0,
        useNativeDriver: true,
      }).start();
    },
    [animation],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      keyboardVisibleRef.current = true;
      setKeyboardVisible(true);
      visibleRef.current = false;
      setVisible(false);
      animation.stopAnimation();
      animation.setValue(0);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardVisibleRef.current = false;
      setKeyboardVisible(false);
      setFooterVisible(true);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [animation, setFooterVisible]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentOffset = Math.max(contentOffset.y, 0);

      if (keyboardVisibleRef.current || Keyboard.isVisible()) {
        keyboardVisibleRef.current = true;
        lastOffsetRef.current = currentOffset;
        setFooterVisible(false);
        return;
      }

      const distanceFromBottom = contentSize.height - (currentOffset + layoutMeasurement.height);

      if (currentOffset <= 12 || distanceFromBottom <= FOOTER_BOTTOM_PROXIMITY) {
        lastOffsetRef.current = currentOffset;
        setFooterVisible(true);
        return;
      }

      const delta = currentOffset - lastOffsetRef.current;
      if (Math.abs(delta) < FOOTER_SCROLL_THRESHOLD) return;

      setFooterVisible(delta < 0);
      lastOffsetRef.current = currentOffset;
    },
    [setFooterVisible],
  );
  const hideFooterForTyping = useCallback(() => {
    keyboardVisibleRef.current = true;
    setKeyboardVisible(true);
    visibleRef.current = false;
    setVisible(false);
    animation.stopAnimation();
    animation.setValue(0);
  }, [animation]);
  const showFooter = useCallback(() => setFooterVisible(true), [setFooterVisible]);

  return {
    footerAnimatedStyle: {
      opacity: animation,
      transform: [
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [120, 0],
          }),
        },
      ],
    },
    footerPointerEvents: visible ? ('auto' as const) : ('none' as const),
    handleFooterScroll: handleScroll,
    hideFooterForTyping,
    keyboardVisible,
    showFooter,
  };
}

export default function CustomerPostProRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const handleCustomerScroll = useCustomerCreateBarScrollHandler();
  const {
    footerAnimatedStyle,
    footerPointerEvents,
    handleFooterScroll,
    hideFooterForTyping,
    keyboardVisible,
    showFooter,
  } = usePostingFooterVisibility();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [district, setDistrict] = useState('');
  const [addressNotes, setAddressNotes] = useState(DEFAULT_PRO_ADDRESS);
  const [locationNotes, setLocationNotes] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [projectSize, setProjectSize] = useState('');
  const [specialtyNotes, setSpecialtyNotes] = useState('');
  const [siteVisitNeeded, setSiteVisitNeeded] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [selectedLatitude, setSelectedLatitude] = useState(DEFAULT_PRO_LOCATION.lat);
  const [selectedLongitude, setSelectedLongitude] = useState(DEFAULT_PRO_LOCATION.lng);
  const [isAddressPickerVisible, setIsAddressPickerVisible] = useState(false);
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
  const [step1TagsBlocked, setStep1TagsBlocked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    showFooter();
  }, [currentStep, showFooter]);

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
  const selectedCategoryTags = useMemo(
    () => (selectedCategoryId ? PRO_CATEGORY_TAGS[selectedCategoryId] ?? [] : []),
    [selectedCategoryId],
  );
  const selectedTagLabels = useMemo(
    () =>
      selectedCategoryTags
        .filter((tag) => selectedTagKeys.includes(tag.key))
        .map((tag) => tag.en),
    [selectedCategoryTags, selectedTagKeys],
  );
  const selectedDateValue = useMemo(() => parseIsoDate(preferredDate) ?? new Date(), [preferredDate]);
  const timeline = useMemo(() => {
    if (!preferredDate || !startTime || !endTime) return '';
    return `Preferred start time: ${preferredDate}, ${startTime} - ${endTime}`;
  }, [endTime, preferredDate, startTime]);
  const protectedLocationDetails = useMemo(() => {
    const parts = [
      `Map pin: ${selectedLatitude.toFixed(6)},${selectedLongitude.toFixed(6)}`,
      locationNotes.trim() ? `Notes: ${locationNotes.trim()}` : null,
    ].filter(Boolean);

    return parts.join(' | ');
  }, [locationNotes, selectedLatitude, selectedLongitude]);
  const formattedPreferredDate = useMemo(() => {
    if (!preferredDate) return '';
    return selectedDateValue.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [locale, preferredDate, selectedDateValue]);
  const selectedDateRelation = useMemo(() => getDateRelationToToday(preferredDate), [preferredDate]);
  const availableStartTimes = useMemo(() => {
    if (!preferredDate || selectedDateRelation === 'invalid' || selectedDateRelation === 'past') return [];
    return TIME_OPTIONS.filter((option) => {
      const minutes = parseTimeToMinutes(option);
      return minutes !== null && minutes >= TIME_SLOT_START_MINUTES && minutes <= TIME_SLOT_END_MINUTES - MIN_DURATION_MINUTES;
    });
  }, [preferredDate, selectedDateRelation]);
  const availableEndTimes = useMemo(() => {
    const startMinutes = parseTimeToMinutes(startTime);
    if (startMinutes === null) return [];

    return TIME_OPTIONS.filter((option) => {
      const minutes = parseTimeToMinutes(option);
      return minutes !== null && minutes >= startMinutes + MIN_DURATION_MINUTES && minutes <= TIME_SLOT_END_MINUTES;
    });
  }, [startTime]);
  const combinedDescription = useMemo(() => {
    const extras = [
      propertyType ? `${t('propertyType')}: ${propertyType}` : null,
      projectSize ? `${t('projectSize')}: ${projectSize}` : null,
      selectedTagLabels.length ? `${t('includedSpecialties')}: ${selectedTagLabels.join(', ')}` : null,
      specialtyNotes ? `${t('specialtyDetails')}: ${specialtyNotes}` : null,
      siteVisitNeeded ? `Site visit needed: ${SITE_VISIT_EN_LABELS[siteVisitNeeded] ?? siteVisitNeeded}` : null,
    ].filter(Boolean);

    return [description.trim(), ...extras].filter(Boolean).join('\n\n');
  }, [description, projectSize, propertyType, selectedTagLabels, siteVisitNeeded, specialtyNotes]);

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

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const dateRelation = getDateRelationToToday(preferredDate);

    if (!preferredDate.trim()) {
      addIssue('timeline', t('preferredStartDate'), t('scheduleDateRequired'), 4);
    } else if (dateRelation === 'invalid') {
      addIssue('timeline', t('preferredStartDate'), t('invalidDate'), 4);
    } else if (dateRelation === 'past') {
      addIssue('timeline', t('preferredStartDate'), t('scheduleDatePast'), 4);
    }

    if (!startTime.trim()) {
      addIssue('timeline', t('startTime'), t('startTimeRequired'), 4);
    } else if (startMinutes === null) {
      addIssue('timeline', t('startTime'), t('invalidTime'), 4);
    }

    if (!endTime.trim()) {
      addIssue('timeline', t('endTime'), t('endTimeRequired'), 4);
    } else if (endMinutes === null) {
      addIssue('timeline', t('endTime'), t('invalidTime'), 4);
    } else if (startMinutes !== null && endMinutes <= startMinutes) {
      addIssue('timeline', t('endTime'), t('endTimeAfterStart'), 4);
    }

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
    endTime,
    preferredDate,
    selectedCategoryId,
    selectedCityId,
    startTime,
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

  const handleContinueStep1 = useCallback(() => {
    if (currentStep === 1 && selectedCategoryTags.length > 0 && selectedTagKeys.length === 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
      setStep1TagsBlocked(true);
      return;
    }
    handleContinue();
  }, [currentStep, handleContinue, selectedCategoryTags.length, selectedTagKeys.length]);

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      router.back();
      return;
    }

    setCurrentStep((step) => (step - 1) as WizardStep);
  }, [currentStep, router]);

  const handleScheduleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !selectedDate) return;

      const nextDate = dateToIsoDate(selectedDate);
      const defaults = getDefaultTimesForDate(nextDate);
      setPreferredDate(nextDate);
      setStartTime(defaults.startTime);
      setEndTime(defaults.endTime);
      clearFieldError('timeline');
    },
    [clearFieldError],
  );

  const handleStartTimeSelect = useCallback(
    (nextStartTime: string) => {
      const startMinutes = parseTimeToMinutes(nextStartTime);
      const currentEndMinutes = parseTimeToMinutes(endTime);
      const nextEndTime =
        startMinutes !== null && currentEndMinutes !== null && currentEndMinutes > startMinutes
          ? endTime
          : '';

      setStartTime(nextStartTime);
      setEndTime(nextEndTime);
      setTimePickerTarget(null);
      clearFieldError('timeline');
    },
    [clearFieldError, endTime],
  );

  const handleEndTimeSelect = useCallback(
    (nextEndTime: string) => {
      setEndTime(nextEndTime);
      setTimePickerTarget(null);
      clearFieldError('timeline');
    },
    [clearFieldError],
  );

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
        ...(protectedLocationDetails.trim() && { internalLocationDetails: protectedLocationDetails.trim() }),
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
    protectedLocationDetails,
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
                      setSelectedTagKeys([]);
                      setStep1TagsBlocked(false);
                      clearFieldError('categoryKey');
                    }}
                    style={({ pressed }) => [
                      styles.selectionCard,
                      selected ? styles.selectionCardSelected : null,
                      pressed ? styles.pressed : null,
                    ]}>
                    <View style={[styles.iconBox, selected ? styles.iconBoxSelected : null]}>
                      <Ionicons
                        color={selected ? colors.white : colors.slate500}
                        name={getCategoryIcon(category)}
                        size={20}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <AppText color={colors.navy900} variant="bodyStrong">
                        {getLocalizedCategoryName(category, locale)}
                      </AppText>
                      {getLocalizedCategoryDescription(category, locale) ? (
                        <AppText color={colors.slate700} numberOfLines={2} variant="small">
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

          {selectedCategoryId && selectedCategoryTags.length > 0 && selectedTagKeys.length === 0 ? (
            <View style={styles.tagsHint}>
              <AppText color={colors.proOrangeText} style={styles.tagsHintText} variant="small">
                {t('proTagsHint')}
              </AppText>
            </View>
          ) : null}

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
            {selectedCategory ? (
              <View style={styles.tagPanel}>
                <AppText color={colors.proOrangeTextDark} style={styles.tagPanelTitle} variant="small">
                  {t('projectIncludes')}
                </AppText>
                <View style={styles.tagWrap}>
                  {selectedCategoryTags.map((tag) => {
                    const selected = selectedTagKeys.includes(tag.key);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        key={tag.key}
                        onPress={() => {
                          setSelectedTagKeys((current) =>
                            current.includes(tag.key)
                              ? current.filter((item) => item !== tag.key)
                              : [...current, tag.key],
                          );
                          setStep1TagsBlocked(false);
                        }}
                        style={({ pressed }) => [
                          styles.specialtyTag,
                          selected ? styles.specialtyTagSelected : null,
                          pressed ? styles.pressed : null,
                        ]}>
                        <AppText
                          color={selected ? colors.white : colors.proOrangeTextDark}
                          style={styles.specialtyTagText}
                          variant="small">
                          {locale === 'bg' ? tag.bg : tag.en}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                {step1TagsBlocked && selectedTagKeys.length === 0 ? (
                  <AppText color={colors.danger600} variant="small">
                    {t('proTagsRequired')}
                  </AppText>
                ) : null}
              </View>
            ) : null}
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
            <View style={styles.field}>
              <AppText style={styles.fieldLabel}>{t('address')}</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsAddressPickerVisible(true)}
                style={({ pressed }) => [
                  styles.locationSummaryCard,
                  pressed ? styles.pressed : null,
                ]}>
                <Ionicons color={colors.proOrange600} name="location-outline" size={20} />
                <AppText
                  color={addressNotes ? colors.navy900 : colors.slate500}
                  numberOfLines={1}
                  style={styles.locationSummaryText}>
                  {addressNotes || 'Tap to choose location'}
                </AppText>
                <Ionicons color={colors.slate500} name="chevron-forward" size={18} />
              </Pressable>
            </View>
            <View style={styles.privacyNoteCard}>
              <Ionicons color={colors.proOrange600} name="lock-closed-outline" size={18} />
              <AppText color={colors.proOrangeTextDark} style={styles.privacyNoteText} variant="small">
                {t('proExactAddressPrivacyNote')}
              </AppText>
            </View>
            <AddressPickerModal
              initialAddress={addressNotes}
              initialCity={selectedCity?.slug}
              initialLatitude={selectedLatitude}
              initialLongitude={selectedLongitude}
              onClose={() => setIsAddressPickerVisible(false)}
              onConfirm={(nextAddress, latitude, longitude) => {
                setAddressNotes(nextAddress);
                setSelectedLatitude(latitude);
                setSelectedLongitude(longitude);
              }}
              title="Choose Project Location"
              visible={isAddressPickerVisible}
            />
            <Field
              helperText={t('proLocationNotesHelper')}
              label={t('locationNotes')}
              multiline
              onChangeText={setLocationNotes}
              onFocus={hideFooterForTyping}
              placeholder={t('locationNotesPlaceholder')}
              value={locationNotes}
            />
          </View>

          <View style={styles.sectionCard}>
            <Field
              errorText={getFieldError('district')}
              helperText={t('proDistrictSharedHelper')}
              label={t('district')}
              onChangeText={(value) => {
                setDistrict(value);
                clearFieldError('district');
              }}
              onFocus={hideFooterForTyping}
              placeholder={t('proRequestDistrictPlaceholder')}
              value={district}
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
              onFocus={hideFooterForTyping}
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
              onFocus={hideFooterForTyping}
              placeholder={t('proRequestDescriptionPlaceholder')}
              value={description}
            />
            <Field
              label={t('projectSize')}
              onChangeText={setProjectSize}
              onFocus={hideFooterForTyping}
              placeholder={t('projectSizePlaceholder')}
              value={projectSize}
            />
            <Field
              helperText={t('specialtyDetailsHelper')}
              label={t('specialtyDetails')}
              multiline
              onChangeText={setSpecialtyNotes}
              onFocus={hideFooterForTyping}
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
                onFocus={hideFooterForTyping}
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
                onFocus={hideFooterForTyping}
                placeholder={t('proRequestBudgetMaxPlaceholder')}
                value={budgetMax}
              />
            </View>
            <View style={styles.scheduleSection}>
              <AppText style={styles.fieldLabel}>{t('preferredStartDate')}</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => [
                  styles.scheduleDateButton,
                  getFieldError('timeline') ? styles.inputError : null,
                  pressed ? styles.pressed : null,
                ]}>
                <Ionicons color={colors.proOrange600} name="calendar-outline" size={18} />
                <AppText color={preferredDate ? colors.navy900 : colors.slate500} style={styles.scheduleDateValue}>
                  {preferredDate ? formattedPreferredDate : t('proChooseDatePlaceholder')}
                </AppText>
                <Ionicons color={colors.slate500} name="chevron-down" size={16} />
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  minimumDate={parseIsoDate(getTodayIsoDate()) ?? new Date()}
                  mode="date"
                  onChange={handleScheduleDateChange}
                  value={selectedDateValue}
                />
              ) : null}
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.scheduleSection}>
                <AppText style={styles.fieldLabel}>{t('startTime')}</AppText>
                <Pressable
                  accessibilityRole="button"
                  disabled={!preferredDate}
                  onPress={() => setTimePickerTarget('start')}
                  style={({ pressed }) => [
                    styles.scheduleDateButton,
                    !preferredDate ? styles.scheduleSectionDisabled : null,
                    getFieldError('timeline') ? styles.inputError : null,
                    pressed ? styles.pressed : null,
                  ]}>
                  <Ionicons color={colors.proOrange600} name="time-outline" size={18} />
                  {startTime ? (
                    <AppText color={colors.navy900} style={styles.scheduleDateValue}>{startTime}</AppText>
                  ) : null}
                  <Ionicons color={colors.slate500} name="chevron-down" size={16} />
                </Pressable>
              </View>
              <View style={styles.scheduleSection}>
                <AppText style={styles.fieldLabel}>{t('endTime')}</AppText>
                <Pressable
                  accessibilityRole="button"
                  disabled={!startTime}
                  onPress={() => setTimePickerTarget('end')}
                  style={({ pressed }) => [
                    styles.scheduleDateButton,
                    !startTime ? styles.scheduleSectionDisabled : null,
                    getFieldError('timeline') ? styles.inputError : null,
                    pressed ? styles.pressed : null,
                  ]}>
                  <Ionicons color={colors.proOrange600} name="time-outline" size={18} />
                  {endTime ? (
                    <AppText color={colors.navy900} style={styles.scheduleDateValue}>{endTime}</AppText>
                  ) : null}
                  <Ionicons color={colors.slate500} name="chevron-down" size={16} />
                </Pressable>
              </View>
            </View>
            {getFieldError('timeline') ? (
              <AppText color={colors.danger600} variant="small">
                {getFieldError('timeline')}
              </AppText>
            ) : (
              <AppText color={colors.slate500} variant="small">
                {t('proPreferredStartHelper')}
              </AppText>
            )}
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
              helperBodyText={t('proImageUploadLater')}
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
                  <AppText color={colors.proOrangeTextDark} variant="small">{label}</AppText>
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

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, spacing.lg) : 0}
            style={styles.keyboardAvoider}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom + 160, 180) },
              ]}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              onScroll={(event) => {
                handleCustomerScroll(event);
                handleFooterScroll(event);
              }}
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

          <Modal
            animationType="slide"
            onRequestClose={() => setTimePickerTarget(null)}
            transparent
            visible={timePickerTarget !== null}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setTimePickerTarget(null)}>
              <Pressable style={[styles.timePickerSheet, { marginBottom: Math.max(insets.bottom, spacing.sm) }]}>
                <View style={styles.pickerHeader}>
                  <AppText style={styles.sectionTitle}>
                    {timePickerTarget === 'start' ? t('startTime') : t('endTime')}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTimePickerTarget(null)}
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
                  {(timePickerTarget === 'start' ? availableStartTimes : availableEndTimes).map((option) => {
                    const selected = timePickerTarget === 'start' ? startTime === option : endTime === option;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        key={option}
                        onPress={() => {
                          if (timePickerTarget === 'start') {
                            handleStartTimeSelect(option);
                            return;
                          }

                          handleEndTimeSelect(option);
                        }}
                        style={[
                          styles.pickerOption,
                          selected ? styles.pickerOptionSelected : null,
                        ]}>
                        <AppText
                          color={selected ? colors.proOrange600 : colors.navy900}
                          style={styles.pickerOptionText}>
                          {option}
                        </AppText>
                        {selected ? <Ionicons color={colors.proOrange600} name="checkmark-circle" size={18} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>

          {!keyboardVisible ? (
            <Animated.View
              pointerEvents={footerPointerEvents}
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.md) },
                footerAnimatedStyle,
              ]}>
              <View style={styles.footerButtons}>
                <AppButton disabled={isBusy} labelColor={colors.slate500} onPress={handleBack} style={[styles.footerButton, styles.footerBackButton]} tone="neutral" variant="outline">
                  {currentStep === 1 ? t('cancel') : t('back')}
                </AppButton>
                <AppButton
                  disabled={isBusy}
                  loading={isBusy}
                  onPress={currentStep === STEP_TOTAL ? handleSubmit : handleContinueStep1}
                  style={styles.footerButton}
                  tone="pro">
                  {currentStep === STEP_TOTAL ? t('postProRequestButton') : t('continueAction')}
                </AppButton>
              </View>
            </Animated.View>
          ) : null}
          </KeyboardAvoidingView>
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
    ...designTokens.shadows.surface,
    backgroundColor: colors.white,
    borderTopColor: colors.proOrangeBorder,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  footerBackButton: {
    borderColor: colors.border,
  },
  footerButton: {
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 52,
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
    backgroundColor: colors.slate100,
    borderColor: colors.border,
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
  fieldLabel: {
    color: colors.navy900,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
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
  keyboardAvoider: {
    flex: 1,
    position: 'relative',
  },
  locationSummaryCard: {
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
  locationSummaryText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
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
  privacyNoteCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  privacyNoteText: {
    flex: 1,
    lineHeight: 18,
  },
  scheduleDateButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scheduleDateValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  scheduleSection: {
    gap: spacing.xs,
  },
  scheduleSectionDisabled: {
    opacity: 0.55,
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
  specialtyTag: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  specialtyTagSelected: {
    backgroundColor: colors.proOrange600,
    borderColor: colors.proOrange600,
  },
  specialtyTagText: {
    fontWeight: '800',
  },
  tagsHint: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tagsHintText: {
    textAlign: 'center',
  },
  tagPanel: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  tagPanelTitle: {
    fontWeight: '800',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 112,
  },
  timePickerSheet: {
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
