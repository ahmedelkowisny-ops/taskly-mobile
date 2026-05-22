import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { TasklyLogoText } from '@/src/components/taskly';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <TasklyLogoText />
        <AppText color={colors.slate700}>
          Local help and professional services in Bulgaria, prepared as two focused mobile apps.
        </AppText>
      </View>

      <View style={styles.cards}>
        <AppCard accentColor={colors.tasklyBlue600}>
          <AppText variant="sectionTitle">Taskly Customer</AppText>
          <AppText color={colors.slate700}>
            Post tasks, follow requests, and message providers when real data is connected.
          </AppText>
          <AppButton onPress={() => router.push('/customer/home')}>Continue as Customer</AppButton>
        </AppCard>

        <AppCard accentColor={colors.proOrange600}>
          <AppText variant="sectionTitle">Taskly Provider</AppText>
          <AppText color={colors.slate700}>
            Keep Core Tasker work and Pro professional requests clearly separated.
          </AppText>
          <AppButton onPress={() => router.push('/provider/dashboard')} tone="pro">
            Continue as Provider
          </AppButton>
        </AppCard>
      </View>
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
});
