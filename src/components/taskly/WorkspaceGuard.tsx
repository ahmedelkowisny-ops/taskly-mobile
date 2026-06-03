import { Href, usePathname, useRouter } from 'expo-router';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/src/lib/auth/useAuth';
import {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
  getRecommendedProviderNextAction,
  getWorkspaceEntryState,
} from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

import { AppButton, AppCard, AppText, Screen, StatusBadge } from '../ui';

type WorkspaceGuardProps = PropsWithChildren<{
  allowDemo?: boolean;
  workspace: 'customer' | 'provider';
}>;

const LOGIN_ROUTE = '/login' as Href;
const HOME_ROUTE = '/' as Href;
const PROVIDER_START_ROUTE = '/provider/start' as Href;

export function WorkspaceGuard({ allowDemo = true, children, workspace }: WorkspaceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, status, useDemoSession } = useAuth();
  const isProviderStart = workspace === 'provider' && pathname === '/provider/start';

  if (status === 'loading') {
    return (
      <Screen>
        <AppCard>
          <StatusBadge label={t('checkingSession')} tone="neutral" />
          <AppText variant="sectionTitle">{t('checkingTasklySession')}</AppText>
        </AppCard>
      </Screen>
    );
  }

  if (status === 'demo' && allowDemo) {
    return <>{children}</>;
  }

  const hasAccess =
    status === 'authenticated' &&
    (workspace === 'customer' ? canAccessCustomerWorkspace(session) : canAccessProviderWorkspace(session));

  if (hasAccess || isProviderStart) {
    return <>{children}</>;
  }

  if (status === 'unauthenticated' || status === 'error' || !session) {
    return (
      <Screen>
        <AppCard>
          <StatusBadge label={t('loginRequired')} tone="neutral" />
          <AppText variant="sectionTitle">{t('loginRequired')}</AppText>
          <AppText color={colors.slate700}>
            {t('loginToUseWorkspace')}
          </AppText>
          <AppButton onPress={() => router.push(LOGIN_ROUTE)}>{t('loginTitle')}</AppButton>
          {allowDemo ? (
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          ) : null}
          <AppButton onPress={() => router.push(HOME_ROUTE)} tone="neutral" variant="ghost">
            {t('backToTaskly')}
          </AppButton>
        </AppCard>
      </Screen>
    );
  }

  const entryState = getWorkspaceEntryState(session, workspace, status);

  return (
    <Screen>
      <AppCard>
        <StatusBadge label={t('workspaceNotAvailable')} tone="warning" />
        <AppText variant="sectionTitle">{t('workspaceNotAvailable')}</AppText>
        <AppText color={colors.slate700}>
          {workspace === 'provider' ? getRecommendedProviderNextAction(session) : entryState.description}
        </AppText>
        <View>
          {workspace === 'provider' ? (
            <AppButton onPress={() => router.push(PROVIDER_START_ROUTE)} variant="outline">
              {t('startProviderSetup')}
            </AppButton>
          ) : null}
        </View>
        <AppButton onPress={() => router.push(HOME_ROUTE)} tone="neutral" variant="ghost">
          {t('backToTaskly')}
        </AppButton>
      </AppCard>
    </Screen>
  );
}
