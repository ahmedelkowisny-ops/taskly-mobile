import { StyleSheet, View } from 'react-native';

import { AssistantGuideCard, EmptyStateCard, ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { mockAuth } from '@/src/lib/auth/mockAuth';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerHomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppText variant="screenTitle">Customer Home</AppText>
        <AppText color={colors.slate700}>
          Welcome, {mockAuth.currentCustomer.displayName}. This is a demo shell for Taskly customers.
        </AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={styles.row}>
          <StatusBadge label={t('paymentProtected')} tone="success" />
          <StatusBadge label="Backend later" tone="neutral" />
        </View>
        <AppText variant="sectionTitle">Get help nearby</AppText>
        <AppText color={colors.slate700}>
          Task posting, matching, payment protection, and dispute rules will stay server-authoritative.
        </AppText>
        <AppButton>{t('postTask')}</AppButton>
      </AppCard>

      <EmptyStateCard
        actionLabel={t('postProRequest')}
        accent="pro"
        body="No Pro requests yet. When connected, this area will guide customers through unlock-safe Pro comparison."
        title="Plan a professional service"
      />

      <AssistantGuideCard
        body="Use this inline guide before sensitive actions such as payment, unlocks, or onboarding steps."
        title={t('unlockAndComparePros')}
        tone="pro"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
