import { Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SessionStatusCard, TasklyLogoText, WorkspaceAccessCard, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
  getProviderModeSummary,
  getWorkspaceEntryState,
} from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;
const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;
const PROVIDER_DASHBOARD_ROUTE = '/provider/dashboard' as Href;
const PROVIDER_START_ROUTE = '/provider/start' as Href;

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, status, useDemoSession } = useAuth();
  const customerEntry = getWorkspaceEntryState(session, 'customer', status);
  const providerEntry = getWorkspaceEntryState(session, 'provider', status);
  const providerTarget =
    status === 'demo' || (session && canAccessProviderWorkspace(session) && session.nextAction.type === 'none')
      ? PROVIDER_DASHBOARD_ROUTE
      : PROVIDER_START_ROUTE;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700} style={styles.subtitle}>
          Tell us what you need - Taskly will guide you step by step.
        </AppText>
      </View>

      <SessionStatusCard onLoginPress={() => router.push(LOGIN_ROUTE)} />

      {status !== 'authenticated' && status !== 'demo' ? (
        <AppButton onPress={() => router.push(LOGIN_ROUTE)} variant="outline">
          Login
        </AppButton>
      ) : null}

      <AppCard>
        <View style={styles.badges}>
          <StatusBadge
            label={session ? `Session user: ${session.user.displayName}` : 'No active session'}
            tone={session ? 'success' : 'neutral'}
          />
          <StatusBadge label={status === 'demo' ? 'Demo active' : 'Workspace guidance'} tone="neutral" />
          <StatusBadge
            label={canAccessCustomerWorkspace(session) ? t('customerWorkspace') : 'Customer pending'}
            tone={canAccessCustomerWorkspace(session) ? 'core' : 'neutral'}
          />
          <StatusBadge
            label={canAccessProviderWorkspace(session) ? getProviderModeSummary(session) : 'Provider pending'}
            tone={canAccessProviderWorkspace(session) ? 'pro' : 'neutral'}
          />
        </View>
        <AppText color={colors.slate700}>
          Taskly uses your account permissions to show the right workspace.
        </AppText>
      </AppCard>

      <View style={styles.cards}>
        <WorkspaceAccessCard
          accessState={customerEntry.state}
          accent="customer"
          actionLabel={customerEntry.actionLabel}
          description="For Taskly tasks, Taskly Pro projects, protected payments, messages, approvals, and support."
          note={customerEntry.description}
          onPress={() => router.push(customerEntry.state === 'loginRequired' ? LOGIN_ROUTE : CUSTOMER_HOME_ROUTE)}
          onSecondaryPress={status === 'unauthenticated' || status === 'error' ? useDemoSession : undefined}
          secondaryLabel={status === 'unauthenticated' || status === 'error' ? t('continueDemoMode') : undefined}
          title={t('customerWorkspace')}
        />

        <WorkspaceAccessCard
          accessState={providerEntry.state}
          accent="provider"
          actionLabel={providerEntry.actionLabel}
          description="For Taskly tasks, Taskly Pro projects, profile status, responses, and messages."
          note={providerEntry.description}
          onPress={() => router.push(providerEntry.state === 'loginRequired' ? LOGIN_ROUTE : providerTarget)}
          onSecondaryPress={status === 'unauthenticated' || status === 'error' ? useDemoSession : undefined}
          secondaryLabel={status === 'unauthenticated' || status === 'error' ? t('continueDemoMode') : undefined}
          title={t('providerWorkspace')}
        />
      </View>

      <AppText color={colors.slate500} style={styles.note} variant="caption">
        You can switch workspaces when your account has the right permissions.
      </AppText>

      <AppCard>
        <StatusBadge label="How Taskly works" tone="neutral" />
        <View style={styles.howItWorks}>
          <View style={styles.howItem}>
            <StatusBadge label={t('customerWorkspace')} tone="core" />
            <AppText color={colors.slate700}>Post Taskly tasks or Taskly Pro projects.</AppText>
          </View>
          <View style={styles.howItem}>
            <StatusBadge label={t('providerWorkspace')} tone="pro" />
            <AppText color={colors.slate700}>Manage Taskly tasks and Taskly Pro projects.</AppText>
          </View>
          <View style={styles.howItem}>
            <StatusBadge label="Admin" tone="neutral" />
            <AppText color={colors.slate700}>{t('adminWebOnly')}.</AppText>
          </View>
        </View>
      </AppCard>

      <WorkspaceSwitchHint compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  howItWorks: {
    gap: spacing.md,
  },
  howItem: {
    gap: spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 360,
  },
});
