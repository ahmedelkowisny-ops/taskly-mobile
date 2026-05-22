import { View } from 'react-native';

import { AssistantGuideCard, ModeBadge } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ProviderAccountScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <StatusBadge label="Provider" tone="neutral" />
        <AppText variant="screenTitle">{t('account')}</AppText>
        <AppText color={colors.slate700}>Provider account and role placeholder states.</AppText>
      </View>

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ModeBadge mode="providerCore" />
          <ModeBadge mode="providerPro" />
        </View>
        <AppText variant="sectionTitle">Dual provider mock state</AppText>
        <AppText color={colors.slate700}>
          Role authorization and Pro approval remain server-authoritative when real auth arrives.
        </AppText>
      </AppCard>

      <AssistantGuideCard
        body="Future account errors, loading states, empty states, and unauthorized states should be explicit and mobile-friendly."
        title="Account checks"
      />
    </Screen>
  );
}
