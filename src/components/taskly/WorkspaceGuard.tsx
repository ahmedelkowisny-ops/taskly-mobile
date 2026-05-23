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
          <StatusBadge label="Checking session" tone="neutral" />
          <AppText variant="sectionTitle">Checking your Taskly session...</AppText>
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
          <StatusBadge label="Login required" tone="neutral" />
          <AppText variant="sectionTitle">Login required</AppText>
          <AppText color={colors.slate700}>
            Login to use this workspace with your Taskly account, or continue in demo mode.
          </AppText>
          <AppButton onPress={() => router.push(LOGIN_ROUTE)}>Login</AppButton>
          {allowDemo ? (
            <AppButton onPress={useDemoSession} tone="pro" variant="outline">
              Continue in demo mode
            </AppButton>
          ) : null}
          <AppButton onPress={() => router.push(HOME_ROUTE)} tone="neutral" variant="ghost">
            Back to Taskly
          </AppButton>
        </AppCard>
      </Screen>
    );
  }

  const entryState = getWorkspaceEntryState(session, workspace, status);

  return (
    <Screen>
      <AppCard>
        <StatusBadge label="Workspace not available yet" tone="warning" />
        <AppText variant="sectionTitle">Workspace not available yet</AppText>
        <AppText color={colors.slate700}>
          {workspace === 'provider' ? getRecommendedProviderNextAction(session) : entryState.description}
        </AppText>
        <View>
          {workspace === 'provider' ? (
            <AppButton onPress={() => router.push(PROVIDER_START_ROUTE)} tone="pro" variant="outline">
              Start provider setup
            </AppButton>
          ) : null}
        </View>
        <AppButton onPress={() => router.push(HOME_ROUTE)} tone="neutral" variant="ghost">
          Back to Taskly
        </AppButton>
      </AppCard>
    </Screen>
  );
}
