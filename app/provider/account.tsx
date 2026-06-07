import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import {
  NotificationSettingsCard,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppCard, AppText, Screen } from '@/src/components/ui';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function ProviderSettingsScreen() {
  useI18n();

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <ProviderTopBar />

      <AppCard accentColor={colors.tasklyBlue600} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Ionicons color={colors.tasklyBlue600} name="notifications-outline" size={22} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="screenTitle">{t('notifications')}</AppText>
            <AppText color={colors.slate700}>{t('providerSettingsSubtitle')}</AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.settings}>
        <NotificationSettingsCard workspace="provider" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    borderColor: colors.border,
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
  settings: {
    gap: spacing.md,
  },
});
