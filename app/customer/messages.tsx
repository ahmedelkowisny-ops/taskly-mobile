import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerMessagesScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('messages')}</AppText>
        <AppText color={colors.slate700}>
          Customer Workspace conversations with Core Taskers and Pros will appear here.
        </AppText>
      </View>

      <EmptyStateCard
        body="No conversations yet. When real messaging arrives, loading, empty, error, and unauthorized states should stay visible."
        title="No customer messages"
      />

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Contact rules" tone="core" />
        <AppText color={colors.slate700}>
          Pro phone and email details are not shown before the allowed unlock/contact flow.
        </AppText>
      </AppCard>
    </Screen>
  );
}
