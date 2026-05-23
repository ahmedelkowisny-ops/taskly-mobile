import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge, WorkspaceSwitchHint } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderAccountScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>
          Provider Workspace account, role state, and notification placeholders.
        </AppText>
      </View>

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText variant="sectionTitle">Dual Provider Workspace</AppText>
        <AppText color={colors.slate700}>
          Core Tasker and Taskly Pro access can both live in the Provider Workspace when the backend authorizes them. Future workspace switching and notifications will follow account permissions.
        </AppText>
      </AppCard>

      <AppCard accentColor={colors.tasklyBlue600}>
        <ModeBadge mode="providerCore" />
        <AppText variant="sectionTitle">Core account readiness</AppText>
        <AppText color={colors.slate700}>Core payout and tasker approval states will be read from the backend.</AppText>
      </AppCard>

      <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
        <ModeBadge mode="providerPro" />
        <AppText variant="sectionTitle">Pro account readiness</AppText>
        <AppText color={colors.slate700}>Pro profile review and category approval stay separate from Core payouts.</AppText>
      </AppCard>

      <AssistantGuideCard
        body="Future account errors, loading states, empty states, and unauthorized states should be explicit and mobile-friendly."
        title="Account checks"
      />

      <WorkspaceSwitchHint />

      <AppButton onPress={() => router.push('/provider/start')} tone="pro" variant="outline">
        {t('startProviderWorkspace')}
      </AppButton>

      <AppButton onPress={() => router.push('/')} variant="ghost">
        Back to Taskly
      </AppButton>
    </Screen>
  );
}
