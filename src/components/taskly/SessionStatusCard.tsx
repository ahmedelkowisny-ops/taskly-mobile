import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/lib/auth/useAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { AppButton, AppCard, AppText, StatusBadge } from '../ui';

type SessionStatusCardProps = {
  compact?: boolean;
  onLoginPress?: () => void;
};

function getStatusCopy(status: ReturnType<typeof useAuth>['status'], name?: string) {
  if (status === 'loading') {
    return {
      badge: t('loading'),
      body: t('loadingCustomerArea'),
      title: t('tasklyAccount'),
      tone: 'neutral' as const,
    };
  }

  if (status === 'authenticated') {
    return {
      badge: t('signedInReady'),
      body: t('workspacePermissionsHelper'),
      title: name ? t('welcomeName').replace('{{name}}', name) : t('tasklyAccount'),
      tone: 'success' as const,
    };
  }

  if (status === 'demo') {
    return {
      badge: t('demoPreview'),
      body: t('demoModeNoRealPayments'),
      title: name ? t('welcomeName').replace('{{name}}', name) : t('demoPreview'),
      tone: 'warning' as const,
    };
  }

  if (status === 'error') {
    return {
      badge: t('backendUnavailable'),
      body: t('retryOrContinueDemoBackendUnavailable'),
      title: t('tasklyAccount'),
      tone: 'danger' as const,
    };
  }

  return {
    badge: t('loginRequired'),
    body: t('enterEmailPassword'),
    title: t('tasklyAccount'),
    tone: 'neutral' as const,
  };
}

export function SessionStatusCard({ compact = false, onLoginPress }: SessionStatusCardProps) {
  const { error, logout, refreshSession, session, status, useDemoSession } = useAuth();
  const name = session?.user.displayName;
  const copy = getStatusCopy(status, name);
  const canUseDemo = status === 'error' || status === 'unauthenticated';

  return (
    <AppCard accentColor={status === 'demo' ? colors.proAmber500 : undefined}>
      <View style={styles.header}>
        <StatusBadge label={copy.badge} tone={copy.tone} />
        <AppText variant={compact ? 'bodyStrong' : 'sectionTitle'}>{copy.title}</AppText>
      </View>

      <AppText color={colors.slate700}>{copy.body}</AppText>

      {status === 'authenticated' && session?.user.email ? (
        <AppText color={colors.slate500} variant="caption">
          {session.user.email}
        </AppText>
      ) : null}

      {error ? (
        <AppText color={colors.slate500} variant="caption">
          {error.message}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {status !== 'authenticated' && onLoginPress ? (
          <AppButton onPress={onLoginPress}>{t('loginTitle')}</AppButton>
        ) : null}

        <AppButton
          loading={status === 'loading'}
          onPress={() => {
            void refreshSession();
          }}
          variant="outline">
          {t('refresh')}
        </AppButton>

        {status === 'authenticated' ? (
          <AppButton
            onPress={() => {
            void logout();
          }}
            tone="neutral"
            variant="outline">
            {t('signOut')}
          </AppButton>
        ) : null}

        {canUseDemo ? (
          <AppButton onPress={useDemoSession} tone="pro">
            {t('continueDemoMode')}
          </AppButton>
        ) : null}

      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
});
