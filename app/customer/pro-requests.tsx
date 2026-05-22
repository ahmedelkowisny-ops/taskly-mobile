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
          Pro request comparison will be unlocked only through the approved backend flow.
        </AppText>
      </View>

      <EmptyStateCard
        actionLabel={t('postProRequest')}
        accent="pro"
        body="No Pro requests yet. Provider contact details stay hidden until the allowed unlock/contact flow."
        title="No Pro requests"
      />

      <AssistantGuideCard
        body="This premium inline card is reserved for safe explanations before unlock and payment-sensitive actions."
        title={t('unlockAndComparePros')}
        tone="pro"
      />
    </Screen>
  );
}
