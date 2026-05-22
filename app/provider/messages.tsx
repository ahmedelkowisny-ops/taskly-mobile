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
        <AppText color={colors.slate700}>
          Provider Workspace conversations should keep Core and Pro context visible.
        </AppText>
      </View>

      <EmptyStateCard
        body="No provider messages yet. Future threads should clearly handle loading, empty, error, and unauthorized states."
        title="No provider messages"
      />

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText color={colors.slate700}>
          Message previews should show whether a thread belongs to Core tasks or Pro requests.
        </AppText>
      </AppCard>
    </Screen>
  );
}
