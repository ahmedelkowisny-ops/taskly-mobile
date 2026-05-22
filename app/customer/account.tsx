import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerAccountScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>Customer settings, trust details, and notification preferences will live here.</AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Customer account" tone="core" />
        <AppText variant="sectionTitle">Signed in as Customer</AppText>
        <AppText color={colors.slate700}>Real account state will come from the Taskly backend/API later.</AppText>
      </AppCard>

      <AssistantGuideCard
        body="Account screens should explain missing data, payment readiness, and trust steps inline without opening blocking popups."
        title="Account guidance"
      />
    </Screen>
  );
}
