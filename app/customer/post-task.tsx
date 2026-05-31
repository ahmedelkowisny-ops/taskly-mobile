import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardTypeOptions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';

import { TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { createCustomerTask } from '@/src/lib/api/customer';
import { getCities, getCoreCategories, getPostingRules } from '@/src/lib/api/catalog';
import { CatalogCategory, CityOption, CoreTaskPostingRules } from '@/src/lib/api/domain';
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
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type CatalogState = {
  categories: CatalogCategory[];
  cities: CityOption[];
  rules: CoreTaskPostingRules;
};

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type TimePickerTarget = 'start' | 'end' | null;

type ValidationFieldKey =
  | 'address'
  | 'assemblyAreaClear'
  | 'assemblyInstructionsAvailable'
  | 'assemblyItemUnassembled'
  | 'assemblyPartsAvailable'
  | 'budgetEur'
  | 'categorySlug'
  | 'cityId'
  | 'description'
  | 'estimatedTime'
  | 'electricalChecklistNoNewWiring'
  | 'electricalChecklistPowerAccess'
  | 'electricalChecklistReplacementOnly'
  | 'electricalReplacementAtExistingPoint'
  | 'mountingCableConcealmentRequested'
  | 'mountingChecklistItemReady'
  | 'mountingChecklistMeasurementsChecked'
  | 'mountingChecklistWallSurfaceSelected'
  | 'mountingItemCount'
  | 'mountingTvBracketAvailable'
  | 'mountingTvSizeBand'
  | 'mountingWallType'
  | 'reviewConfirm'
  | 'scheduleDate'
  | 'startTime'
  | 'endTime'
  | 'title';

type ValidationIssue = {
  key: ValidationFieldKey;
  label: string;
  message: string;
};

type StepMeta = {
  id: WizardStep;
  label: string;
  support: string;
  title: string;
  body: string;
};

const CORE_TASK_UPLOAD_MAX_IMAGES = 5;
const STEP_TOTAL = 6;
const DEFAULT_TASK_LOCATION = { lat: 42.6977, lng: 23.3219 };
const DEFAULT_TASK_ADDRESS = 'Sofia, Bulgaria';
const TIME_SLOT_START_MINUTES = 6 * 60;
const TIME_SLOT_END_MINUTES = 22 * 60;
const TIME_SLOT_STEP_MINUTES = 15;
const MIN_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 6 * 60;
const TODAY_LEAD_TIME_MINUTES = 60;
const DEFAULT_FUTURE_START_TIME = '16:00';
const DEFAULT_FUTURE_END_TIME = '20:00';
const CATEGORY_BUDGET_RANGES: Record<string, { min: number; max: number; recommended: number }> = {
  furniture_assembly:  { min: 20, max: 40,  recommended: 30 },
  general_mounting:    { min: 20, max: 40,  recommended: 30 },
  light_electrical:    { min: 20, max: 40,  recommended: 30 },
  minor_plumbing_fix:  { min: 30, max: 60,  recommended: 45 },
  heavy_lifting:       { min: 25, max: 35,  recommended: 30 },
  painting_touchups:   { min: 20, max: 50,  recommended: 35 },
};

function parseNumberInput(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
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
  const parts = parseDateParts(value);
  if (!parts) return null;

  return new Date(parts.year, parts.month - 1, parts.day);
}

function getDateRelationToToday(value: string): 'invalid' | 'past' | 'today' | 'future' {
  const date = parseIsoDate(value);
  if (!date) return 'invalid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) return 'past';
  if (date.getTime() > today.getTime()) return 'future';
  return 'today';
}

function parseTimeParts(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function parseTimeToMinutes(value: string) {
  const parts = parseTimeParts(value);
  if (!parts) return null;

  return parts.hour * 60 + parts.minute;
}

function minutesToTimeString(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getRoundedTodayMinimumStartMinutes(now: Date = new Date()) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return Math.ceil((minutesNow + TODAY_LEAD_TIME_MINUTES) / TIME_SLOT_STEP_MINUTES) * TIME_SLOT_STEP_MINUTES;
}

function clampMinutes(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultEndMinutes(startMinutes: number) {
  const minEnd = startMinutes + MIN_DURATION_MINUTES;
  const maxEnd = Math.min(startMinutes + MAX_DURATION_MINUTES, TIME_SLOT_END_MINUTES);
  if (minEnd > maxEnd) return null;

  const preferredEnd = Math.min(startMinutes + 120, maxEnd);
  return Math.max(preferredEnd, minEnd);
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
  const latestStart = TIME_SLOT_END_MINUTES - MIN_DURATION_MINUTES;

  if (relation === 'invalid' || relation === 'past') {
    return { startTime: '', endTime: '' };
  }

  if (relation === 'today') {
    const minTodayStart = Math.max(getRoundedTodayMinimumStartMinutes(), TIME_SLOT_START_MINUTES);
    if (minTodayStart > latestStart) return { startTime: '', endTime: '' };

    const endMinutes = getDefaultEndMinutes(minTodayStart);
    return {
      startTime: minutesToTimeString(minTodayStart),
      endTime: endMinutes === null ? '' : minutesToTimeString(endMinutes),
    };
  }

  const targetStart = parseTimeToMinutes(DEFAULT_FUTURE_START_TIME) ?? TIME_SLOT_START_MINUTES;
  const startMinutes = clampMinutes(targetStart, TIME_SLOT_START_MINUTES, latestStart);
  const minEnd = startMinutes + MIN_DURATION_MINUTES;
  const maxEnd = Math.min(startMinutes + MAX_DURATION_MINUTES, TIME_SLOT_END_MINUTES);
  const targetEnd = parseTimeToMinutes(DEFAULT_FUTURE_END_TIME) ?? startMinutes + 120;
  const endMinutes = clampMinutes(targetEnd, minEnd, maxEnd);

  return {
    startTime: minutesToTimeString(startMinutes),
    endTime: minutesToTimeString(endMinutes),
  };
}

function buildLocalIso(dateValue: string, timeValue: string) {
  const date = parseDateParts(dateValue);
  const time = parseTimeParts(timeValue);
  if (!date || !time) return null;

  return new Date(date.year, date.month - 1, date.day, time.hour, time.minute).toISOString();
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
    preferredTimeWindow: 'endTime',
    scheduledEndAt: 'endTime',
    scheduledStartAt: 'startTime',
    'scopeData.assemblyAreaClear': 'assemblyAreaClear',
    'scopeData.assemblyInstructionsAvailable': 'assemblyInstructionsAvailable',
    'scopeData.assemblyItemUnassembled': 'assemblyItemUnassembled',
    'scopeData.assemblyPartsAvailable': 'assemblyPartsAvailable',
    'scopeData.wallType': 'mountingWallType',
    'scopeData.itemCount': 'mountingItemCount',
    'scopeData.tvSizeBand': 'mountingTvSizeBand',
    'scopeData.tvBracketAvailable': 'mountingTvBracketAvailable',
    'scopeData.cableConcealmentRequested': 'mountingCableConcealmentRequested',
    'scopeData.checklistItemReady': 'mountingChecklistItemReady',
    'scopeData.checklistWallSurfaceSelected': 'mountingChecklistWallSurfaceSelected',
    'scopeData.checklistMeasurementsChecked': 'mountingChecklistMeasurementsChecked',
    'scopeData.electricalReplacementAtExistingPoint': 'electricalReplacementAtExistingPoint',
    'scopeData.checklistReplacementOnly': 'electricalChecklistReplacementOnly',
    'scopeData.checklistPowerAccess': 'electricalChecklistPowerAccess',
    'scopeData.checklistNoNewWiring': 'electricalChecklistNoNewWiring',
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

function formatStepIndicator(step: StepMeta) {
  return t('postTaskStepIndicator')
    .replace('{current}', String(step.id))
    .replace('{total}', String(STEP_TOTAL))
    .replace('{support}', step.support);
}

function getCategoryIcon(category: CatalogCategory): keyof typeof Ionicons.glyphMap {
  const value = `${category.slug} ${category.nameEn}`.toLowerCase();

  if (value.includes('furniture') || value.includes('assembly')) return 'hammer-outline';
  if (value.includes('mount') || value.includes('tv')) return 'easel-outline';
  if (value.includes('electric')) return 'bulb-outline';
  if (value.includes('plumb') || value.includes('sink')) return 'water-outline';
  if (value.includes('clean')) return 'sparkles-outline';
  return 'construct-outline';
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText color={colors.navy900} style={styles.summaryValue} variant="bodyStrong">
        {value || '-'}
      </AppText>
    </View>
  );
}

export default function CustomerPostTaskScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(DEFAULT_TASK_ADDRESS);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetTrackWidth, setBudgetTrackWidth] = useState(0);
  const [assemblyPartsAvailable, setAssemblyPartsAvailable] = useState(false);
  const [assemblyInstructionsAvailable, setAssemblyInstructionsAvailable] = useState(false);
  const [assemblyItemUnassembled, setAssemblyItemUnassembled] = useState(false);
  const [assemblyAreaClear, setAssemblyAreaClear] = useState(false);
  const [mountingType, setMountingType] = useState<'standard_mounting' | 'tv_mounting'>('standard_mounting');
  const [mountingWallType, setMountingWallType] = useState<'drywall' | 'brick' | 'concrete' | 'unknown' | null>(null);
  const [mountingItemCount, setMountingItemCount] = useState('');
  const [mountingTvSizeBand, setMountingTvSizeBand] = useState<'up_to_43' | '44_to_65' | '65_plus' | null>(null);
  const [mountingTvBracketAvailable, setMountingTvBracketAvailable] = useState<boolean | null>(null);
  const [mountingCableConcealmentRequested, setMountingCableConcealmentRequested] = useState<boolean | null>(null);
  const [mountingChecklistItemReady, setMountingChecklistItemReady] = useState(false);
  const [mountingChecklistWallSurfaceSelected, setMountingChecklistWallSurfaceSelected] = useState(false);
  const [mountingChecklistMeasurementsChecked, setMountingChecklistMeasurementsChecked] = useState(false);
  const [electricalReplacementAtExistingPoint, setElectricalReplacementAtExistingPoint] = useState(false);
  const [electricalChecklistReplacementOnly, setElectricalChecklistReplacementOnly] = useState(false);
  const [electricalChecklistPowerAccess, setElectricalChecklistPowerAccess] = useState(false);
  const [electricalChecklistNoNewWiring, setElectricalChecklistNoNewWiring] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
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
  const [selectedLatitude, setSelectedLatitude] = useState(DEFAULT_TASK_LOCATION.lat);
  const [selectedLongitude, setSelectedLongitude] = useState(DEFAULT_TASK_LOCATION.lng);
  const [selectedAddress, setSelectedAddress] = useState(DEFAULT_TASK_ADDRESS);

  const steps: StepMeta[] = [
    {
      id: 1,
      label: t('postTaskStepService'),
      support: t('postTaskServiceSupport'),
      title: t('postTaskServiceTitle'),
      body: t('postTaskServiceBody'),
    },
    {
      id: 2,
      label: t('postTaskStepBudget'),
      support: t('postTaskBudgetSupport'),
      title: t('postTaskBudgetTitle'),
      body: t('postTaskBudgetBody'),
    },
    {
      id: 3,
      label: t('postTaskStepDetails'),
      support: t('postTaskDetailsSupport'),
      title: t('postTaskDetailsTitle'),
      body: t('postTaskDetailsBody'),
    },
    {
      id: 4,
      label: t('postTaskStepPhotos'),
      support: t('postTaskPhotosSupport'),
      title: t('postTaskPhotosTitle'),
      body: t('postTaskPhotosBody'),
    },
    {
      id: 5,
      label: t('postTaskStepSchedule'),
      support: t('postTaskScheduleSupport'),
      title: t('postTaskScheduleTitle'),
      body: t('postTaskScheduleBody'),
    },
    {
      id: 6,
      label: t('postTaskStepReview'),
      support: t('postTaskReviewSupport'),
      title: t('postTaskReviewTitle'),
      body: t('postTaskReviewBody'),
    },
  ];

  const activeStep = steps[currentStep - 1];
  const progressPercent = (currentStep / STEP_TOTAL) * 100;
  const selectedCategory = useMemo(
    () => catalog?.categories.find((category) => category.id === selectedCategoryId) ?? null,
    [catalog?.categories, selectedCategoryId],
  );
  const selectedCity = useMemo(
    () => catalog?.cities.find((city) => city.id === selectedCityId) ?? null,
    [catalog?.cities, selectedCityId],
  );
  const categoryBudgetRange = useMemo(
    () => (selectedCategory?.slug ? (CATEGORY_BUDGET_RANGES[selectedCategory.slug] ?? null) : null),
    [selectedCategory],
  );
  const selectedBudgetValue = parseNumberInput(budget);
  const budgetOptions = useMemo(() => {
    if (!categoryBudgetRange) return [];

    return Array.from(
      { length: categoryBudgetRange.max - categoryBudgetRange.min + 1 },
      (_, index) => categoryBudgetRange.min + index,
    );
  }, [categoryBudgetRange]);
  const budgetProgressPercent = useMemo(() => {
    if (!categoryBudgetRange || selectedBudgetValue === null) return 0;

    const span = categoryBudgetRange.max - categoryBudgetRange.min;
    if (span <= 0) return 100;

    const clamped = Math.min(categoryBudgetRange.max, Math.max(categoryBudgetRange.min, selectedBudgetValue));
    return ((clamped - categoryBudgetRange.min) / span) * 100;
  }, [categoryBudgetRange, selectedBudgetValue]);
  const recommendedBudgetPercent = useMemo(() => {
    if (!categoryBudgetRange) return 50;

    const span = categoryBudgetRange.max - categoryBudgetRange.min;
    if (span <= 0) return 50;

    return ((categoryBudgetRange.recommended - categoryBudgetRange.min) / span) * 100;
  }, [categoryBudgetRange]);
  const selectedScheduleDate = useMemo(() => parseIsoDate(scheduleDate) ?? new Date(), [scheduleDate]);
  const reviewScheduleValue = useMemo(() => {
    if (!scheduleDate) return '';

    const formattedDate = selectedScheduleDate.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return startTime && endTime ? `${formattedDate}, ${startTime} - ${endTime}` : formattedDate;
  }, [endTime, locale, scheduleDate, selectedScheduleDate, startTime]);
  const selectedDateRelation = useMemo(() => getDateRelationToToday(scheduleDate), [scheduleDate]);
  const availableStartTimes = useMemo(() => {
    if (!scheduleDate || selectedDateRelation === 'invalid' || selectedDateRelation === 'past') return [];

    const latestStart = TIME_SLOT_END_MINUTES - MIN_DURATION_MINUTES;
    const minStart =
      selectedDateRelation === 'today'
        ? Math.max(getRoundedTodayMinimumStartMinutes(), TIME_SLOT_START_MINUTES)
        : TIME_SLOT_START_MINUTES;

    return TIME_OPTIONS.filter((option) => {
      const minutes = parseTimeToMinutes(option);
      return minutes !== null && minutes >= minStart && minutes <= latestStart;
    });
  }, [scheduleDate, selectedDateRelation]);
  const availableEndTimes = useMemo(() => {
    const startMinutes = parseTimeToMinutes(startTime);
    if (startMinutes === null) return [];

    const minEnd = startMinutes + MIN_DURATION_MINUTES;
    const maxEnd = Math.min(startMinutes + MAX_DURATION_MINUTES, TIME_SLOT_END_MINUTES);

    return TIME_OPTIONS.filter((option) => {
      const minutes = parseTimeToMinutes(option);
      return minutes !== null && minutes >= minEnd && minutes <= maxEnd;
    });
  }, [startTime]);
  const scheduleCopy = useMemo(
    () =>
      locale === 'bg'
        ? {
            chooseDate: 'Избери дата',
            dateHelper: 'Избери дата, за да предложим подходящи часове.',
            datePast: 'Избери днешна или бъдеща дата.',
            durationMax: 'Времевият прозорец може да е максимум 6 часа.',
            durationMin: 'Времевият прозорец трябва да е поне 60 минути.',
            endHelper: 'Първо избери начален час.',
            noEndSlots: 'Няма валидни крайни часове за този старт.',
            noSlotsToday: 'Няма останали валидни часове за днес.',
            todayLead: 'За днес избери час поне 60 минути от сега.',
          }
        : {
            chooseDate: 'Choose date',
            dateHelper: 'Choose a date so we can suggest valid time slots.',
            datePast: 'Choose today or a future date.',
            durationMax: 'Time window can be at most 6 hours.',
            durationMin: 'Time window must be at least 60 minutes.',
            endHelper: 'Choose a start time first.',
            noEndSlots: 'No valid end times for this start.',
            noSlotsToday: 'No valid time slots remain for today.',
            todayLead: 'For today, choose a time at least 60 minutes from now.',
          },
    [locale],
  );

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
    setErrorMessage(t('couldNotCreateTask'));
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

  useEffect(() => {
    if (!selectedCategory) return;
    const range = CATEGORY_BUDGET_RANGES[selectedCategory.slug] ?? null;
    if (range) setBudget(String(range.recommended));
  }, [selectedCategory]);

  useEffect(() => {
    setAssemblyPartsAvailable(false);
    setAssemblyInstructionsAvailable(false);
    setAssemblyItemUnassembled(false);
    setAssemblyAreaClear(false);
    setMountingType('standard_mounting');
    setMountingWallType(null);
    setMountingItemCount('');
    setMountingTvSizeBand(null);
    setMountingTvBracketAvailable(null);
    setMountingCableConcealmentRequested(null);
    setMountingChecklistItemReady(false);
    setMountingChecklistWallSurfaceSelected(false);
    setMountingChecklistMeasurementsChecked(false);
    setElectricalReplacementAtExistingPoint(false);
    setElectricalChecklistReplacementOnly(false);
    setElectricalChecklistPowerAccess(false);
    setElectricalChecklistNoNewWiring(false);
  }, [selectedCategoryId]);

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

  const updateBudgetFromTrackPosition = useCallback(
    (locationX: number) => {
      if (!categoryBudgetRange || budgetTrackWidth <= 0) return;

      const clampedX = Math.min(budgetTrackWidth, Math.max(0, locationX));
      const percent = clampedX / budgetTrackWidth;
      const nextBudget = Math.round(
        categoryBudgetRange.min + percent * (categoryBudgetRange.max - categoryBudgetRange.min),
      );

      setBudget(String(nextBudget));
      clearFieldError('budgetEur');
    },
    [budgetTrackWidth, categoryBudgetRange, clearFieldError],
  );

  const updateBudgetFromTrackEvent = useCallback(
    (event: GestureResponderEvent) => {
      updateBudgetFromTrackPosition(event.nativeEvent.locationX);
    },
    [updateBudgetFromTrackPosition],
  );

  const budgetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => Boolean(categoryBudgetRange),
        onPanResponderGrant: updateBudgetFromTrackEvent,
        onPanResponderMove: updateBudgetFromTrackEvent,
        onStartShouldSetPanResponder: () => Boolean(categoryBudgetRange),
      }),
    [categoryBudgetRange, updateBudgetFromTrackEvent],
  );

  const handleScheduleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !selectedDate) return;

      const nextDate = dateToIsoDate(selectedDate);
      const defaults = getDefaultTimesForDate(nextDate);

      setScheduleDate(nextDate);
      setStartTime(defaults.startTime);
      setEndTime(defaults.endTime);
      clearFieldError('scheduleDate');
      clearFieldError('startTime');
      clearFieldError('endTime');
    },
    [clearFieldError],
  );

  const handleStartTimeSelect = useCallback(
    (nextStartTime: string) => {
      const startMinutes = parseTimeToMinutes(nextStartTime);
      if (startMinutes === null) {
        setStartTime(nextStartTime);
        setEndTime('');
        clearFieldError('startTime');
        clearFieldError('endTime');
        return;
      }

      const minEnd = startMinutes + MIN_DURATION_MINUTES;
      const maxEnd = Math.min(startMinutes + MAX_DURATION_MINUTES, TIME_SLOT_END_MINUTES);
      const currentEndMinutes = parseTimeToMinutes(endTime);
      const hasValidCurrentEnd =
        currentEndMinutes !== null && currentEndMinutes >= minEnd && currentEndMinutes <= maxEnd;
      const nextEndMinutes = hasValidCurrentEnd ? currentEndMinutes : getDefaultEndMinutes(startMinutes);

      setStartTime(nextStartTime);
      setEndTime(nextEndMinutes === null ? '' : minutesToTimeString(nextEndMinutes));
      setTimePickerTarget(null);
      clearFieldError('startTime');
      clearFieldError('endTime');
    },
    [clearFieldError, endTime],
  );

  const handleEndTimeSelect = useCallback(
    (nextEndTime: string) => {
      setEndTime(nextEndTime);
      setTimePickerTarget(null);
      clearFieldError('endTime');
    },
    [clearFieldError],
  );

  const handleMapPress = useCallback(
    async (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setSelectedLatitude(latitude);
      setSelectedLongitude(longitude);

      const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          const streetPart = [r.streetNumber, r.street].filter(Boolean).join(' ');
          const resolved =
            [streetPart, r.district, r.city].filter(Boolean).join(', ') || fallback;
          setSelectedAddress(resolved);
          setAddress(resolved);
        } else {
          setSelectedAddress(fallback);
          setAddress(fallback);
        }
      } catch {
        setSelectedAddress(fallback);
        setAddress(fallback);
      }
      clearFieldError('address');
    },
    [clearFieldError],
  );

  const formValidation = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const minDescriptionLength = catalog?.rules.minDescriptionLength ?? 20;
    const parsedBudget = parseNumberInput(budget);
    const startIso = buildLocalIso(scheduleDate, startTime);
    const endIso = buildLocalIso(scheduleDate, endTime);
    const scheduleRelation = getDateRelationToToday(scheduleDate);
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const addIssue = (key: ValidationFieldKey, label: string, message: string) => {
      issues.push({ key, label, message });
    };

    const isFurnitureAssembly = selectedCategory?.slug === 'furniture_assembly';

    if (!selectedCategoryId) addIssue('categorySlug', t('category'), t('missingCategory'));

    if (isFurnitureAssembly) {
      if (!assemblyPartsAvailable) {
        addIssue('assemblyPartsAvailable', 'Parts available', 'Please confirm all parts are available.');
      }
      if (!assemblyInstructionsAvailable) {
        addIssue('assemblyInstructionsAvailable', 'Instructions available', 'Please confirm instructions are available if possible.');
      }
      if (!assemblyItemUnassembled) {
        addIssue('assemblyItemUnassembled', 'Item unassembled', 'Please confirm the item is unassembled unless stated otherwise.');
      }
      if (!assemblyAreaClear) {
        addIssue('assemblyAreaClear', 'Area clear', 'Please confirm the assembly area is clear and accessible.');
      }
    }

    if (selectedCategory?.slug === 'general_mounting') {
      if (!mountingWallType) {
        addIssue('mountingWallType', 'Wall type', 'Please select a wall/material type.');
      }
      const parsedItemCount = Number.parseInt(mountingItemCount, 10);
      if (!mountingItemCount.trim() || !Number.isFinite(parsedItemCount) || parsedItemCount <= 0) {
        addIssue('mountingItemCount', 'Item count', 'Please enter the number of items (min 1).');
      }
      if (!mountingChecklistItemReady) {
        addIssue('mountingChecklistItemReady', 'Hardware ready', 'Please confirm item and hardware are ready.');
      }
      if (!mountingChecklistWallSurfaceSelected) {
        addIssue('mountingChecklistWallSurfaceSelected', 'Wall confirmed', 'Please confirm wall/material type is selected.');
      }
      if (!mountingChecklistMeasurementsChecked) {
        addIssue('mountingChecklistMeasurementsChecked', 'Measurements checked', 'Please confirm measurements are checked.');
      }
      if (mountingType === 'tv_mounting') {
        if (!mountingTvSizeBand) {
          addIssue('mountingTvSizeBand', 'TV size', 'Please select the TV size.');
        }
        if (mountingTvBracketAvailable === null) {
          addIssue('mountingTvBracketAvailable', 'TV bracket', 'Please confirm whether a TV bracket is available.');
        }
        if (mountingCableConcealmentRequested === null) {
          addIssue('mountingCableConcealmentRequested', 'Cable concealment', 'Please confirm if cable concealment is requested.');
        }
      }
    }

    if (selectedCategory?.slug === 'light_electrical') {
      if (!electricalReplacementAtExistingPoint) {
        addIssue('electricalReplacementAtExistingPoint', 'Replacement confirmed', 'Please confirm this is replacement work at an existing point.');
      }
      if (!electricalChecklistReplacementOnly) {
        addIssue('electricalChecklistReplacementOnly', 'Replacement only', 'Please confirm this is replacement at an existing point only.');
      }
      if (!electricalChecklistPowerAccess) {
        addIssue('electricalChecklistPowerAccess', 'Power access', 'Please confirm power can be safely turned off and accessed.');
      }
      if (!electricalChecklistNoNewWiring) {
        addIssue('electricalChecklistNoNewWiring', 'No new wiring', 'Please confirm no new wiring or moving points is required.');
      }
    }

    if (!budget.trim()) {
      addIssue('budgetEur', t('budget'), t('missingBudget'));
    } else if (parsedBudget === null || parsedBudget <= 0) {
      addIssue('budgetEur', t('budget'), t('invalidBudget'));
    }

    if (!title.trim()) addIssue('title', t('title'), t('missingTitle'));

    if (!description.trim()) {
      addIssue('description', t('description'), t('missingDescription'));
    } else if (description.trim().length < minDescriptionLength) {
      addIssue('description', t('description'), `${t('descriptionTooShort')} ${minDescriptionLength}.`);
    }

    if (!selectedCityId) addIssue('cityId', t('city'), t('missingCity'));
    if (!address.trim()) addIssue('address', t('address'), t('missingAddress'));
    if (!scheduleDate.trim()) {
      addIssue('scheduleDate', t('scheduleDate'), t('scheduleDateRequired'));
    } else if (scheduleRelation === 'invalid') {
      addIssue('scheduleDate', t('scheduleDate'), t('invalidDate'));
    } else if (scheduleRelation === 'past') {
      addIssue('scheduleDate', t('scheduleDate'), scheduleCopy.datePast);
    }

    if (!startTime.trim()) {
      addIssue('startTime', t('startTime'), t('startTimeRequired'));
    } else if (startMinutes === null) {
      addIssue('startTime', t('startTime'), t('invalidTime'));
    } else if (startMinutes < TIME_SLOT_START_MINUTES || startMinutes > TIME_SLOT_END_MINUTES - MIN_DURATION_MINUTES) {
      addIssue('startTime', t('startTime'), t('invalidTime'));
    } else if (scheduleRelation === 'today') {
      const minTodayStart = Math.max(getRoundedTodayMinimumStartMinutes(), TIME_SLOT_START_MINUTES);
      if (startMinutes < minTodayStart) {
        addIssue('startTime', t('startTime'), scheduleCopy.todayLead);
      }
    }

    if (!endTime.trim()) {
      addIssue('endTime', t('endTime'), t('endTimeRequired'));
    } else if (endMinutes === null) {
      addIssue('endTime', t('endTime'), t('invalidTime'));
    } else if (endMinutes > TIME_SLOT_END_MINUTES) {
      addIssue('endTime', t('endTime'), t('invalidTime'));
    }

    if (startMinutes !== null && endMinutes !== null) {
      if (endMinutes <= startMinutes) {
        addIssue('endTime', t('endTime'), t('endTimeAfterStart'));
      } else {
        const duration = endMinutes - startMinutes;
        if (duration < MIN_DURATION_MINUTES) {
          addIssue('endTime', t('endTime'), scheduleCopy.durationMin);
        } else if (duration > MAX_DURATION_MINUTES) {
          addIssue('endTime', t('endTime'), scheduleCopy.durationMax);
        }
      }
    } else if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      addIssue('endTime', t('endTime'), t('endTimeAfterStart'));
    }

    if (!estimatedTime.trim()) addIssue('estimatedTime', t('estimatedTime'), t('missingEstimatedTime'));
    if (!reviewConfirmed) addIssue('reviewConfirm', t('readyToPost'), t('reviewConfirmRequired'));

    const errors = issues.reduce<Record<string, string>>((nextErrors, issue) => {
      if (!nextErrors[issue.key]) {
        nextErrors[issue.key] = issue.message;
      }

      return nextErrors;
    }, {});

    return {
      errors,
      issues,
      parsedBudget,
      startIso,
      endIso,
    };
  }, [
    address,
    assemblyAreaClear,
    assemblyInstructionsAvailable,
    assemblyItemUnassembled,
    assemblyPartsAvailable,
    budget,
    catalog?.rules.minDescriptionLength,
    description,
    endTime,
    estimatedTime,
    electricalChecklistNoNewWiring,
    electricalChecklistPowerAccess,
    electricalChecklistReplacementOnly,
    electricalReplacementAtExistingPoint,
    mountingCableConcealmentRequested,
    mountingChecklistItemReady,
    mountingChecklistMeasurementsChecked,
    mountingChecklistWallSurfaceSelected,
    mountingItemCount,
    mountingTvBracketAvailable,
    mountingTvSizeBand,
    mountingType,
    mountingWallType,
    reviewConfirmed,
    scheduleDate,
    scheduleCopy,
    selectedCategory,
    selectedCategoryId,
    selectedCityId,
    startTime,
    title,
  ]);

  const errorsForStep = useCallback(
    (step: WizardStep) => {
      const stepKeys: Record<WizardStep, ValidationFieldKey[]> = {
        1: ['categorySlug'],
        2: ['budgetEur'],
        3: [
          'title', 'description',
          'assemblyPartsAvailable', 'assemblyInstructionsAvailable', 'assemblyItemUnassembled', 'assemblyAreaClear',
          'mountingWallType', 'mountingItemCount',
          'mountingChecklistItemReady', 'mountingChecklistWallSurfaceSelected', 'mountingChecklistMeasurementsChecked',
          'mountingTvSizeBand', 'mountingTvBracketAvailable', 'mountingCableConcealmentRequested',
          'electricalReplacementAtExistingPoint', 'electricalChecklistReplacementOnly', 'electricalChecklistPowerAccess', 'electricalChecklistNoNewWiring',
        ],
        4: [],
        5: ['cityId', 'address', 'scheduleDate', 'startTime', 'endTime', 'estimatedTime'],
        6: ['reviewConfirm'],
      };

      return stepKeys[step].reduce<Record<string, string>>((nextErrors, key) => {
        if (formValidation.errors[key]) {
          nextErrors[key] = formValidation.errors[key];
        }

        return nextErrors;
      }, {});
    },
    [formValidation.errors],
  );

  const getFieldError = (key: ValidationFieldKey) => fieldErrors[key];

  const handleContinue = useCallback(() => {
    const stepErrors = errorsForStep(currentStep);

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...stepErrors }));
      setSubmitError(t('pleaseCheckHighlightedFields'));
      return;
    }

    setSubmitError(null);
    if (currentStep < STEP_TOTAL) {
      setCurrentStep((step) => (step + 1) as WizardStep);
    }
  }, [currentStep, errorsForStep]);

  const handleBack = useCallback(() => {
    setSubmitError(null);
    if (currentStep === 1) {
      router.back();
      return;
    }

    setCurrentStep((step) => (step - 1) as WizardStep);
  }, [currentStep, router]);

  const handleSubmit = useCallback(async () => {
    setSubmitMessage(null);
    setSubmitError(null);
    setUploadWarning(null);
    setUploadProgressCurrent(0);
    setUploadProgressTotal(0);
    setFieldErrors({});

    if (
      formValidation.issues.length > 0 ||
      !selectedCategoryId ||
      !selectedCityId ||
      !formValidation.startIso ||
      !formValidation.endIso
    ) {
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

    const isFurnitureAssembly = selectedCategory?.slug === 'furniture_assembly';
    const isGeneralMounting = selectedCategory?.slug === 'general_mounting';
    const isLightElectrical = selectedCategory?.slug === 'light_electrical';

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
        location: DEFAULT_TASK_LOCATION,
        scheduledEndAt: formValidation.endIso,
        scheduledStartAt: formValidation.startIso,
        title: title.trim(),
        ...(isFurnitureAssembly
          ? {
              scopeData: {
                assemblyAreaClear,
                assemblyInstructionsAvailable,
                assemblyItemUnassembled,
                assemblyPartsAvailable,
              },
            }
          : {}),
        ...(isLightElectrical
          ? {
              scopeData: {
                electricalReplacementAtExistingPoint,
                checklistReplacementOnly: electricalChecklistReplacementOnly,
                checklistPowerAccess: electricalChecklistPowerAccess,
                checklistNoNewWiring: electricalChecklistNoNewWiring,
              },
            }
          : {}),
        ...(isGeneralMounting
          ? {
              scopeData: {
                mountingType,
                wallType: mountingWallType ?? undefined,
                itemCount: Number.parseInt(mountingItemCount, 10) || undefined,
                checklistItemReady: mountingChecklistItemReady,
                checklistWallSurfaceSelected: mountingChecklistWallSurfaceSelected,
                checklistMeasurementsChecked: mountingChecklistMeasurementsChecked,
                ...(mountingType === 'tv_mounting'
                  ? {
                      tvSizeBand: mountingTvSizeBand ?? undefined,
                      tvBracketAvailable: mountingTvBracketAvailable ?? undefined,
                      cableConcealmentRequested: mountingCableConcealmentRequested ?? undefined,
                    }
                  : {}),
              },
            }
          : {}),
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

        setSubmitMessage(uploadSummary.uploaded > 0 ? t('photosUploaded') : t('taskCreated'));
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
    assemblyAreaClear,
    assemblyInstructionsAvailable,
    assemblyItemUnassembled,
    assemblyPartsAvailable,
    description,
    electricalChecklistNoNewWiring,
    electricalChecklistPowerAccess,
    electricalChecklistReplacementOnly,
    electricalReplacementAtExistingPoint,
    estimatedTime,
    formValidation,
    getValidAccessToken,
    images,
    mountingCableConcealmentRequested,
    mountingChecklistItemReady,
    mountingChecklistMeasurementsChecked,
    mountingChecklistWallSurfaceSelected,
    mountingItemCount,
    mountingTvBracketAvailable,
    mountingTvSizeBand,
    mountingType,
    mountingWallType,
    router,
    selectedCategory,
    selectedCategoryId,
    selectedCityId,
    status,
    title,
  ]);

  const isBusy = isSubmitting || isUploadingImages;
  const maxImages = catalog?.rules.maxImages
    ? Math.min(catalog.rules.maxImages, CORE_TASK_UPLOAD_MAX_IMAGES)
    : CORE_TASK_UPLOAD_MAX_IMAGES;
  const descriptionLength = description.trim().length;
  const descriptionHelper = catalog
    ? `${descriptionLength}/${catalog.rules.maxDescriptionLength}`
    : t('postTaskDetailsBody');
  const missingFieldLabels = formValidation.issues
    .filter((issue) => issue.key !== 'reviewConfirm')
    .map((issue) => issue.label);

  const renderStepContent = () => {
    if (isLoading) {
      return (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label={t('loading')} tone="core" />
          <AppText color={colors.slate700}>{t('postTaskServiceSupport')}</AppText>
        </AppCard>
      );
    }

    if (errorMessage) {
      return (
        <AppCard accentColor={colors.danger600}>
          <StatusBadge label={t('couldNotCreateTask')} tone="danger" />
          <AppText color={colors.slate700}>{errorMessage}</AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadCatalog} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      );
    }

    if (currentStep === 1) {
      return (
        <View style={styles.cardStack}>
          {catalog?.categories.map((category) => {
            const selected = selectedCategoryId === category.id;

            return (
              <Pressable
                accessibilityRole="button"
                key={category.id}
                onPress={() => {
                  setSelectedCategoryId(category.id);
                  clearFieldError('categorySlug');
                }}
                style={({ pressed }) => [
                  styles.serviceCard,
                  selected ? styles.selectedServiceCard : null,
                  { opacity: pressed ? 0.9 : 1 },
                ]}>
                <View style={[styles.iconTile, selected ? styles.iconTileSelected : null]}>
                  <Ionicons
                    color={selected ? colors.white : colors.slate700}
                    name={getCategoryIcon(category)}
                    size={17}
                  />
                </View>
                <View style={styles.cardCopy}>
                  <AppText style={styles.cardTitle}>
                    {getLocalizedCategoryName(category, locale)}
                  </AppText>
                  <AppText color={colors.slate700} style={styles.cardBody}>
                    {getLocalizedCategoryDescription(category, locale)}
                  </AppText>
                </View>
                {selected ? <Ionicons color={colors.tasklyBlue600} name="checkmark-circle" size={20} /> : null}
              </Pressable>
            );
          })}
          {getFieldError('categorySlug') ? (
            <AppText color={colors.danger600} variant="small">
              {getFieldError('categorySlug')}
            </AppText>
          ) : null}
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.cardStack}>
          <View style={styles.moneyCard}>
            {categoryBudgetRange ? (
              <>
                <View style={styles.budgetHeroRow}>
                  <View style={styles.budgetHeroCopy}>
                    <AppText color={colors.slate700} style={styles.budgetEyebrow} variant="small">
                      {t('budget')}
                    </AppText>
                    <AppText style={styles.budgetValue}>
                      €{selectedBudgetValue ?? categoryBudgetRange.recommended}
                    </AppText>
                  </View>
                  <View style={styles.recommendedPill}>
                    <AppText color={colors.tasklyBlue600} style={styles.recommendedPillText}>
                      {locale === 'bg' ? 'Препоръчано' : 'Recommended'} €{categoryBudgetRange.recommended}
                    </AppText>
                  </View>
                </View>

                <View style={styles.budgetTrackBlock}>
                  <View
                    onLayout={(event: LayoutChangeEvent) => setBudgetTrackWidth(event.nativeEvent.layout.width)}
                    style={styles.budgetTouchArea}
                    {...budgetPanResponder.panHandlers}>
                    <View style={styles.budgetTrack} pointerEvents="none">
                      <View style={[styles.budgetTrackFill, { width: `${budgetProgressPercent}%` }]} />
                      <View style={[styles.budgetSelectedThumb, { left: `${budgetProgressPercent}%` }]} />
                      <View style={[styles.budgetRecommendedDot, { left: `${recommendedBudgetPercent}%` }]} />
                    </View>
                  </View>
                  <View style={styles.budgetRangeLabels}>
                    <AppText color={colors.slate700} variant="small">
                      €{categoryBudgetRange.min}
                    </AppText>
                    <AppText color={colors.slate700} variant="small">
                      €{categoryBudgetRange.max}
                    </AppText>
                  </View>
                </View>

                <ScrollView
                  contentContainerStyle={styles.budgetScroller}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {budgetOptions.map((amount) => {
                    const amountStr = String(amount);
                    const selected = selectedBudgetValue === amount;
                    const recommended = amount === categoryBudgetRange.recommended;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={amountStr}
                        onPress={() => {
                          setBudget(amountStr);
                          clearFieldError('budgetEur');
                        }}
                        style={[
                          styles.budgetValueChip,
                          selected ? styles.budgetValueChipSelected : null,
                          recommended ? styles.budgetValueChipRecommended : null,
                        ]}>
                        <AppText
                          color={selected ? colors.tasklyBlue600 : colors.slate700}
                          variant="small">
                          €{amount}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {getFieldError('budgetEur') ? (
                  <AppText color={colors.danger600} variant="small">
                    {getFieldError('budgetEur')}
                  </AppText>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={styles.guidanceCard}>
            <Ionicons color={colors.tasklyBlue600} name="shield-checkmark-outline" size={18} />
            <View style={styles.cardCopy}>
              <AppText variant="bodyStrong">{t('budgetGuidanceTitle')}</AppText>
              <AppText color={colors.slate700} style={styles.cardBody}>
                {t('budgetGuidanceBody')}
              </AppText>
            </View>
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      const isFurnitureAssembly = selectedCategory?.slug === 'furniture_assembly';
      return (
        <View style={styles.cardStack}>
          <Field
            errorText={getFieldError('title')}
            label={t('title')}
            onChangeText={(value) => {
              setTitle(value);
              clearFieldError('title');
            }}
            placeholder={t('titlePlaceholder')}
            value={title}
          />
          <Field
            errorText={getFieldError('description')}
            helperText={descriptionHelper}
            label={t('description')}
            maxLength={catalog?.rules.maxDescriptionLength}
            multiline
            onChangeText={(value) => {
              setDescription(value);
              clearFieldError('description');
            }}
            placeholder={t('detailsPlaceholder')}
            value={description}
          />
          {isFurnitureAssembly ? (
            <View style={styles.scopeSection}>
              <AppText style={styles.fieldLabel}>Scope confirmation</AppText>
              <AppText color={colors.slate700} style={styles.cardBody}>
                Confirm the following so Taskly can match the right Tasker.
              </AppText>
              <ScopeCheckboxRow
                checked={assemblyPartsAvailable}
                hasError={!!getFieldError('assemblyPartsAvailable')}
                label="All required parts are available."
                onPress={() => {
                  setAssemblyPartsAvailable((v) => !v);
                  clearFieldError('assemblyPartsAvailable');
                }}
              />
              <ScopeCheckboxRow
                checked={assemblyInstructionsAvailable}
                hasError={!!getFieldError('assemblyInstructionsAvailable')}
                label="Instruction manual is available if possible."
                onPress={() => {
                  setAssemblyInstructionsAvailable((v) => !v);
                  clearFieldError('assemblyInstructionsAvailable');
                }}
              />
              <ScopeCheckboxRow
                checked={assemblyItemUnassembled}
                hasError={!!getFieldError('assemblyItemUnassembled')}
                label="Item is new/unassembled unless stated otherwise."
                onPress={() => {
                  setAssemblyItemUnassembled((v) => !v);
                  clearFieldError('assemblyItemUnassembled');
                }}
              />
              <ScopeCheckboxRow
                checked={assemblyAreaClear}
                hasError={!!getFieldError('assemblyAreaClear')}
                label="Assembly area is clear and accessible."
                onPress={() => {
                  setAssemblyAreaClear((v) => !v);
                  clearFieldError('assemblyAreaClear');
                }}
              />
              {(getFieldError('assemblyPartsAvailable') ||
                getFieldError('assemblyInstructionsAvailable') ||
                getFieldError('assemblyItemUnassembled') ||
                getFieldError('assemblyAreaClear')) ? (
                <AppText color={colors.danger600} variant="small">
                  Please confirm all scope items before continuing.
                </AppText>
              ) : null}
            </View>
          ) : null}

          {selectedCategory?.slug === 'general_mounting' ? (
            <View style={styles.scopeSection}>
              <AppText style={styles.fieldLabel}>Mounting type</AppText>
              <ScopeOptionGroup
                options={[
                  { value: 'standard_mounting', label: 'Standard mounting' },
                  { value: 'tv_mounting', label: 'TV mounting' },
                ]}
                value={mountingType}
                onSelect={(v) => {
                  setMountingType(v as 'standard_mounting' | 'tv_mounting');
                  setMountingTvSizeBand(null);
                  setMountingTvBracketAvailable(null);
                  setMountingCableConcealmentRequested(null);
                }}
              />

              <AppText style={styles.fieldLabel}>Wall / material type</AppText>
              <ScopeOptionGroup
                options={[
                  { value: 'drywall', label: 'Drywall' },
                  { value: 'brick', label: 'Brick' },
                  { value: 'concrete', label: 'Concrete' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                value={mountingWallType ?? ''}
                onSelect={(v) => {
                  setMountingWallType(v as 'drywall' | 'brick' | 'concrete' | 'unknown');
                  clearFieldError('mountingWallType');
                }}
              />
              {getFieldError('mountingWallType') ? (
                <AppText color={colors.danger600} variant="small">
                  {getFieldError('mountingWallType')}
                </AppText>
              ) : null}

              <Field
                errorText={getFieldError('mountingItemCount')}
                keyboardType="numeric"
                label="Item count"
                onChangeText={(v) => {
                  setMountingItemCount(v);
                  clearFieldError('mountingItemCount');
                }}
                placeholder="e.g. 2"
                value={mountingItemCount}
              />

              {mountingType === 'tv_mounting' ? (
                <View style={styles.scopeSubsection}>
                  <AppText style={styles.fieldLabel}>TV size</AppText>
                  <ScopeOptionGroup
                    options={[
                      { value: 'up_to_43', label: 'Up to 43"' },
                      { value: '44_to_65', label: '44–65"' },
                      { value: '65_plus', label: '65"+' },
                    ]}
                    value={mountingTvSizeBand ?? ''}
                    onSelect={(v) => {
                      setMountingTvSizeBand(v as 'up_to_43' | '44_to_65' | '65_plus');
                      clearFieldError('mountingTvSizeBand');
                    }}
                  />
                  {getFieldError('mountingTvSizeBand') ? (
                    <AppText color={colors.danger600} variant="small">
                      {getFieldError('mountingTvSizeBand')}
                    </AppText>
                  ) : null}

                  <AppText style={styles.fieldLabel}>Bracket available</AppText>
                  <ScopeOptionGroup
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    value={mountingTvBracketAvailable === null ? '' : String(mountingTvBracketAvailable)}
                    onSelect={(v) => {
                      setMountingTvBracketAvailable(v === 'true');
                      clearFieldError('mountingTvBracketAvailable');
                    }}
                  />
                  {getFieldError('mountingTvBracketAvailable') ? (
                    <AppText color={colors.danger600} variant="small">
                      {getFieldError('mountingTvBracketAvailable')}
                    </AppText>
                  ) : null}

                  <AppText style={styles.fieldLabel}>Cable concealment requested</AppText>
                  <ScopeOptionGroup
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    value={mountingCableConcealmentRequested === null ? '' : String(mountingCableConcealmentRequested)}
                    onSelect={(v) => {
                      setMountingCableConcealmentRequested(v === 'true');
                      clearFieldError('mountingCableConcealmentRequested');
                    }}
                  />
                  {getFieldError('mountingCableConcealmentRequested') ? (
                    <AppText color={colors.danger600} variant="small">
                      {getFieldError('mountingCableConcealmentRequested')}
                    </AppText>
                  ) : null}
                </View>
              ) : null}

              <AppText style={styles.fieldLabel}>Checklist confirmation</AppText>
              <ScopeCheckboxRow
                checked={mountingChecklistItemReady}
                hasError={!!getFieldError('mountingChecklistItemReady')}
                label="Item and mounting hardware are ready."
                onPress={() => {
                  setMountingChecklistItemReady((v) => !v);
                  clearFieldError('mountingChecklistItemReady');
                }}
              />
              <ScopeCheckboxRow
                checked={mountingChecklistWallSurfaceSelected}
                hasError={!!getFieldError('mountingChecklistWallSurfaceSelected')}
                label="Wall/material type is selected."
                onPress={() => {
                  setMountingChecklistWallSurfaceSelected((v) => !v);
                  clearFieldError('mountingChecklistWallSurfaceSelected');
                }}
              />
              <ScopeCheckboxRow
                checked={mountingChecklistMeasurementsChecked}
                hasError={!!getFieldError('mountingChecklistMeasurementsChecked')}
                label="Measurements and placement are checked."
                onPress={() => {
                  setMountingChecklistMeasurementsChecked((v) => !v);
                  clearFieldError('mountingChecklistMeasurementsChecked');
                }}
              />
              {(getFieldError('mountingChecklistItemReady') ||
                getFieldError('mountingChecklistWallSurfaceSelected') ||
                getFieldError('mountingChecklistMeasurementsChecked')) ? (
                <AppText color={colors.danger600} variant="small">
                  Please confirm all checklist items before continuing.
                </AppText>
              ) : null}
            </View>
          ) : null}

          {selectedCategory?.slug === 'light_electrical' ? (
            <View style={styles.scopeSection}>
              <View style={styles.electricalWarningBanner}>
                <Ionicons color={colors.warning600} name="warning-outline" size={16} />
                <AppText color={colors.warning600} style={styles.electricalWarningText}>
                  This service covers replacement at an existing point only. New wiring or moving points is not included.
                </AppText>
              </View>
              <ScopeCheckboxRow
                checked={electricalReplacementAtExistingPoint}
                hasError={!!getFieldError('electricalReplacementAtExistingPoint')}
                label="I confirm this is replacement work at an existing point."
                onPress={() => {
                  setElectricalReplacementAtExistingPoint((v) => !v);
                  clearFieldError('electricalReplacementAtExistingPoint');
                }}
              />
              <AppText style={styles.fieldLabel}>Checklist</AppText>
              <ScopeCheckboxRow
                checked={electricalChecklistReplacementOnly}
                hasError={!!getFieldError('electricalChecklistReplacementOnly')}
                label="This is replacement at an existing point only."
                onPress={() => {
                  setElectricalChecklistReplacementOnly((v) => !v);
                  clearFieldError('electricalChecklistReplacementOnly');
                }}
              />
              <ScopeCheckboxRow
                checked={electricalChecklistPowerAccess}
                hasError={!!getFieldError('electricalChecklistPowerAccess')}
                label="Power can be safely turned off and accessed."
                onPress={() => {
                  setElectricalChecklistPowerAccess((v) => !v);
                  clearFieldError('electricalChecklistPowerAccess');
                }}
              />
              <ScopeCheckboxRow
                checked={electricalChecklistNoNewWiring}
                hasError={!!getFieldError('electricalChecklistNoNewWiring')}
                label="No new wiring or moving points is required."
                onPress={() => {
                  setElectricalChecklistNoNewWiring((v) => !v);
                  clearFieldError('electricalChecklistNoNewWiring');
                }}
              />
              {(getFieldError('electricalReplacementAtExistingPoint') ||
                getFieldError('electricalChecklistReplacementOnly') ||
                getFieldError('electricalChecklistPowerAccess') ||
                getFieldError('electricalChecklistNoNewWiring')) ? (
                <AppText color={colors.danger600} variant="small">
                  Please confirm all items before continuing.
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.cardStack}>
          <View style={styles.photoBox}>
            <View style={styles.photoHeader}>
              <View>
                <AppText style={styles.cardTitle}>{t('addPhotos')}</AppText>
                <AppText color={colors.slate700} style={styles.cardBody}>
                  {t('photosAttachedOnSubmit')}
                </AppText>
              </View>
              <StatusBadge label={`${images.length}/${maxImages}`} tone="core" />
            </View>
            {images.length ? (
              <View style={styles.photoGrid}>
                {images.map((image) => (
                  <View key={image.id} style={styles.photoPreviewCard}>
                    <Image source={{ uri: image.compressedUri || image.uri }} style={styles.photoPreview} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveImage(image.id)}
                      style={styles.photoRemove}>
                      <Ionicons color={colors.white} name="close" size={14} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.photoEmpty}>
                <Ionicons color={colors.tasklyBlue600} name="images-outline" size={22} />
                <AppText color={colors.slate700} style={styles.cardBody}>
                  {t('postTaskPhotosBody')}
                </AppText>
              </View>
            )}
            {imageErrorMessage ? (
              <AppText color={colors.danger600} variant="small">
                {imageErrorMessage}
              </AppText>
            ) : null}
            <AppButton
              disabled={isProcessingImages || images.length >= maxImages}
              loading={isProcessingImages}
              onPress={handlePickImages}
              variant="outline">
              {images.length >= maxImages ? t('photoLimitReached') : t('addPhotos')}
            </AppButton>
          </View>
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.cardStack}>
          <View style={styles.citySection}>
            <AppText variant="small">{t('chooseCity')}</AppText>
            <View style={styles.optionGrid}>
              {catalog?.cities.map((city) => {
                const selected = selectedCityId === city.id;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={city.id}
                    onPress={() => {
                      setSelectedCityId(city.id);
                      clearFieldError('cityId');
                    }}
                    style={({ pressed }) => [
                      styles.cityChip,
                      selected ? styles.cityChipSelected : null,
                      { opacity: pressed ? 0.86 : 1 },
                    ]}>
                    <AppText
                      color={selected ? colors.tasklyBlue600 : colors.slate700}
                      variant="small">
                      {getLocalizedCityName(city, locale)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {getFieldError('cityId') ? (
              <AppText color={colors.danger600} variant="small">
                {getFieldError('cityId')}
              </AppText>
            ) : null}
          </View>
          <Field
            errorText={getFieldError('address')}
            label={t('address')}
            onChangeText={(value) => {
              setSelectedAddress(value);
              setAddress(value);
              clearFieldError('address');
            }}
            placeholder={t('addressPlaceholder')}
            value={selectedAddress}
          />
          <View style={styles.mapCard}>
            <MapView
              initialRegion={{
                latitude: DEFAULT_TASK_LOCATION.lat,
                longitude: DEFAULT_TASK_LOCATION.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              onPress={handleMapPress}
              style={styles.mapView}>
              <Marker coordinate={{ latitude: selectedLatitude, longitude: selectedLongitude }} />
            </MapView>
          </View>
          <AppText color={colors.slate500} style={styles.mapHelper} variant="caption">
            Tap the map to pin your service location
          </AppText>
          <View style={styles.fieldRow}>
            <View style={[styles.field, styles.fieldHalf]}>
              <AppText style={styles.fieldLabel}>{t('scheduleDate')}</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => [
                  styles.scheduleDateButton,
                  getFieldError('scheduleDate') ? styles.inputError : null,
                  { opacity: pressed ? 0.86 : 1 },
                ]}>
                <Ionicons color={colors.tasklyBlue600} name="calendar-outline" size={18} />
                <AppText
                  color={scheduleDate ? colors.navy900 : colors.slate500}
                  style={styles.scheduleDateValue}>
                  {scheduleDate
                    ? selectedScheduleDate.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : scheduleCopy.chooseDate}
                </AppText>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  minimumDate={parseIsoDate(getTodayIsoDate()) ?? new Date()}
                  mode="date"
                  onChange={handleScheduleDateChange}
                  value={selectedScheduleDate}
                />
              ) : null}
              {getFieldError('scheduleDate') ? (
                <AppText color={colors.danger600} variant="small">
                  {getFieldError('scheduleDate')}
                </AppText>
              ) : (
                <AppText color={colors.slate500} variant="small">
                  {scheduleCopy.dateHelper}
                </AppText>
              )}
            </View>
            <Field
              containerStyle={styles.fieldHalf}
              errorText={getFieldError('estimatedTime')}
              label={t('estimatedTime')}
              onChangeText={(value) => {
                setEstimatedTime(value);
                clearFieldError('estimatedTime');
              }}
              placeholder={t('estimatedTimePlaceholder')}
              value={estimatedTime}
            />
          </View>
          <View style={styles.scheduleSelectorCard}>
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleSectionHeader}>
                <AppText style={styles.fieldLabel}>{t('startTime')}</AppText>
                {startTime ? <StatusBadge label={startTime} tone="core" /> : null}
              </View>
              {selectedDateRelation === 'today' && availableStartTimes.length === 0 ? (
                <View style={styles.scheduleWarning}>
                  <Ionicons color={colors.warning600} name="information-circle-outline" size={16} />
                  <AppText color={colors.slate700} style={styles.scheduleWarningText} variant="small">
                    {scheduleCopy.noSlotsToday}
                  </AppText>
                </View>
              ) : null}
              {scheduleDate ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={availableStartTimes.length === 0}
                  onPress={() => setTimePickerTarget('start')}
                  style={({ pressed }) => [
                    styles.timeSelectField,
                    availableStartTimes.length === 0 ? styles.timeSelectFieldDisabled : null,
                    { opacity: pressed ? 0.86 : 1 },
                  ]}>
                  <AppText
                    color={startTime ? colors.navy900 : colors.slate500}
                    style={styles.timeSelectValue}>
                    {startTime || t('startTime')}
                  </AppText>
                  <Ionicons color={colors.slate500} name="chevron-down" size={18} />
                </Pressable>
              ) : (
                <AppText color={colors.slate500} variant="small">
                  {scheduleCopy.dateHelper}
                </AppText>
              )}
              {getFieldError('startTime') ? (
                <AppText color={colors.danger600} variant="small">
                  {getFieldError('startTime')}
                </AppText>
              ) : null}
            </View>

            <View style={[styles.scheduleSection, !startTime ? styles.scheduleSectionDisabled : null]}>
              <View style={styles.scheduleSectionHeader}>
                <AppText style={styles.fieldLabel}>{t('endTime')}</AppText>
                {endTime ? <StatusBadge label={endTime} tone="core" /> : null}
              </View>
              {startTime ? (
                availableEndTimes.length ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTimePickerTarget('end')}
                    style={({ pressed }) => [
                      styles.timeSelectField,
                      { opacity: pressed ? 0.86 : 1 },
                    ]}>
                    <AppText
                      color={endTime ? colors.navy900 : colors.slate500}
                      style={styles.timeSelectValue}>
                      {endTime || t('endTime')}
                    </AppText>
                    <Ionicons color={colors.slate500} name="chevron-down" size={18} />
                  </Pressable>
                ) : (
                  <AppText color={colors.slate500} variant="small">
                    {scheduleCopy.noEndSlots}
                  </AppText>
                )
              ) : (
                <AppText color={colors.slate500} variant="small">
                  {scheduleCopy.endHelper}
                </AppText>
              )}
              {getFieldError('endTime') ? (
                <AppText color={colors.danger600} variant="small">
                  {getFieldError('endTime')}
                </AppText>
              ) : null}
            </View>
          </View>
          <Modal
            animationType="slide"
            onRequestClose={() => setTimePickerTarget(null)}
            transparent
            visible={timePickerTarget !== null}>
            <Pressable style={styles.timePickerBackdrop} onPress={() => setTimePickerTarget(null)}>
              <Pressable style={styles.timePickerSheet}>
                <View style={styles.timePickerHeader}>
                  <AppText style={styles.cardTitle}>
                    {timePickerTarget === 'start' ? t('startTime') : t('endTime')}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTimePickerTarget(null)}
                    style={styles.timePickerClose}>
                    <Ionicons color={colors.slate700} name="close" size={18} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.timePickerList}>
                  {(timePickerTarget === 'start' ? availableStartTimes : availableEndTimes).map((option) => {
                    const selected = timePickerTarget === 'start' ? startTime === option : endTime === option;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={option}
                        onPress={() => {
                          if (timePickerTarget === 'start') {
                            handleStartTimeSelect(option);
                            return;
                          }

                          handleEndTimeSelect(option);
                        }}
                        style={[
                          styles.timePickerOption,
                          selected ? styles.timePickerOptionSelected : null,
                        ]}>
                        <AppText
                          color={selected ? colors.tasklyBlue600 : colors.navy900}
                          style={styles.timePickerOptionText}>
                          {option}
                        </AppText>
                        {selected ? <Ionicons color={colors.tasklyBlue600} name="checkmark-circle" size={18} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      );
    }

    return (
      <View style={styles.cardStack}>
        {missingFieldLabels.length ? (
          <View style={styles.reviewNotice}>
            <Ionicons color={colors.warning600} name="information-circle-outline" size={18} />
            <View style={styles.cardCopy}>
              <AppText variant="bodyStrong">{t('calmMissingFields')}</AppText>
              <View style={styles.validationList}>
                {missingFieldLabels.map((label) => (
                  <View key={label} style={styles.validationPill}>
                    <AppText color={colors.slate700} variant="small">
                      {label}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
        <View style={styles.summaryCard}>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="construct-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('selectedService')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>
              {selectedCategory ? getLocalizedCategoryName(selectedCategory, locale) : '-'}
            </AppText>
          </View>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="calendar-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('scheduleDate')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>
              {reviewScheduleValue || '-'}
            </AppText>
          </View>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="location-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('city')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>
              {selectedCity ? getLocalizedCityName(selectedCity, locale) : '-'}
            </AppText>
          </View>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="navigate-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('address')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>{address || '-'}</AppText>
          </View>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="images-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('photos')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>
              {images.length ? String(images.length) : t('noPhotosAdded')}
            </AppText>
          </View>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.slate500} name="document-text-outline" size={16} />
              <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
                {t('title')}
              </AppText>
            </View>
            <AppText style={styles.reviewSummaryValue}>{title || '-'}</AppText>
          </View>
          <View style={styles.reviewSummaryDetails}>
            <AppText color={colors.slate700} style={styles.reviewSummaryLabelText}>
              {t('description')}
            </AppText>
            <AppText style={styles.reviewSummaryDetailsText}>{description || '-'}</AppText>
          </View>
          {selectedCategory?.slug === 'general_mounting' ? (
            <View style={styles.scopeReviewSection}>
              <AppText style={styles.fieldLabel}>Scope summary</AppText>
              <View style={styles.scopeReviewItem}>
                <Ionicons color={colors.tasklyBlue600} name="layers-outline" size={16} />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  {mountingType === 'tv_mounting' ? 'TV mounting' : 'Standard mounting'}
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons color={colors.tasklyBlue600} name="construct-outline" size={16} />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Wall: {mountingWallType ?? '-'}
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons color={colors.tasklyBlue600} name="list-outline" size={16} />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Items: {mountingItemCount || '-'}
                </AppText>
              </View>
              {mountingType === 'tv_mounting' ? (
                <>
                  <View style={styles.scopeReviewItem}>
                    <Ionicons color={colors.tasklyBlue600} name="tv-outline" size={16} />
                    <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                      TV size: {mountingTvSizeBand === 'up_to_43' ? 'Up to 43"' : mountingTvSizeBand === '44_to_65' ? '44–65"' : mountingTvSizeBand === '65_plus' ? '65"+' : '-'}
                    </AppText>
                  </View>
                  <View style={styles.scopeReviewItem}>
                    <Ionicons color={colors.tasklyBlue600} name="albums-outline" size={16} />
                    <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                      Bracket available: {mountingTvBracketAvailable === null ? '-' : mountingTvBracketAvailable ? 'Yes' : 'No'}
                    </AppText>
                  </View>
                  <View style={styles.scopeReviewItem}>
                    <Ionicons color={colors.tasklyBlue600} name="git-branch-outline" size={16} />
                    <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                      Cable concealment: {mountingCableConcealmentRequested === null ? '-' : mountingCableConcealmentRequested ? 'Yes' : 'No'}
                    </AppText>
                  </View>
                </>
              ) : null}
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={mountingChecklistItemReady ? colors.success600 : colors.warning600}
                  name={mountingChecklistItemReady ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Item and mounting hardware are ready.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={mountingChecklistWallSurfaceSelected ? colors.success600 : colors.warning600}
                  name={mountingChecklistWallSurfaceSelected ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Wall/material type is selected.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={mountingChecklistMeasurementsChecked ? colors.success600 : colors.warning600}
                  name={mountingChecklistMeasurementsChecked ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Measurements and placement are checked.
                </AppText>
              </View>
            </View>
          ) : null}
          {selectedCategory?.slug === 'furniture_assembly' ? (
            <View style={styles.scopeReviewSection}>
              <AppText style={styles.fieldLabel}>Scope confirmation</AppText>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={assemblyPartsAvailable ? colors.success600 : colors.warning600}
                  name={assemblyPartsAvailable ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  All required parts are available.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={assemblyInstructionsAvailable ? colors.success600 : colors.warning600}
                  name={assemblyInstructionsAvailable ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Instruction manual is available if possible.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={assemblyItemUnassembled ? colors.success600 : colors.warning600}
                  name={assemblyItemUnassembled ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Item is new/unassembled unless stated otherwise.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={assemblyAreaClear ? colors.success600 : colors.warning600}
                  name={assemblyAreaClear ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Assembly area is clear and accessible.
                </AppText>
              </View>
            </View>
          ) : null}
          {selectedCategory?.slug === 'light_electrical' ? (
            <View style={styles.scopeReviewSection}>
              <View style={styles.scopeReviewItem}>
                <Ionicons color={colors.warning600} name="warning-outline" size={16} />
                <AppText color={colors.warning600} style={styles.electricalWarningText}>
                  Safety restriction: replacement at existing point only.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={electricalReplacementAtExistingPoint ? colors.success600 : colors.warning600}
                  name={electricalReplacementAtExistingPoint ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  I confirm this is replacement work at an existing point.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={electricalChecklistReplacementOnly ? colors.success600 : colors.warning600}
                  name={electricalChecklistReplacementOnly ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  This is replacement at an existing point only.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={electricalChecklistPowerAccess ? colors.success600 : colors.warning600}
                  name={electricalChecklistPowerAccess ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  Power can be safely turned off and accessed.
                </AppText>
              </View>
              <View style={styles.scopeReviewItem}>
                <Ionicons
                  color={electricalChecklistNoNewWiring ? colors.success600 : colors.warning600}
                  name={electricalChecklistNoNewWiring ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                />
                <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
                  No new wiring or moving points is required.
                </AppText>
              </View>
            </View>
          ) : null}
          <View style={styles.reviewSummaryDivider} />
          <View style={styles.reviewTotalRow}>
            <View style={styles.reviewSummaryLabel}>
              <Ionicons color={colors.navy900} name="card-outline" size={18} />
              <AppText style={styles.reviewTotalLabel}>{t('budget')}</AppText>
            </View>
            <AppText style={styles.reviewTotalValue}>{budget ? `€${budget}` : '-'}</AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          onPress={() => {
            setReviewConfirmed((value) => !value);
            clearFieldError('reviewConfirm');
          }}
          style={({ pressed }) => [styles.confirmRow, { opacity: pressed ? 0.82 : 1 }]}>
          <View style={[styles.checkbox, reviewConfirmed ? styles.checkboxSelected : null]}>
            {reviewConfirmed ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
          </View>
          <AppText color={colors.slate700} style={styles.confirmText}>
            {t('reviewConfirmTask')}
          </AppText>
        </Pressable>
        {getFieldError('reviewConfirm') ? (
          <AppText color={colors.danger600} variant="small">
            {getFieldError('reviewConfirm')}
          </AppText>
        ) : null}
      </View>
    );
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TasklyLogoText wordmarkOnly />
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons color={colors.slate700} name="close" size={22} />
            </Pressable>
          </View>
          <View style={styles.titleBlock}>
            <AppText style={styles.bookingTitle}>{t('structuredBooking')}</AppText>
            <AppText color={colors.slate700} style={styles.stepSubtitle}>
              {formatStepIndicator(activeStep)}
            </AppText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <ScrollView
            contentContainerStyle={styles.stepTabs}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {steps.map((step) => {
              const selected = step.id === currentStep;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={step.id}
                  onPress={() => setCurrentStep(step.id)}
                  style={[styles.stepPill, selected ? styles.stepPillSelected : null]}>
                  <AppText
                    color={selected ? colors.white : colors.slate700}
                    style={styles.stepPillLabel}>
                    {step.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepCard}>
            <View style={styles.stepIntro}>
              <AppText color={colors.tasklyBlue600} style={styles.stepTitle}>
                {activeStep.title}
              </AppText>
              <AppText color={colors.slate700} style={styles.stepBody}>
                {activeStep.body}
              </AppText>
            </View>
            {renderStepContent()}
          </View>

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
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <AppButton disabled={isBusy} onPress={handleBack} style={styles.footerButton} tone="neutral" variant="outline">
              {currentStep === 1 ? t('cancel') : t('back')}
            </AppButton>
            <AppButton
              disabled={isBusy || isLoading || Boolean(errorMessage)}
              loading={isBusy}
              onPress={currentStep === STEP_TOTAL ? handleSubmit : handleContinue}
              style={styles.footerButton}>
              {currentStep === STEP_TOTAL ? t('submitTask') : t('continueAction')}
            </AppButton>
          </View>
          <AppText color={colors.slate700} style={styles.footerNote} variant="small">
            {t('postTaskFooterNote')}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

type FieldProps = {
  containerStyle?: StyleProp<ViewStyle>;
  errorText?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  value: string;
};

type ScopeOptionGroupOption = { label: string; value: string };

function ScopeOptionGroup({
  onSelect,
  options,
  value,
}: {
  onSelect: (value: string) => void;
  options: ScopeOptionGroupOption[];
  value: string;
}) {
  return (
    <View style={styles.scopeOptionGroup}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.scopeOptionChip,
              selected ? styles.scopeOptionChipSelected : null,
              { opacity: pressed ? 0.82 : 1 },
            ]}>
            <AppText
              color={selected ? colors.tasklyBlue600 : colors.slate700}
              style={styles.scopeOptionChipText}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScopeCheckboxRow({
  checked,
  hasError,
  label,
  onPress,
}: {
  checked: boolean;
  hasError: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      onPress={onPress}
      style={({ pressed }) => [
        styles.scopeCheckboxRow,
        hasError ? styles.scopeCheckboxRowError : null,
        { opacity: pressed ? 0.82 : 1 },
      ]}>
      <View style={[styles.checkbox, checked ? styles.checkboxSelected : null]}>
        {checked ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
      </View>
      <AppText color={colors.slate700} style={styles.scopeCheckboxLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Field({
  containerStyle,
  errorText,
  helperText,
  keyboardType = 'default',
  label,
  maxLength,
  multiline = false,
  onChangeText,
  placeholder,
  prefix,
  value,
}: FieldProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <View style={[styles.inputWrap, errorText ? styles.inputError : null]}>
        {prefix ? (
          <AppText color={colors.slate500} variant="bodyStrong">
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slate500}
          style={[styles.input, multiline ? styles.textArea : null]}
          value={value}
        />
      </View>
      {errorText ? (
        <AppText color={colors.danger600} variant="small">
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText color={colors.slate500} variant="small">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bookingTitle: {
    color: colors.navy900,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  budgetEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  budgetHeroCopy: {
    gap: 3,
  },
  budgetHeroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  budgetRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetRecommendedDot: {
    backgroundColor: colors.white,
    borderColor: '#9DB8D6',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 10,
    marginLeft: -5,
    position: 'absolute',
    top: -3,
    width: 10,
  },
  budgetScroller: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  budgetSelectedThumb: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 18,
    marginLeft: -9,
    position: 'absolute',
    top: -6,
    width: 18,
  },
  budgetTouchArea: {
    justifyContent: 'center',
    minHeight: 34,
  },
  budgetTrack: {
    backgroundColor: '#D8E5F3',
    borderRadius: radius.pill,
    height: 7,
    justifyContent: 'center',
    overflow: 'visible',
  },
  budgetTrackBlock: {
    gap: spacing.sm,
  },
  budgetTrackFill: {
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: '100%',
  },
  budgetValue: {
    color: colors.navy900,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  budgetValueChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.pill,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  budgetValueChipRecommended: {
    borderColor: '#9DB8D6',
  },
  budgetValueChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardCopy: {
    flex: 1,
    gap: 3,
  },
  cardStack: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.navy900,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
  },
  cityChip: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  cityChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  citySection: {
    gap: spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  confirmRow: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  confirmText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  field: {
    gap: 6,
  },
  fieldHalf: {
    flex: 1,
    minWidth: 136,
  },
  fieldLabel: {
    color: colors.navy900,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    backgroundColor: '#F7FAFD',
    borderColor: '#DFE8F2',
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  footerButton: {
    flex: 1,
    minHeight: 42,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerNote: {
    textAlign: 'center',
  },
  guidanceCard: {
    alignItems: 'flex-start',
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE9F7',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    backgroundColor: '#FBFDFF',
    borderBottomColor: '#E4EBF3',
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  iconTile: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconTileSelected: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
  },
  input: {
    color: colors.navy900,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 22,
    padding: 0,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapHelper: {
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  mapView: {
    height: 200,
    width: '100%',
  },
  moneyCard: {
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE9F7',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoBox: {
    backgroundColor: '#FBFDFF',
    borderColor: '#DDE6F0',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  photoEmpty: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  photoPreview: {
    aspectRatio: 1,
    backgroundColor: colors.slate100,
    borderRadius: radius.md,
    width: '100%',
  },
  photoPreviewCard: {
    flexBasis: '31%',
    minWidth: 90,
    position: 'relative',
  },
  photoRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: radius.pill,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
  },
  progressFill: {
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: '#D8E5F3',
    borderRadius: radius.pill,
    height: 5,
    overflow: 'hidden',
  },
  recommendedPill: {
    backgroundColor: colors.white,
    borderColor: '#9DB8D6',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  recommendedPillText: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  scheduleDateButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scheduleDateValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  scheduleSection: {
    gap: spacing.sm,
  },
  scheduleSectionDisabled: {
    opacity: 0.58,
  },
  scheduleSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleSelectorCard: {
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE9F7',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  scheduleWarning: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  scheduleWarningText: {
    flex: 1,
  },
  reviewNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  reviewSummaryDetails: {
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: spacing.sm,
  },
  reviewSummaryDetailsText: {
    color: colors.navy900,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewSummaryDivider: {
    backgroundColor: '#E6EBF0',
    height: 1,
  },
  reviewSummaryLabel: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  reviewSummaryLabelText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewSummaryRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reviewSummaryValue: {
    color: colors.navy900,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'right',
  },
  reviewTotalLabel: {
    color: colors.navy900,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  reviewTotalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reviewTotalValue: {
    color: colors.navy900,
    flexShrink: 0,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'right',
  },
  screen: {
    backgroundColor: '#EEF3F8',
  },
  selectedServiceCard: {
    backgroundColor: '#F1F7FE',
    borderColor: 'rgba(90, 142, 199, 0.62)',
  },
  serviceCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FBFDFF',
    borderColor: '#DDE6F0',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 86,
    padding: spacing.md,
  },
  shell: {
    backgroundColor: '#F5F8FC',
    borderColor: '#DFE7F0',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    margin: spacing.sm,
    overflow: 'hidden',
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#E2EAF3',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  stepIntro: {
    gap: 4,
  },
  stepPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderColor: '#D9E3EE',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 34,
    minWidth: 84,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepPillLabel: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
    textAlign: 'center',
  },
  stepPillSelected: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  stepTabs: {
    gap: spacing.sm,
    paddingHorizontal: 1,
    paddingRight: spacing.md,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  summaryCard: {
    backgroundColor: '#FAFCFE',
    borderColor: '#DFE8F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryRow: {
    borderBottomColor: colors.slate100,
    borderBottomWidth: 1,
    gap: 3,
    paddingBottom: spacing.sm,
  },
  summaryValue: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  timeChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.pill,
    borderWidth: 1,
    minWidth: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  timeChipScroller: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  timeChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  timePickerBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerClose: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  timePickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerList: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  timePickerOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timePickerOptionSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  timePickerOptionText: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  timePickerSheet: {
    backgroundColor: '#F7FAFD',
    borderColor: '#DFE8F2',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: '72%',
    padding: spacing.md,
  },
  timeSelectField: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeSelectFieldDisabled: {
    backgroundColor: colors.slate50,
  },
  timeSelectValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  titleBlock: {
    gap: 2,
  },
  validationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  validationPill: {
    backgroundColor: colors.white,
    borderColor: '#FDE68A',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  scopeSection: {
    gap: spacing.sm,
  },
  scopeCheckboxRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  scopeCheckboxRowError: {
    borderColor: colors.danger600,
  },
  scopeCheckboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scopeReviewSection: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#D7E7FA',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  scopeReviewItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scopeOptionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scopeOptionChip: {
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  scopeOptionChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  scopeOptionChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  scopeSubsection: {
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE9F7',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  electricalWarningBanner: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  electricalWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
