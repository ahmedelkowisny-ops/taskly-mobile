import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerAccountScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>
          Customer Workspace settings, trust details, and notification preferences will live here.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Customer account" tone="core" />
        <AppText variant="sectionTitle">Customer Workspace access</AppText>
        <AppText color={colors.slate700}>Real account state will come from the Taskly backend/API later.</AppText>
      </AppCard>

      <AssistantGuideCard
        body="Account screens should explain missing data, payment readiness, and trust steps inline without opening blocking popups."
        title="Account guidance"
      />

      <WorkspaceSwitchHint />

      <AppButton onPress={() => router.push('/customer/onboarding')} variant="outline">
        {t('setupCustomerWorkspace')}
      </AppButton>

      <AppButton onPress={() => router.push('/')} variant="ghost">
        Back to Taskly
      </AppButton>
    </Screen>
  );
}
