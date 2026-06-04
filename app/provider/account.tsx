import { View } from 'react-native';

import {
  NotificationSettingsCard,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppText, Screen } from '@/src/components/ui';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderSettingsScreen() {
  useI18n();

  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="screenTitle">{t('notifications')}</AppText>
        <AppText color={colors.slate700}>{t('providerSettingsSubtitle')}</AppText>
      </View>

      <NotificationSettingsCard workspace="provider" />
    </Screen>
  );
}
