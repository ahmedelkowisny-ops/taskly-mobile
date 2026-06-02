import { View } from 'react-native';

import {
  NotificationSettingsCard,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppText, Screen } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderNotificationsScreen() {
  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="screenTitle">{t('notifications')}</AppText>
        <AppText color={colors.slate700}>{t('notificationsScreenSubtitle')}</AppText>
      </View>

      <NotificationSettingsCard workspace="provider" />
    </Screen>
  );
}
