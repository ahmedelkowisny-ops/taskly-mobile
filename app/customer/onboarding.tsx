import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerOnboardingScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">{t('setupCustomerWorkspace')}</AppText>
        <AppText color={colors.slate700}>
          A simple intro before real account setup, posting, and payment flows are connected.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <StatusBadge label="Customer" tone="core" />
        <AppText variant="sectionTitle">Small fixed-scope tasks</AppText>
        <AppText color={colors.slate700}>
          Post clear Taskly tasks, chat with providers, track progress, and follow protected payment states.
        </AppText>
        <AppButton>{t('postTask')}</AppButton>
      </AppCard>

      <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
        <StatusBadge label="Pro" tone="pro" />
        <AppText variant="sectionTitle">Larger Taskly Pro projects</AppText>
        <AppText color={colors.slate700}>
          Post larger quote-based requests for Taskly Pro professionals and compare responses when Taskly makes them available.
        </AppText>
        <AppButton tone="pro">{t('postProRequest')}</AppButton>
      </AppCard>

      <AppCard accentColor={colors.success600}>
        <StatusBadge label={t('paymentProtectedCoreTasks')} tone="success" />
        <AppText color={colors.slate700}>
          Your payment is protected until the task is completed and approved. Taskly guides each step.
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body="Taskly will guide you before payment-sensitive actions so you understand what is protected, what is unlocked, and what happens next."
        title="Guided next steps"
      />

      <AppButton onPress={() => router.push('/customer/home')} variant="ghost">
        Back to Customer Workspace
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
});
