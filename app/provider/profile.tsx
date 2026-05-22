import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderProfileScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('profile')}</AppText>
        <AppText color={colors.slate700}>
          Provider Workspace profile areas for Core Taskers and Taskly Pro professionals.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <ModeBadge mode="providerCore" />
        <AppText variant="sectionTitle">Core Tasker profile</AppText>
        <AppText color={colors.slate700}>Skills, coverage area, and trust signals will be backend-backed.</AppText>
      </AppCard>

      <AppCard accentColor={colors.proOrange600}>
        <ModeBadge mode="providerPro" />
        <AppText variant="sectionTitle">Pro professional profile</AppText>
        <AppText color={colors.slate700}>
          Public phone and email remain hidden until the allowed unlock/contact flow.
        </AppText>
      </AppCard>

      <AppCard>
        <StatusBadge label="Settings" tone="neutral" />
        <AppText variant="sectionTitle">Provider account</AppText>
        <AppText color={colors.slate700}>
          Account remains available without crowding the Provider Workspace tab bar.
        </AppText>
        <AppButton onPress={() => router.push('/provider/account')} variant="outline">
          Open Account
        </AppButton>
      </AppCard>

      <AssistantGuideCard
        body="Pro-only setup should not depend on Stripe verification in this mobile foundation."
        title="Profile readiness"
        tone="pro"
      />

      <WorkspaceSwitchHint />
    </Screen>
  );
}
