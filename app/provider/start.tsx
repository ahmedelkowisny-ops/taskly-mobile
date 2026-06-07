import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ModeBadge, ProviderStatusCard, ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import { canAccessProviderWorkspace, hasApprovedProMode } from '@/src/lib/auth/workspaceAccess';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderStartScreen() {
  useI18n();
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const hasProviderAccess = canAccessProviderWorkspace(session);
  const showProReadiness = status === 'demo' || hasApprovedProMode(session);

  useEffect(() => {
    if (status !== 'loading' && hasProviderAccess) {
      router.replace('/provider/dashboard' as Href);
    }
  }, [hasProviderAccess, router, status]);
  const mainTitle = hasProviderAccess ? t('providerReadyTitle') : t('providerProfileReviewing');
  const mainBody = hasProviderAccess ? t('providerReadyHelper') : t('providerReviewHelper');
  const primaryActionLabel = hasProviderAccess ? t('openProviderArea') : t('reviewProviderSetup');
  const coreStatusLabel = coreTaskerStatus === 'approved' ? t('available') : t('providerProfileReviewing');
  const proStatusLabel = proStatus === 'approved' ? t('available') : t('proProfileReview');

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <View style={styles.header}>
        <AppText style={styles.screenTitle} variant="screenTitle">
          {t('startProviderWorkspace')}
        </AppText>
        <AppText color={colors.slate700}>{t('providerStartBody')}</AppText>
      </View>

      <AppCard
        accentColor={hasProviderAccess ? colors.tasklyBlue600 : colors.proOrange600}
        backgroundColor={hasProviderAccess ? colors.tasklyBlue50 : colors.proOrange50}
        style={[styles.readinessCard, hasProviderAccess ? styles.readyCard : styles.reviewCard]}>
        <StatusBadge label={status === 'demo' ? t('demoPreview') : t('accountStatus')} tone="neutral" />
        <AppText variant="sectionTitle">{mainTitle}</AppText>
        <AppText color={colors.slate700}>{mainBody}</AppText>
      </AppCard>

      <ProviderStatusCard
        accent="core"
        description={t('tasklyTaskerBody')}
        statusLabel={coreStatusLabel}
        title={t('coreTasker')}
      />

      {showProReadiness ? (
        <ProviderStatusCard
          accent="pro"
          description={t('tasklyProProviderBody')}
          statusLabel={proStatusLabel}
          title={t('tasklyPro')}
        />
      ) : null}

      <AppCard style={styles.modeCard}>
        <View style={styles.modeRow}>
          <ModeBadge mode="providerCore" />
          {showProReadiness ? <ModeBadge mode="providerPro" /> : null}
        </View>
        <AppText color={colors.slate700}>{t(showProReadiness ? 'providerWorkspaceDescription' : 'taskerStartBody')}</AppText>
      </AppCard>

      <AppButton
        onPress={() => router.push('/provider/dashboard')}
        style={styles.primaryButton}
        tone={showProReadiness ? 'pro' : 'core'}>
        {primaryActionLabel}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + 96,
  },
  header: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  modeCard: {
    borderColor: colors.border,
    ...designTokens.shadows.card,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryButton: {
    borderRadius: radius.card,
    minHeight: 54,
  },
  readinessCard: {
    borderRadius: radius.card,
    ...designTokens.shadows.card,
  },
  readyCard: {
    borderColor: colors.tasklyBlueBorder,
  },
  reviewCard: {
    borderColor: colors.proOrangeBorder,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
});
