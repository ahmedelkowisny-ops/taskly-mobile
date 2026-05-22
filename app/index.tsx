import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700} style={styles.subtitle}>
          Trusted local services in Bulgaria, with separate workspaces for customers and providers.
        </AppText>
      </View>

      <View style={styles.cards}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <StatusBadge label="Customer workspace" tone="core" />
          <AppText variant="sectionTitle">Taskly Customer</AppText>
          <AppText color={colors.slate700}>
            Post tasks, follow requests, compare providers, and manage payments safely.
          </AppText>
          <AppButton onPress={() => router.push('/customer/home')}>Continue as Customer</AppButton>
        </AppCard>

        <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
          <StatusBadge label="Provider workspace" tone="pro" />
          <AppText variant="sectionTitle">Taskly Provider</AppText>
          <AppText color={colors.slate700}>
            Manage Core tasks and Pro requests from one provider workspace.
          </AppText>
          <AppButton onPress={() => router.push('/provider/dashboard')} tone="pro">
            Continue as Provider
          </AppButton>
        </AppCard>
      </View>

      <AppText color={colors.slate500} style={styles.note} variant="caption">
        Customer and Provider workspaces stay separate so each flow stays clear.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.lg,
  },
  content: {
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  note: {
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 360,
  },
});
