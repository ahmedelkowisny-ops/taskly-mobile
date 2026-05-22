import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderDashboardScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('providerDashboard')}</AppText>
        <AppText color={colors.slate700}>
          Welcome, {mockAuth.currentProvider.displayName}. Core Tasker and Pro areas stay visually separate.
        </AppText>
      </View>

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600} style={styles.panel}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">{t('coreTasks')}</AppText>
          <AppText color={colors.slate700}>Approved Core Tasker work queue placeholder.</AppText>
        </AppCard>

        <AppCard accentColor={colors.proOrange600} style={styles.panel}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('proRequests')}</AppText>
          <AppText color={colors.slate700}>Pro request workspace without Stripe verification requirements.</AppText>
        </AppCard>
      </View>

      <AssistantGuideCard
        body="Provider onboarding hints should stay inline and should never duplicate role or unlock logic from the backend."
        title="Provider guidance"
        tone="pro"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  panel: {
    minHeight: 142,
  },
});
