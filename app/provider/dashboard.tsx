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
        <AppText variant="screenTitle">{t('providerWorkspace')}</AppText>
        <AppText color={colors.slate700}>
          Welcome, {mockAuth.currentProvider.displayName}. Core and Pro are separate modes inside the Provider Workspace.
        </AppText>
      </View>

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600} style={styles.panel}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">{t('coreTasks')}</AppText>
          <AppText color={colors.slate700}>
            Core Tasker work can live inside the Provider Workspace alongside Pro work.
          </AppText>
          <StatusBadge label="0 available" tone="core" />
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50} style={styles.panel}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">{t('proRequests')}</AppText>
          <AppText color={colors.slate700}>
            Taskly Pro requests stay visually and functionally separate from Core Tasks.
          </AppText>
          <StatusBadge label="0 matching" tone="pro" />
        </AppCard>
      </View>

      <View style={styles.grid}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <ModeBadge mode="providerCore" />
          <AppText variant="sectionTitle">Core payout status</AppText>
          <AppText color={colors.slate700}>Stripe verification required for Core payouts.</AppText>
          <StatusBadge label="Stripe verification" tone="warning" />
        </AppCard>

        <AppCard accentColor={colors.proAmber500} backgroundColor={colors.proOrange50}>
          <ModeBadge mode="providerPro" />
          <AppText variant="sectionTitle">Pro readiness</AppText>
          <AppText color={colors.slate700}>Pro profile review and category approval are required for Pro work.</AppText>
          <StatusBadge label="Profile review" tone="pro" />
        </AppCard>
      </View>

      <AssistantGuideCard
        body="Core Tasks and Pro Requests stay separate so each mode can follow backend-approved rules inside one Taskly app."
        title="Mode guidance"
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
