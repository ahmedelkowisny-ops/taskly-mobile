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
import {
  getCoreTaskerStatusLabel,
  getProStatusLabel,
  getProviderModeSummary,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;

export default function ProviderAccountScreen() {
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? getMockUserSession();
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>{t('providerAccountIntro')}</AppText>
      </View>

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText variant="sectionTitle">{t('dualProviderWorkspace')}</AppText>
        <AppText color={colors.slate700}>{t('dualProviderWorkspaceBody')}</AppText>
        <AppText color={colors.slate500} variant="caption">
          {status === 'authenticated' ? `${session.user.displayName} - ${session.user.email}` : getProviderModeSummary(session)}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label={session.workspaceAccess.provider ? 'Provider access' : 'Provider setup'} tone={session.workspaceAccess.provider ? 'success' : 'warning'} />
          <StatusBadge label={status === 'demo' ? 'Demo mode' : status === 'authenticated' ? 'Signed in' : 'Login needed'} tone={status === 'authenticated' ? 'success' : 'neutral'} />
        </View>
      </AppCard>

      <SessionStatusCard compact onLoginPress={() => router.push(LOGIN_ROUTE)} />

      <NotificationSettingsCard workspace="provider" />

      <AppCard accentColor={colors.tasklyBlue600}>
        <ModeBadge mode="providerCore" />
        <AppText variant="sectionTitle">{t('tasklyAccountReadiness')}</AppText>
        <AppText color={colors.slate700}>{getCoreTaskerStatusLabel(coreTaskerStatus)}</AppText>
      </AppCard>

      <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
        <ModeBadge mode="providerPro" />
        <AppText variant="sectionTitle">{t('proAccountReadiness')}</AppText>
        <AppText color={colors.slate700}>{getProStatusLabel(proStatus)}</AppText>
      </AppCard>

      <AssistantGuideCard
        body={t('accountChecksBody')}
        title={t('accountChecks')}
      />

      <WorkspaceSwitchHint />

      <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
        {t('startProviderWorkspace')}
      </AppButton>

      <AppButton onPress={() => router.push('/')} variant="ghost">
        {t('backToTaskly')}
      </AppButton>
    </Screen>
  );
}
