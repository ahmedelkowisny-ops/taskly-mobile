import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/lib/auth/useAuth';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { AppButton, AppCard, AppText, StatusBadge } from '../ui';

type SessionStatusCardProps = {
  compact?: boolean;
};

function getStatusCopy(status: ReturnType<typeof useAuth>['status'], name?: string) {
  if (status === 'loading') {
    return {
      badge: 'Checking session',
      body: 'Checking your Taskly session...',
      title: 'Taskly session',
      tone: 'neutral' as const,
    };
  }

  if (status === 'authenticated') {
    return {
      badge: 'Signed in',
      body: 'Workspace access is coming from the Taskly backend.',
      title: `Signed in as ${name ?? 'Taskly user'}`,
      tone: 'success' as const,
    };
  }

  if (status === 'demo') {
    return {
      badge: 'Demo mode',
      body: 'Demo workspace mode is active.',
      title: `Demo user: ${name ?? 'Ahmed'}`,
      tone: 'warning' as const,
    };
  }

  if (status === 'error') {
    return {
      badge: 'Backend unavailable',
      body: 'Could not reach the Taskly backend.',
      title: 'Session check paused',
      tone: 'danger' as const,
    };
  }

  return {
    badge: 'Not signed in',
    body: 'You are not signed in yet. Login will be connected in the next phase.',
    title: 'Taskly account',
    tone: 'neutral' as const,
  };
}

export function SessionStatusCard({ compact = false }: SessionStatusCardProps) {
  const { clearSession, error, isDemoMode, refreshSession, session, status, useDemoSession } = useAuth();
  const name = session?.user.displayName;
  const copy = getStatusCopy(status, name);
  const canUseDemo = status === 'error' || status === 'unauthenticated';
  const canClear = Boolean(session) || isDemoMode;

  return (
    <AppCard accentColor={status === 'demo' ? colors.proAmber500 : undefined}>
      <View style={styles.header}>
        <StatusBadge label={copy.badge} tone={copy.tone} />
        <AppText variant={compact ? 'bodyStrong' : 'sectionTitle'}>{copy.title}</AppText>
      </View>

      <AppText color={colors.slate700}>{copy.body}</AppText>

      {error ? (
        <AppText color={colors.slate500} variant="caption">
          {error.message}
        </AppText>
      ) : null}

      {session ? (
        <View style={styles.badges}>
          <StatusBadge label={session.workspaceAccess.customer ? 'Customer access' : 'Customer pending'} tone="core" />
          <StatusBadge label={session.workspaceAccess.provider ? 'Provider access' : 'Provider pending'} tone="pro" />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          loading={status === 'loading'}
          onPress={() => {
            void refreshSession();
          }}
          variant="outline">
          Retry session check
        </AppButton>

        {canUseDemo ? (
          <AppButton onPress={useDemoSession} tone="pro">
            Continue in demo mode
          </AppButton>
        ) : null}

        {canClear ? (
          <AppButton onPress={clearSession} tone="neutral" variant="ghost">
            Clear local session/demo
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
