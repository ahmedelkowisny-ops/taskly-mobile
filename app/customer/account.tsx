import { Href, useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  AssistantGuideCard,
  ModeBadge,
  NotificationSettingsCard,
  SessionStatusCard,
  WorkspaceSwitchHint,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { getCustomerWorkspaceSummary } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;

export default function CustomerAccountScreen() {
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? getMockUserSession();

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>
          Customer Workspace settings, trust details, and notification preferences will live here.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Customer account" tone="core" />
        <AppText variant="sectionTitle">Customer Workspace access</AppText>
        <AppText color={colors.slate700}>{getCustomerWorkspaceSummary(session)}</AppText>
        <AppText color={colors.slate500} variant="caption">
          {status === 'authenticated' ? `${session.user.displayName} - ${session.user.email}` : 'Login or demo mode controls the account state shown here.'}
        </AppText>
      </AppCard>

      <SessionStatusCard compact onLoginPress={() => router.push(LOGIN_ROUTE)} />

      <NotificationSettingsCard workspace="customer" />

      <AssistantGuideCard
        body="Account screens should explain missing data, payment readiness, and trust steps inline without opening blocking popups."
        title="Account guidance"
      />

      <WorkspaceSwitchHint />

      <AppButton onPress={() => router.push('/customer/onboarding')} variant="outline">
        {t('setupCustomerWorkspace')}
      </AppButton>

      <AppButton onPress={() => router.push('/')} variant="ghost">
        {t('backToTaskly')}
      </AppButton>
    </Screen>
  );
}
