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
        <AppText color={colors.slate700}>Customer Core task tracking will live here after API integration.</AppText>
      </View>

      <EmptyStateCard
        actionLabel={t('postTask')}
        body="You have no active tasks yet. Future loading, empty, error, and unauthorized states should stay explicit on this screen."
        title="No customer tasks"
      />

      <AppCard>
        <StatusBadge label="Customer Core" tone="core" />
        <AppText color={colors.slate700}>
          Placeholder only. Real matching, cancellation, payment, and dispute states must come from the backend.
        </AppText>
      </AppCard>
    </Screen>
  );
}
