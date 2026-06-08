import { useFocusEffect } from '@react-navigation/native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerApprovedProProfile } from '@/src/lib/api/customer';
import type { CustomerApprovedProProfileResponse, CustomerUnlockedProPortfolioProject } from '@/src/lib/api/domain';
import { resolveApiMediaUrl } from '@/src/lib/api/media';
import { getMockCustomerProRequestDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerApprovedProProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proProfileId?: string; proRequestId?: string }>();
  const proProfileId = String(params.proProfileId || '');
  const proRequestId = String(params.proRequestId || '');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerApprovedProProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    setStateLabel(null);

    if (status === 'demo') {
      const detail = getMockCustomerProRequestDetailResponse('demo-pro-unlocked');
      const response = detail.proRequest.unlockedComparison?.responses.find((item) => item.proProfileId === proProfileId)
        || detail.proRequest.unlockedComparison?.responses[0];
      if (!response) {
        setData(null);
        setStateLabel(t('notFound'));
        setError(t('proProfileNotFound'));
        return;
      }
      setData({
        profile: {
          approvedCategoryLabels: [response.categoryLabel],
          businessType: t('independentPro'),
          cityCoverages: [{ cityLabel: response.cityLabel, isPrimary: true, travelRadiusKm: null }],
          invoiceAvailable: true,
          languages: ['Bulgarian', 'English'],
          quotePreference: t('quoteAfterReviewingPhotos'),
          rating: { average: 0, count: 0 },
          siteVisitPreference: response.siteVisitPolicy,
          teamSize: 2,
          warrantyNote: t('toBeConfirmed'),
        },
        proRequest: { id: proRequestId, title: detail.proRequest.title },
        response,
      });
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel(t('loginRequired'));
      setError(t('loginRequiredProRequestDetail'));
      return;
    }

    setIsLoading(true);
    const token = await getValidAccessToken();
    const result = token ? await getCustomerApprovedProProfile(proRequestId, proProfileId, token) : null;
    setIsLoading(false);

    if (result?.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    if (result && !result.ok && result.error.code === 'PRO_ACCESS_NOT_UNLOCKED') {
      setStateLabel(t('proProfileLocked'));
      setError(t('proProfileAvailableAfterUnlock'));
    } else if (result && !result.ok && result.status === 404) {
      setStateLabel(t('notFound'));
      setError(t('proProfileNotFound'));
    } else if (result && !result.ok && (result.status === 401 || result.status === 403)) {
      setStateLabel(t('loginRequired'));
      setError(t('loginRequiredProRequestDetail'));
    } else {
      setStateLabel(status === 'authenticated' ? t('backendUnavailable') : t('loginRequired'));
      setError(token ? t('couldNotLoadProProfile') : t('loginRequired'));
    }
  }, [getValidAccessToken, proProfileId, proRequestId, status]);

  useFocusEffect(useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  const openChat = useCallback(() => {
    const threadId = data?.response.proChat?.messageThreadId || data?.response.messageThreadId;
    if (!threadId || !data?.response.proChat?.capabilities.canRead) return;
    router.push(`/customer/messages/${encodeURIComponent(threadId)}` as Href);
  }, [data?.response, router]);

  return (
    <Screen contentStyle={styles.content}>
      <AppButton onPress={() => router.back()} variant="ghost">{t('backToComparison')}</AppButton>

      {isLoading ? <StateCard label={t('loading')} body={t('loadingProProfile')} /> : null}
      {error ? (
        <AppCard accentColor={colors.warning600} style={styles.card}>
          <StatusBadge label={stateLabel || t('currentStatus')} tone="warning" />
          <AppText color={colors.slate700}>{error}</AppText>
          <View style={styles.actions}>
            <AppButton onPress={loadProfile} variant="outline">{t('retry')}</AppButton>
            {status !== 'authenticated' ? <AppButton onPress={useDemoSession} variant="outline">{t('continueDemoMode')}</AppButton> : null}
          </View>
        </AppCard>
      ) : null}

      {data ? (
        <>
          <ProfileHeader data={data} />
          <ResponseSummary data={data} />
          <AboutAndWorkStyle data={data} />
          <Portfolio projects={data.response.portfolioProjects || []} />

          <AppCard accentColor={colors.tasklyBlue600} style={styles.card}>
            <AppText variant="cardTitle">{t('continueWithThisPro')}</AppText>
            <AppText color={colors.slate700}>{data.response.contactPolicyLabel}</AppText>
            {data.response.proChat?.capabilities.canRead ? (
              <AppButton onPress={openChat}>{t('openProChat')}</AppButton>
            ) : null}
            <AppButton onPress={() => router.back()} tone="pro" variant="outline">{t('backToComparison')}</AppButton>
          </AppCard>
        </>
      ) : null}
    </Screen>
  );
}

function ProfileHeader({ data }: { data: CustomerApprovedProProfileResponse }) {
  const response = data.response;
  const imageUrl = response.profileImageUrl ? resolveApiMediaUrl(response.profileImageUrl) : null;
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50} style={styles.card}>
      <View style={styles.profileRow}>
        {imageUrl ? (
          <Image accessibilityLabel={response.displayName} source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileFallback}><AppText style={styles.initial}>{response.displayName.slice(0, 1).toUpperCase()}</AppText></View>
        )}
        <View style={styles.profileText}>
          <StatusBadge label={response.profileVerifiedLabel} tone="success" />
          <AppText variant="screenTitle">{response.displayName}</AppText>
          {response.tradeName && response.tradeName !== response.displayName ? <AppText color={colors.slate700}>{response.tradeName}</AppText> : null}
        </View>
      </View>
      <AppText color={colors.slate700}>{data.proRequest.title}</AppText>
      <View style={styles.chips}>
        {data.profile.approvedCategoryLabels.map((label) => <Chip key={`category-${label}`} label={label} />)}
        {data.profile.cityCoverages.map((city) => <Chip key={`city-${city.cityLabel}`} label={city.cityLabel} />)}
      </View>
      <View style={styles.grid}>
        <Info label={t('yearsOfExperience')} value={response.yearsExperienceLabel || t('notSpecified')} />
        <Info label={t('portfolio')} value={String(response.portfolioCount)} />
        <Info label={t('rating')} value={data.profile.rating.count ? `${data.profile.rating.average.toFixed(1)} / 5 (${data.profile.rating.count})` : t('noRatingsYet')} />
        <Info label={t('approvedCategories')} value={String(data.profile.approvedCategoryLabels.length)} />
      </View>
    </AppCard>
  );
}

function ResponseSummary({ data }: { data: CustomerApprovedProProfileResponse }) {
  const response = data.response;
  const rows = [
    [t('roughQuote'), response.roughQuoteLabel],
    [t('availability'), response.availability],
    [t('siteVisitPolicy'), response.siteVisitPolicy],
    [t('materialsIncluded'), response.materialsIncluded],
    [t('whatIsIncluded'), response.includedNotes],
    [t('whatIsNotIncluded'), response.excludedNotes],
    [t('assumptions'), response.assumptions],
    [t('customerPreparation'), response.customerPreparationNotes],
  ].filter((row) => Boolean(row[1]));
  return (
    <AppCard style={styles.card}>
      <StatusBadge label={t('responseForThisRequest')} tone="pro" />
      <AppText variant="cardTitle">{t('responseSummary')}</AppText>
      {response.shortMessage ? <AppText color={colors.slate700}>{response.shortMessage}</AppText> : null}
      {rows.map(([label, value]) => <Info key={String(label)} label={String(label)} value={String(value)} />)}
    </AppCard>
  );
}

function AboutAndWorkStyle({ data }: { data: CustomerApprovedProProfileResponse }) {
  const profile = data.profile;
  return (
    <>
      <AppCard style={styles.card}>
        <AppText variant="cardTitle">{t('aboutThisPro')}</AppText>
        <AppText color={colors.slate700}>{data.response.profileSummary || t('noProIntroduction')}</AppText>
        <Info label={t('languages')} value={profile.languages.length ? profile.languages.join(', ') : t('notSpecified')} />
      </AppCard>
      <AppCard style={styles.card}>
        <AppText variant="cardTitle">{t('workStyle')}</AppText>
        <Info label={t('siteVisitPolicy')} value={profile.siteVisitPreference || t('notSpecified')} />
        <Info label={t('quoteFromPhotosPolicy')} value={profile.quotePreference || t('notSpecified')} />
        <Info label={t('businessType')} value={profile.businessType || t('notSpecified')} />
        <Info label={t('teamSize')} value={profile.teamSize ? String(profile.teamSize) : t('notSpecified')} />
        <Info label={t('invoiceAvailable')} value={profile.invoiceAvailable ? t('yes') : t('no')} />
        <Info label={t('warrantyNote')} value={profile.warrantyNote || t('notSpecified')} />
      </AppCard>
    </>
  );
}

function Portfolio({ projects }: { projects: CustomerUnlockedProPortfolioProject[] }) {
  return (
    <AppCard accentColor={colors.proOrange600} style={styles.card}>
      <AppText variant="cardTitle">{t('portfolio')}</AppText>
      <AppText color={colors.slate700}>{t('portfolioRealWorkExamples')}</AppText>
      {projects.length ? projects.map((project) => <PortfolioProject key={project.id} project={project} />) : <AppText color={colors.slate700}>{t('noPortfolioProjectsYet')}</AppText>}
    </AppCard>
  );
}

function PortfolioProject({ project }: { project: CustomerUnlockedProPortfolioProject }) {
  return (
    <View style={styles.project}>
      <AppText variant="bodyStrong">{project.title}</AppText>
      {project.description ? <AppText color={colors.slate700}>{project.description}</AppText> : null}
      <View style={styles.images}>
        {project.images.map((image) => (
          <View key={image.id} style={styles.projectImageWrap}>
            <Image accessibilityLabel={`${project.title} ${image.typeLabel}`} source={{ uri: resolveApiMediaUrl(image.url) }} style={styles.projectImage} />
            <AppText color={colors.slate500} variant="caption">{image.typeLabel}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {project.categoryLabel ? <Info label={t('category')} value={project.categoryLabel} /> : null}
        {project.cityLabel ? <Info label={t('city')} value={project.cityLabel} /> : null}
        {project.approximateDuration ? <Info label={t('duration')} value={project.approximateDuration} /> : null}
        {project.optionalPriceRange ? <Info label={t('priceRange')} value={project.optionalPriceRange} /> : null}
      </View>
    </View>
  );
}

function StateCard({ body, label }: { body: string; label: string }) {
  return <AppCard style={styles.card}><StatusBadge label={label} tone="pro" /><AppText color={colors.slate700}>{body}</AppText></AppCard>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><AppText color={colors.slate500} variant="small">{label}</AppText><AppText color={colors.slate700}>{value}</AppText></View>;
}

function Chip({ label }: { label: string }) {
  return <View style={styles.chip}><AppText color={colors.proOrangeTextDark} variant="small">{label}</AppText></View>;
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  card: { gap: spacing.md },
  chip: { backgroundColor: colors.white, borderColor: colors.proOrangeBorder, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  content: { paddingBottom: spacing.xxxl + 80 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  info: { backgroundColor: colors.slate50, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexGrow: 1, gap: spacing.xs, minWidth: '46%', padding: spacing.md },
  initial: { color: colors.proOrangeTextDark, fontSize: 24, fontWeight: '800' },
  profileFallback: { alignItems: 'center', backgroundColor: colors.proOrange50, borderRadius: radius.lg, height: 80, justifyContent: 'center', width: 80 },
  profileImage: { borderRadius: radius.lg, height: 80, width: 80 },
  profileRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  profileText: { flex: 1, gap: spacing.xs },
  project: { borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  projectImage: { borderRadius: radius.md, height: 120, width: 140 },
  projectImageWrap: { gap: spacing.xs },
});
