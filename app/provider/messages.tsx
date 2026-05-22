import { View } from 'react-native';

import { EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderMessagesScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('messages')}</AppText>
        <AppText color={colors.slate700}>Provider conversations for Core and Pro work will share this surface.</AppText>
      </View>

      <EmptyStateCard
        body="No provider messages yet. Future message threads should clearly handle loading, empty, error, and unauthorized states."
        title="No messages"
      />

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText color={colors.slate700}>
          Keep Core and Pro context visible in each future conversation thread.
        </AppText>
      </AppCard>
    </Screen>
  );
}
