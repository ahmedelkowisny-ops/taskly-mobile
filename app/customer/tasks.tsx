import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerTasks } from '@/src/lib/api/customer';
import { CustomerTasksResponse } from '@/src/lib/api/domain';
import { getMockCustomerTasksResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerTasksScreen() {
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const loadTasks = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData(getMockCustomerTasksResponse());
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

    const result = await getCustomerTasks(authToken);

    if (result.ok) {
      setData(result.data);
      setIsLoading(false);
      return;
    }

    setData(null);
    setIsUnauthorized(result.status === 401 || result.status === 403);
    setErrorMessage(
      result.status === 401 || result.status === 403
        ? 'Login is required to load your Core tasks.'
        : 'Could not load your Core tasks.',
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
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('myTasks')}</AppText>
        <AppText color={colors.slate700}>
          Track small fixed-scope tasks from the Customer Workspace.
        </AppText>
      </View>

      {isLoading ? (
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Loading" tone="core" />
          <AppText variant="sectionTitle">Loading Core tasks</AppText>
          <AppText color={colors.slate700}>Fetching your read-only task list from Taskly.</AppText>
        </AppCard>
      ) : null}

      {errorMessage || isUnauthorized ? (
        <AppCard accentColor={isUnauthorized ? colors.warning600 : colors.danger600}>
          <StatusBadge label={isUnauthorized ? 'Login required' : 'Backend unavailable'} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="sectionTitle">
            {isUnauthorized ? 'Core tasks need a real session' : 'Could not refresh Core tasks'}
          </AppText>
          <AppText color={colors.slate700}>
            {errorMessage || 'Retry the request or continue in demo mode while the backend is unavailable.'}
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
                {task.priceLabel}
                {task.scheduledStartAt ? ` - ${new Date(task.scheduledStartAt).toLocaleDateString()}` : ''}
              </AppText>
              <AppButton variant="outline">{task.nextAction.label}</AppButton>
            </AppCard>
          ))}
        </View>
      ) : data && !isLoading ? (
        <EmptyStateCard
          actionLabel={t('postTask')}
          body={data.emptyState.description}
          title={data.emptyState.title}
        />
      ) : null}

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label="OPEN" tone="core" />
          <StatusBadge label="PAYMENT PROTECTED" tone="success" />
        </View>
        <AppText variant="sectionTitle">{t('paymentProtected')}</AppText>
        <AppText color={colors.slate700}>
          Safe placeholder wording only: when payments are added, Taskly will show backend-provided payment protection status without duplicating payment rules in the app.
        </AppText>
      </AppCard>
    </Screen>
  );
}
