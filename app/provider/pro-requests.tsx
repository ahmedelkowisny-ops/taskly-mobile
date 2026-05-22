import { View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderProRequestsScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="providerPro" />
        <AppText variant="screenTitle">{t('proRequests')}</AppText>
        <AppText color={colors.slate700}>Provider Pro requests use orange and gold accents.</AppText>
      </View>

      <EmptyStateCard
        accent="pro"
        body="No Pro requests yet. This placeholder does not require Stripe verification and does not expose contact details."
        title="No Pro requests"
      />

      <AppCard accentColor={colors.proAmber500}>
        <StatusBadge label="Pro only" tone="pro" />
        <AppText color={colors.slate700}>
          Pro unlock, comparison, and contact permission logic must be returned by the backend when added.
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body="Use this premium card to guide Pros through safe next steps without turning it into a popup."
        title="Pro request guidance"
        tone="pro"
      />
    </Screen>
  );
}
