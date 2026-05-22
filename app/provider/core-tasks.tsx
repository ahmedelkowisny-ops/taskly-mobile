import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderCoreTasksScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerCore" />
        <AppText variant="screenTitle">{t('coreTasks')}</AppText>
        <AppText color={colors.slate700}>
          Approved Core Taskers see matching tasks by city and category inside the Provider Workspace.
        </AppText>
      </View>

      <EmptyStateCard
        body="No available Core tasks right now. Matching, assignment, cancellation, and payout states remain backend-owned."
        title="No matching Core tasks"
      />

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label="Core Tasker" tone="core" />
          <StatusBadge label="Stripe verification" tone="warning" />
        </View>
        <AppText color={colors.slate700}>
          Stripe verification is shown here only as a Core payout readiness placeholder, not as Pro logic.
        </AppText>
      </AppCard>
    </Screen>
  );
}
