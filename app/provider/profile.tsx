import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderProfileResponse } from '@/src/lib/api/domain';
import { getMockProviderProfileResponse } from '@/src/lib/api/mockApi';
import { getProviderProfile } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCoreTaskerStatusLabel, getProStatusLabel } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadProfile = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderProfileResponse());
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const result = await getProviderProfile(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? 'Login or Provider Workspace access is required.'
        : 'Could not load provider profile status.',
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const profile = data?.profile;

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('profile')}</AppText>
        <AppText color={colors.slate700}>
          Provider Workspace profile areas for Taskly Taskers and Taskly Pro professionals.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.navy900}>
          <StatusBadge label="Loading" tone="neutral" />
          <AppText variant="sectionTitle">Loading provider profile</AppText>
          <AppText color={colors.slate700}>Loading your latest profile status.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Profile status needs Provider access' : 'Could not refresh profile status'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || t('retryOrContinueDemoBackendUnavailable')}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadProfile} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {profile ? (
        <AppCard>
          <StatusBadge label={status === 'demo' ? 'Demo profile' : 'Live profile'} tone={status === 'demo' ? 'neutral' : 'success'} />
          <AppText variant="sectionTitle">{profile.displayName}</AppText>
          <AppText color={colors.slate700}>{profile.profileStrengthLabel}</AppText>
          <AppText color={colors.slate700}>{profile.stripeStatusLabel}</AppText>
        </AppCard>
      ) : null}

      <AppCard accentColor={colors.tasklyBlue600}>
        <ModeBadge mode="providerCore" />
        <AppText variant="sectionTitle">Taskly Tasker profile</AppText>
        <AppText color={colors.slate700}>
          {profile ? getCoreTaskerStatusLabel(profile.coreTaskerStatus) : 'Skills, coverage area, and trust signals will appear here.'}
        </AppText>
        {profile?.coreCities.length ? <AppText color={colors.slate500}>Cities: {profile.coreCities.join(', ')}</AppText> : null}
        {profile?.coreCategories.length ? <AppText color={colors.slate500}>Categories: {profile.coreCategories.join(', ')}</AppText> : null}
      </AppCard>

      <AppCard accentColor={colors.proOrange600}>
        <ModeBadge mode="providerPro" />
        <AppText variant="sectionTitle">Pro professional profile</AppText>
        <AppText color={colors.slate700}>
          {profile ? getProStatusLabel(profile.proStatus) : 'Public phone and email remain hidden until the allowed unlock/contact flow.'}
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
        <AppText variant="sectionTitle">Provider account</AppText>
        <AppText color={colors.slate700}>
          Account remains available without crowding the Provider Workspace tab bar.
        </AppText>
        <AppButton onPress={() => router.push('/provider/account')} variant="outline">
          Open Account
        </AppButton>
        <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
          {t('startProviderWorkspace')}
        </AppButton>
      </AppCard>

      <AssistantGuideCard
        body="Taskly Tasker profile and Taskly Pro profile are separate sections. Pro-only setup should not depend on Stripe verification in this mobile foundation."
        title="Profile readiness"
        tone="pro"
      />

      <WorkspaceSwitchHint />
    </Screen>
  );
}
