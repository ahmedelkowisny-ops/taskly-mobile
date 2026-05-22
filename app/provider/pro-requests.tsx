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
        <AppText color={colors.slate700}>
          Approved Pros see requests based on approved categories and cities inside the Provider Workspace.
        </AppText>
      </View>

      <EmptyStateCard
        accent="pro"
        body="No matching Pro requests right now. Pro matching and visibility rules will come from the backend."
        title="No matching Pro requests"
      />

      <AppCard accentColor={colors.proAmber500}>
        <StatusBadge label="Pro only" tone="pro" />
        <AppText color={colors.slate700}>
          Keep contact details inside Taskly until the allowed unlock/contact flow.
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body="Pro work uses approved categories and cities inside the Provider Workspace. It does not require Stripe verification for a Pro-only flow."
        title="Pro request guidance"
        tone="pro"
      />
    </Screen>
  );
}
