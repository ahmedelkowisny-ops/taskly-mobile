import { View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerProRequestsScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <StatusBadge label="Customer Pro" tone="pro" />
        <AppText variant="screenTitle">{t('myProRequests')}</AppText>
        <AppText color={colors.slate700}>
          Start larger professional projects and compare Pro responses only when the backend allows it.
        </AppText>
      </View>

      <EmptyStateCard
        actionLabel={t('postProRequest')}
        accent="pro"
        body="Pro requests are free to post. Customers unlock comparison details after meaningful Pro responses exist."
        title="No Pro requests yet"
      />

      <AssistantGuideCard
        body="Provider contact details stay hidden until the allowed unlock/contact flow."
        title={t('unlockAndComparePros')}
        tone="pro"
      />
    </Screen>
  );
}
