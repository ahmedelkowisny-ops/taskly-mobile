import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerTasksScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('myTasks')}</AppText>
        <AppText color={colors.slate700}>
          Track small fixed-scope tasks from the Customer Workspace.
        </AppText>
      </View>

      <EmptyStateCard
        actionLabel={t('postTask')}
        body="You have no active Core tasks yet. Post a clear task to start receiving provider interest later."
        title="No Core tasks yet"
      />

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusBadge label="OPEN" tone="core" />
          <StatusBadge label="PAYMENT PROTECTED" tone="success" />
        </View>
        <AppText variant="sectionTitle">{t('paymentProtected')}</AppText>
        <AppText color={colors.slate700}>
          Safe placeholder wording only: when payments are added, Taskly will show backend-provided payment protection status without duplicating payment rules in the app.
        </AppText>
      </AppCard>
    </Screen>
  );
}
