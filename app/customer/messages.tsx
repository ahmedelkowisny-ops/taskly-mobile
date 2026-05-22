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
        <AppText color={colors.slate700}>Customer conversations will appear after backend chat data is connected.</AppText>
      </View>

      <EmptyStateCard
        body="No messages yet. This screen should later handle unauthorized access and failed message loads clearly."
        title="No conversations"
      />

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Contact rules" tone="core" />
        <AppText color={colors.slate700}>
          Pro phone and email details are intentionally not shown in this placeholder foundation.
        </AppText>
      </AppCard>
    </Screen>
  );
}
