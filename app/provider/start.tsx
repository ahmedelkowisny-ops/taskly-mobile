import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LanguageToggle, ModeBadge, ProviderStatusCard } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { useAuth } from '@/src/lib/auth/useAuth';
import { canAccessProviderWorkspace } from '@/src/lib/auth/workspaceAccess';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderStartScreen() {
  useI18n();
  const router = useRouter();
  const { session: authSession, status } = useAuth();
  const session = authSession ?? mockAuth.currentSession;
  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const hasProviderAccess = canAccessProviderWorkspace(session);
  const mainTitle = hasProviderAccess ? t('providerReadyTitle') : t('providerProfileReviewing');
  const mainBody = hasProviderAccess ? t('providerReadyHelper') : t('providerReviewHelper');
  const primaryActionLabel = hasProviderAccess ? t('openProviderArea') : t('reviewProviderSetup');
  const coreStatusLabel = coreTaskerStatus === 'approved' ? t('available') : t('providerProfileReviewing');
  const proStatusLabel = proStatus === 'approved' ? t('available') : t('proProfileReview');

  return (
    <Screen>
      <View style={styles.topBar}>
        <StatusBadge label={t('providerArea')} tone="neutral" />
        <LanguageToggle />
      </View>

      <View style={styles.header}>
        <AppText style={styles.screenTitle} variant="screenTitle">
          {t('startProviderWorkspace')}
        </AppText>
        <AppText color={colors.slate700}>{t('providerStartBody')}</AppText>
      </View>

      <AppCard accentColor={hasProviderAccess ? colors.tasklyBlue600 : colors.proOrange600}>
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

      <ProviderStatusCard
        accent="pro"
        description={t('tasklyProProviderBody')}
        statusLabel={proStatusLabel}
        title={t('tasklyPro')}
      />

      <AppCard>
        <View style={styles.modeRow}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText color={colors.slate700}>{t('providerWorkspaceDescription')}</AppText>
      </AppCard>

      <AppButton onPress={() => router.push('/provider/dashboard')} tone="pro">
        {primaryActionLabel}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 26,
  },
});
