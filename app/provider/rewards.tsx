import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ProviderTopBar } from '@/src/components/taskly';
import { AppCard, AppText, Screen } from '@/src/components/ui';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderRewardsScreen() {
  useI18n();

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <AppCard accentColor={colors.tasklyBlue600} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Ionicons color={colors.tasklyBlue600} name="gift-outline" size={22} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="screenTitle">{t('rewards')}</AppText>
            <AppText color={colors.slate700}>{t('rewardsIntro')}</AppText>
          </View>
        </View>
      </AppCard>

      <AppCard backgroundColor={colors.white} style={styles.card}>
        <AppText color={colors.slate500} variant="small">{t('availableRewards')}</AppText>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.tasklyBlue600} name="gift-outline" size={24} />
          </View>
          <AppText color={colors.navy900} variant="sectionTitle">{t('noRewardsYet')}</AppText>
          <AppText color={colors.slate700} style={styles.emptyBody}>{t('rewardsComingSoonBody')}</AppText>
        </View>
      </AppCard>

      <AppCard backgroundColor={colors.white} style={styles.card}>
        <AppText color={colors.navy900} variant="sectionTitle">{t('rewardHistory')}</AppText>
        <AppText color={colors.slate700}>{t('noRewardsYet')}</AppText>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    ...designTokens.shadows.card,
    borderColor: colors.border,
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  emptyBody: {
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  header: {
    borderColor: colors.tasklyBlueBorder,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
});
