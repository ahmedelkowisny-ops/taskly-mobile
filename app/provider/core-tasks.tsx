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
        <AppText color={colors.slate700}>Core Tasker marketplace tasks will appear here.</AppText>
      </View>

      <EmptyStateCard
        body="No Core tasks available in the placeholder state. Matching and cancellation rules remain backend-owned."
        title="No Core tasks"
      />

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Core Tasker" tone="core" />
        <AppText color={colors.slate700}>This route is separate from Provider Pro request handling.</AppText>
      </AppCard>
    </Screen>
  );
}
