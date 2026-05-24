import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { ProviderCoreTasksResponse } from '@/src/lib/api/domain';
import { getMockProviderCoreTasksResponse } from '@/src/lib/api/mockApi';
import { getProviderCoreTasks } from '@/src/lib/api/provider';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderCoreTasksScreen() {
  const router = useRouter();
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<ProviderCoreTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadTasks = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockProviderCoreTasksResponse());
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

    const result = await getProviderCoreTasks(authToken);

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
        : 'Could not load Core task previews.',
    );
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerCore" />
        <AppText variant="screenTitle">{t('coreTasks')}</AppText>
        <AppText color={colors.slate700}>
          Approved Core Taskers see matching tasks by city and category inside the Provider Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading Core task previews</AppText>
          <AppText color={colors.slate700}>Fetching read-only Core tasks from the backend.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Core tasks need Provider access' : 'Could not refresh Core tasks'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry or continue in demo mode while the backend is unavailable.'}
          </AppText>
          <View style={{ gap: spacing.sm }}>
            <AppButton onPress={loadTasks} variant="outline">
              Retry
            </AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              Continue in demo mode
            </AppButton>
          </View>
        </AppCard>
      ) : null}

      {data?.tasks.length ? (
        <View style={{ gap: spacing.md }}>
          {data.tasks.map((task) => (
            <AppCard key={task.id} accentColor={colors.tasklyBlue600}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <StatusBadge label={task.statusLabel} tone="core" />
                <StatusBadge label={task.paymentStatusLabel} tone={task.paymentStatusLabel === 'Payment protected' ? 'success' : 'neutral'} />
              </View>
              <AppText variant="sectionTitle">{task.title}</AppText>
              <AppText color={colors.slate700}>
                {task.categoryLabel} - {task.cityLabel}
              </AppText>
              <AppText color={colors.slate700}>
                {task.priceLabel} - {task.customerPreviewLabel}
              </AppText>
              <AppButton
                onPress={() => router.push(`/provider/core-tasks/${task.id}` as Href)}
                variant="outline">
                View details
              </AppButton>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          body={data.emptyState.description}
          title={data.emptyState.title}
        />
      ) : null}

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label="Core Tasker" tone="core" />
          <StatusBadge label="Stripe verification" tone="warning" />
        </View>
        <AppText color={colors.slate700}>
          Stripe verification is shown here only as a Core payout readiness placeholder, not as Pro logic.
        </AppText>
      </AppCard>
    </Screen>
  );
}
