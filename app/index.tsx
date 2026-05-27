import { Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LanguageToggle, SessionStatusCard, TasklyLogoText, WorkspaceAccessCard, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
  getProviderModeSummary,
  getWorkspaceEntryState,
} from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const LOGIN_ROUTE = '/login' as Href;
const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;
const PROVIDER_DASHBOARD_ROUTE = '/provider/dashboard' as Href;
const PROVIDER_START_ROUTE = '/provider/start' as Href;

export default function WelcomeScreen() {
  useI18n();
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
      <View style={styles.topBar}>
        <LanguageToggle />
      </View>

      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t('welcomeSubtitle')}
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
            label={session ? `${t('sessionUser')}: ${session.user.displayName}` : t('noActiveSession')}
            tone={session ? 'success' : 'neutral'}
          />
          <StatusBadge label={status === 'demo' ? t('demoActive') : t('workspaceGuidance')} tone="neutral" />
          <StatusBadge
            label={canAccessCustomerWorkspace(session) ? t('customerWorkspace') : t('customerPending')}
            tone={canAccessCustomerWorkspace(session) ? 'core' : 'neutral'}
          />
          <StatusBadge
            label={canAccessProviderWorkspace(session) ? getProviderModeSummary(session) : t('providerPending')}
            tone={canAccessProviderWorkspace(session) ? 'pro' : 'neutral'}
          />
        </View>
        <AppText color={colors.slate700}>{t('workspacePermissionsHelper')}</AppText>
      </AppCard>

      <View style={styles.cards}>
        <WorkspaceAccessCard
          accessState={customerEntry.state}
          accent="customer"
          actionLabel={customerEntry.actionLabel}
          description={t('customerWorkspaceDescription')}
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
          description={t('providerWorkspaceDescription')}
          note={providerEntry.description}
          onPress={() => router.push(providerEntry.state === 'loginRequired' ? LOGIN_ROUTE : providerTarget)}
          onSecondaryPress={status === 'unauthenticated' || status === 'error' ? useDemoSession : undefined}
          secondaryLabel={status === 'unauthenticated' || status === 'error' ? t('continueDemoMode') : undefined}
          title={t('providerWorkspace')}
        />
      </View>

      <AppText color={colors.slate500} style={styles.note} variant="caption">
        {t('switchWorkspaceHelper')}
      </AppText>

      <AppCard>
        <StatusBadge label={t('howTasklyWorks')} tone="neutral" />
        <View style={styles.howItWorks}>
          <View style={styles.howItem}>
            <StatusBadge label={t('customerWorkspace')} tone="core" />
            <AppText color={colors.slate700}>{t('customerHowTasklyWorks')}</AppText>
          </View>
          <View style={styles.howItem}>
            <StatusBadge label={t('providerWorkspace')} tone="pro" />
            <AppText color={colors.slate700}>{t('providerHowTasklyWorks')}</AppText>
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
  topBar: {
    alignItems: 'flex-end',
  },
});
